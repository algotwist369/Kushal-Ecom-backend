 
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { handleAsync } = require('../utils/handleAsync');
const { clearCart } = require('./cartController');
const sendEmail = require('../utils/sendEmail');
const { getCartProductPopulateConfig, PRODUCT_CART_SELECT_FIELDS } = require('../utils/productPopulate');

// Place Order
const createOrder = handleAsync(async (req, res) => {
    const { paymentMethod, coupon, shippingAddress } = req.body;
    
    console.log('📦 Order creation request:', { paymentMethod, coupon, shippingAddress });
    
    // Validate required fields
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.addressLine) {
        return res.status(400).json({ message: 'Shipping address is incomplete' });
    }
    
    if (!paymentMethod) {
        return res.status(400).json({ message: 'Payment method is required' });
    }
    
    const cart = await Cart.findOne({ user: req.user._id }).populate(getCartProductPopulateConfig());
    if (!cart || cart.items.length === 0) {
        return res.status(400).json({ message: 'Cart is empty' });
    }
    
    // Check if any items are out of stock
    for (const item of cart.items) {
        if (!item.product || item.product.stock < item.quantity) {
            return res.status(400).json({ 
                message: `${item.product?.name || 'Product'} is out of stock or has insufficient stock` 
            });
        }
    }

    // Calculate amounts including shipping
    let subtotal = 0;
    cart.items.forEach(item => {
        // Use the price from cart (already calculated for packs, bundles, etc.)
        subtotal += item.price * item.quantity;
    });
    
    // Calculate shipping cost based on product settings
    let shipping = 0;
    const hasFreeShipping = cart.items.some(item => item.product?.freeShipping === true);
    
    console.log('🚚 Shipping Calculation:', {
        hasFreeShipping,
        products: cart.items.map(item => ({
            name: item.product?.name,
            freeShipping: item.product?.freeShipping,
            minOrderForFreeShipping: item.product?.minOrderForFreeShipping,
            shippingCost: item.product?.shippingCost
        }))
    });
    
    if (hasFreeShipping) {
        shipping = 0;
        console.log('✅ Free shipping: Product has freeShipping enabled');
    } else {
        // Check for minimum order for free shipping
        const minForFreeShipping = Math.max(...cart.items.map(item => item.product?.minOrderForFreeShipping || 0));
        if (minForFreeShipping > 0 && subtotal >= minForFreeShipping) {
            shipping = 0;
            console.log(`✅ Free shipping: Order ₹${subtotal} meets minimum ₹${minForFreeShipping}`);
        } else {
            // Check for custom shipping costs
            const customShippingCost = cart.items.reduce((total, item) => {
                return total + (item.product?.shippingCost || 0);
            }, 0);
            shipping = customShippingCost > 0 ? customShippingCost : 49; // Default shipping
            console.log(`💰 Shipping: ${customShippingCost > 0 ? `Custom ₹${customShippingCost}` : 'Default ₹49'}`);
        }
    }
    
    const totalAmount = subtotal + shipping;
    let discount = 0;
    let finalAmount = totalAmount;
    let couponId = null;
    let appliedCouponDoc = null;

    if (coupon && coupon.code) {
        const Coupon = require('../models/Coupon');
        const couponDoc = await Coupon.findOne({
            code: coupon.code.toUpperCase(),
            isActive: true
        }).populate('applicableProducts', '_id').populate('applicableCategories', '_id');

        if (!couponDoc) {
            console.log('⚠️ Coupon not found or inactive:', coupon.code);
        } else if (!couponDoc.isValid()) {
            console.log('⚠️ Coupon expired or usage limit reached:', coupon.code);
        } else {
            const phoneNumber = shippingAddress?.phone;
            if (phoneNumber && !couponDoc.canUserClaim(phoneNumber)) {
                console.log('⚠️ Coupon per-user limit reached for phone:', phoneNumber);
            } else {
                const cartProductIds = cart.items
                    .map(item => item.product?._id)
                    .filter(Boolean)
                    .map(id => id.toString());
                const cartCategoryIds = cart.items
                    .map(item => item.product?.category?._id || item.product?.category)
                    .filter(Boolean)
                    .map(id => id.toString());

                if (
                    couponDoc.applicableProducts.length > 0 &&
                    !cartProductIds.some(id =>
                        couponDoc.applicableProducts.some(pId => pId._id
                            ? pId._id.toString() === id
                            : pId.toString() === id)
                    )
                ) {
                    console.log('⚠️ Coupon not applicable to cart products:', coupon.code);
                } else if (
                    couponDoc.applicableCategories.length > 0 &&
                    !cartCategoryIds.some(id =>
                        couponDoc.applicableCategories.some(cId => cId._id
                            ? cId._id.toString() === id
                            : cId.toString() === id)
                    )
                ) {
                    console.log('⚠️ Coupon not applicable to cart categories:', coupon.code);
                } else if (subtotal < couponDoc.minPurchaseAmount) {
                    console.log('⚠️ Coupon minimum purchase not met:', coupon.code, 'Subtotal:', subtotal);
                } else {
                    couponId = couponDoc._id;
                    discount = couponDoc.calculateDiscount(subtotal);
                    finalAmount = Math.max(subtotal - discount + shipping, 0);
                    appliedCouponDoc = couponDoc;
                    console.log('✅ Coupon applied:', coupon.code, 'Discount:', discount);
                }
            }
        }
    }

    // Process cart items and build order items with pack/bundle/free product details
    const orderItems = [];
    for (const i of cart.items) {
        const item = {
            product: i.product._id,
            quantity: i.quantity,
            price: i.price // Use cart price (already calculated for packs/bundles)
        };

        // Check if this is a pack purchase from cart
        if (i.isPack && i.packInfo) {
            item.packDetails = {
                isPack: true,
                packSize: i.packInfo.packSize,
                packPrice: i.packInfo.packPrice,
                savingsPercent: i.packInfo.savingsPercent,
                label: i.packInfo.label
            };
        } else if (i.product.packOptions && i.product.packOptions.length > 0) {
            // Fallback: Check if quantity matches a pack
            const matchingPack = i.product.packOptions.find(pack => pack.packSize === i.quantity);
            if (matchingPack) {
                item.packDetails = {
                    isPack: true,
                    packSize: matchingPack.packSize,
                    packPrice: matchingPack.packPrice,
                    savingsPercent: matchingPack.savingsPercent,
                    label: matchingPack.label
                };
            }
        }

        // Check for free products and populate their names
        if (i.product.freeProducts && i.product.freeProducts.length > 0) {
            const qualifyingFreeProducts = [];
            for (const fp of i.product.freeProducts) {
                if (i.quantity >= fp.minQuantity) {
                    // Populate the free product to get its name
                    const freeProduct = await Product.findById(fp.product).select('name');
                    qualifyingFreeProducts.push({
                        product: fp.product,
                        quantity: fp.quantity,
                        name: freeProduct?.name || 'Free Product'
                    });
                }
            }
            if (qualifyingFreeProducts.length > 0) {
                item.freeProducts = qualifyingFreeProducts;
            }
        }

        // Check for bundle offers and populate bundled product name
        if (i.product.bundleWith && i.product.bundleWith.length > 0 && i.product.bundleWith[0]) {
            const bundle = i.product.bundleWith[0];
            const bundledProduct = await Product.findById(bundle.product).select('name');
            item.bundleDetails = {
                isBundle: true,
                bundledWith: bundle.product,
                bundlePrice: bundle.bundlePrice,
                savingsAmount: bundle.savingsAmount,
                bundledProductName: bundledProduct?.name || 'Bundled Product'
            };
        }

        // Add offer text if available
        if (i.product.offerText) {
            item.offerText = i.product.offerText;
        }

        orderItems.push(item);
    }

    const orderData = {
        user: req.user._id,
        items: orderItems,
        totalAmount,
        shippingCost: shipping,
        discount,
        finalAmount,
        paymentMethod,
        shippingAddress: {
            fullName: shippingAddress.fullName,
            phone: shippingAddress.phone,
            email: shippingAddress.email,
            addressLine: shippingAddress.addressLine,
            landmark: shippingAddress.landmark || '',
            city: shippingAddress.city,
            state: shippingAddress.state,
            pincode: shippingAddress.pincode
        },
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
        orderStatus: 'pending'
    };
    
    // Only add coupon if found
    if (couponId) {
        orderData.coupon = couponId;
    }

    const order = await Order.create(orderData);

    if (appliedCouponDoc) {
        appliedCouponDoc.usageCount = (appliedCouponDoc.usageCount || 0) + 1;
        const phoneNumber = shippingAddress?.phone;
        if (phoneNumber) {
            const claim = appliedCouponDoc.claimedBy?.find(entry => entry.phoneNumber === phoneNumber);
            if (claim) {
                claim.usedCount = (claim.usedCount || 0) + 1;
            } else {
                appliedCouponDoc.claimedBy = appliedCouponDoc.claimedBy || [];
                appliedCouponDoc.claimedBy.push({
                    phoneNumber,
                    claimedAt: new Date(),
                    usedCount: 1
                });
            }
        }
        await appliedCouponDoc.save();
    }

    // Reduce stock for all items
    for (const item of cart.items) {
        await Product.findByIdAndUpdate(item.product._id, { 
            $inc: { stock: -item.quantity } 
        });
    }

    // Clear cart
    await clearCart(req.user._id);
    
    console.log('✅ Order created successfully:', order._id);

    // Send email notifications to admins (async, don't wait)
    try {
        // Get all admin users
        const admins = await User.find({ role: 'admin', isActive: true });
        
        if (admins && admins.length > 0) {
            const { adminNewOrderNotificationTemplate } = require('../utils/emailTemplates');
            
            // Populate order with product details for email
            const populatedOrder = await Order.findById(order._id).populate({
                path: 'items.product',
                select: PRODUCT_CART_SELECT_FIELDS
            });
            const user = await User.findById(req.user._id);
            
            const emailSubject = `🛒 New Order #${order._id.toString().slice(-8).toUpperCase()} - Action Required`;
            const emailHtml = adminNewOrderNotificationTemplate(populatedOrder, user);
            
            // Send emails to all admins
            admins.forEach(admin => {
                sendEmail(admin.email, emailSubject, emailHtml).catch(err => {
                    console.error(`Failed to send new order email to admin ${admin.email}:`, err.message);
                });
            });
            
            console.log(`📧 New order notification emails sent to ${admins.length} admin(s)`);
        }
    } catch (error) {
        console.error('Failed to send admin notification for new order:', error);
        // Don't fail the order creation if email fails
    }

    res.status(201).json(order);
});

// Get Orders for User
const getUserOrders = handleAsync(async (req, res) => {
    const orders = await Order.find({ user: req.user._id })
        .populate({
            path: 'items.product',
            select: PRODUCT_CART_SELECT_FIELDS
        })
        .populate('coupon', 'code discountType discountValue')
        .sort({ createdAt: -1 });
    
    res.json(orders);
});

// Get all Orders (Admin)
const getAllOrders = handleAsync(async (req, res) => {
    const orders = await Order.find()
        .populate('user', 'name email phone')
        .populate({
            path: 'items.product',
            select: PRODUCT_CART_SELECT_FIELDS
        })
        .sort({ createdAt: -1 });
    res.json(orders);
});

// Get Order by ID (Admin)
const getOrderById = handleAsync(async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('user', 'name email phone')
        .populate({
            path: 'items.product',
            select: PRODUCT_CART_SELECT_FIELDS
        })
        .populate('coupon', 'code discountValue discountType');
    
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
});

// Update Order Status (Admin)
const updateOrderStatus = handleAsync(async (req, res) => {
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid order status' });
    }
    
    const order = await Order.findById(req.params.id).populate({
        path: 'items.product',
        select: PRODUCT_CART_SELECT_FIELDS
    });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Store old status to check if it changed
    const oldStatus = order.orderStatus;

    // If cancelling, restore stock
    if (status === 'cancelled' && order.orderStatus !== 'cancelled') {
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product._id, { 
                $inc: { stock: item.quantity } 
            });
        }
        console.log('✅ Stock restored for cancelled order:', order._id);
    }

    order.orderStatus = status;
    
    // Mark as paid when delivered
    if (status === 'delivered') {
        order.paymentStatus = 'paid';
    }
    
    await order.save();

    // Emit real-time update via Socket.IO
    if (global.io) {
        global.io.emit('order_status_updated', {
            orderId: order._id,
            status: order.orderStatus,
            paymentStatus: order.paymentStatus
        });
        console.log('🔔 Real-time order status update sent:', order._id, status);
    }

    // Send email notifications to user (async, don't wait)
    if (oldStatus !== status) {
        try {
            // Populate order with all required data for email
            const populatedOrder = await Order.findById(order._id)
                .populate('user', 'name email phone')
                .populate({
                    path: 'items.product',
                    select: PRODUCT_CART_SELECT_FIELDS
                });
            
            if (!populatedOrder || !populatedOrder.user || !populatedOrder.user.email) {
                console.log(`⚠️ Cannot send email - user or email not found for order ${order._id}`);
                return;
            }
            
            const user = populatedOrder.user;
            const { orderStatusUpdateTemplate, orderDeliveredWishesTemplate } = require('../utils/emailTemplates');
            
            // Send status update email
            const statusEmailSubject = `Order ${status.charAt(0).toUpperCase() + status.slice(1)} - #${order._id.toString().slice(-8).toUpperCase()}`;
            const statusEmailHtml = orderStatusUpdateTemplate(populatedOrder, user, status);
            
            sendEmail(user.email, statusEmailSubject, statusEmailHtml).catch(err => {
                console.error(`Failed to send status update email to ${user.email}:`, err.message);
            });
            
            console.log(`✅ Status update email sent to ${user.email} for order ${order._id}`);
                
            // If status is delivered, also send a special wishes email and invoice
            if (status === 'delivered') {
                const wishesEmailSubject = `🎉 Congratulations! Your Order Has Been Delivered - #${order._id.toString().slice(-8).toUpperCase()}`;
                const wishesEmailHtml = orderDeliveredWishesTemplate(populatedOrder, user);
                
                // Send after a short delay to ensure status email is sent first
                setTimeout(() => {
                    sendEmail(user.email, wishesEmailSubject, wishesEmailHtml).catch(err => {
                        console.error(`Failed to send delivery wishes email to ${user.email}:`, err.message);
                    });
                    console.log(`🎁 Delivery wishes email sent to ${user.email} for order ${order._id}`);
                }, 2000);

                // Send invoice email with attachment
                setTimeout(async () => {
                    try {
                        const { sendInvoiceEmail } = require('./invoiceController');
                        // Use already populated order
                        await sendInvoiceEmail(populatedOrder);
                        console.log(`📄 Invoice email sent to ${user.email} for order ${order._id}`);
                    } catch (error) {
                        console.error(`Failed to send invoice email to ${user.email}:`, error.message);
                    }
                }, 4000); // Send 4 seconds after status email
            }
        } catch (error) {
            console.error('Failed to send order status update email:', error);
            console.error('Error details:', error.stack);
            // Don't fail the status update if email fails
        }
    }

    res.json(order);
});

// Cancel Order (User)
const cancelOrder = handleAsync(async (req, res) => {
    const { reason } = req.body;
    
    if (!reason || !reason.trim()) {
        return res.status(400).json({ message: 'Cancellation reason is required' });
    }
    
    const order = await Order.findById(req.params.id).populate({
        path: 'items.product',
        select: PRODUCT_CART_SELECT_FIELDS
    });
    
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user owns this order
    if (order.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }
    
    // Check if order can be cancelled
    if (order.orderStatus === 'delivered') {
        return res.status(400).json({ message: 'Cannot cancel delivered orders' });
    }
    
    if (order.orderStatus === 'cancelled') {
        return res.status(400).json({ message: 'Order is already cancelled' });
    }
    
    // Restore stock for all items
    for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product._id, { 
            $inc: { stock: item.quantity } 
        });
    }
    
    // Update order status with cancellation details
    order.orderStatus = 'cancelled';
    order.cancellationReason = reason.trim();
    order.cancelledAt = new Date();
    await order.save();
    
    console.log('✅ Order cancelled by user:', order._id, 'Reason:', reason);

    // Emit real-time update via Socket.IO
    if (global.io) {
        global.io.emit('order_status_updated', {
            orderId: order._id,
            status: 'cancelled',
            cancellationReason: reason.trim()
        });
        console.log('🔔 Real-time order cancellation update sent');
    }

    // Send notifications asynchronously
    try {
        // Get user details
        const user = await User.findById(req.user._id);
        
        // Get all admin users
        const admins = await User.find({ role: 'admin', isActive: true });
        
        if (admins && admins.length > 0) {
            const { adminOrderCancelledNotificationTemplate } = require('../utils/emailTemplates');
            
            // Prepare professional email
            const emailSubject = `⚠️ Order Cancelled by Customer - #${order._id.toString().slice(-8).toUpperCase()}`;
            const emailHtml = adminOrderCancelledNotificationTemplate(order, user, reason.trim());
            
            // Send emails to all admins (async, don't wait)
            admins.forEach(admin => {
                sendEmail(admin.email, emailSubject, emailHtml).catch(err => {
                    console.error(`Failed to send cancellation email to ${admin.email}:`, err.message);
                });
            });
            
            console.log(`📧 Order cancellation emails sent to ${admins.length} admin(s)`);
        }

        // Create notification in database
        const notification = await Notification.create({
            type: 'order_cancelled',
            title: 'Order Cancelled',
            message: `Order #${order._id.toString().slice(-8).toUpperCase()} cancelled by ${user.name}`,
            relatedOrder: order._id,
            metadata: {
                orderId: order._id,
                customerName: user.name,
                customerEmail: user.email,
                orderAmount: order.finalAmount,
                cancellationReason: reason.trim(),
                emailsSent: admins ? admins.length : 0
            }
        });

        // Emit real-time notification via Socket.IO
        if (global.io) {
            const populatedNotification = await Notification.findById(notification._id);
            global.io.emit('new_notification', populatedNotification);
            console.log('🔔 Real-time notification sent: order_cancelled');
        }

        console.log(`✅ Order cancellation notification sent to ${admins ? admins.length : 0} admin(s)`);
    } catch (error) {
        console.error('Failed to send cancellation notification:', error);
        // Don't fail the cancellation if notification fails
    }
    
    res.json({ 
        message: 'Order cancelled successfully. Stock has been restored.',
        order 
    });
});

// Delete Order (Admin - Hard Delete)
const deleteOrder = handleAsync(async (req, res) => {
    const order = await Order.findById(req.params.id).populate({
        path: 'items.product',
        select: PRODUCT_CART_SELECT_FIELDS
    });
    
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }
    
    // If order is not cancelled and not delivered, restore stock
    if (order.orderStatus !== 'cancelled' && order.orderStatus !== 'delivered') {
        for (const item of order.items) {
            if (item.product) {
                await Product.findByIdAndUpdate(item.product._id, { 
                    $inc: { stock: item.quantity } 
                });
            }
        }
        console.log('✅ Stock restored before deleting order:', order._id);
    }
    
    await Order.findByIdAndDelete(req.params.id);
    
    // Emit real-time update via Socket.IO
    if (global.io) {
        global.io.emit('order_deleted', { orderId: order._id });
        console.log('🔔 Real-time order deletion update sent:', order._id);
    }
    
    res.json({ message: 'Order deleted successfully' });
});

module.exports = {
    createOrder,
    getUserOrders,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
    deleteOrder
};
