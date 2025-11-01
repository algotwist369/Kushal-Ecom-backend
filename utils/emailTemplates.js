// Helper function to format order item details with pack/bundle/free products
const formatOrderItemDetails = (item) => {
    let details = `<strong>${item.product?.name || 'Product'}</strong> × ${item.quantity}`;
    
    // Add pack details
    if (item.packDetails && item.packDetails.isPack) {
        details += `<br><span style="color: #2196f3; font-size: 13px;">📦 ${item.packDetails.label || `Pack of ${item.packDetails.packSize}`}`;
        if (item.packDetails.savingsPercent) {
            details += ` - Save ${item.packDetails.savingsPercent}%`;
        }
        details += `</span>`;
    }
    
    // Add free products
    if (item.freeProducts && item.freeProducts.length > 0) {
        item.freeProducts.forEach(fp => {
            details += `<br><span style="color: #4caf50; font-size: 13px;">🎁 FREE: ${fp.name} × ${fp.quantity}</span>`;
        });
    }
    
    // Add bundle details
    if (item.bundleDetails && item.bundleDetails.isBundle) {
        details += `<br><span style="color: #ff9800; font-size: 13px;">🔗 Bundle with ${item.bundleDetails.bundledProductName}`;
        if (item.bundleDetails.savingsAmount) {
            details += ` - Save ₹${item.bundleDetails.savingsAmount}`;
        }
        details += `</span>`;
    }
    
    // Add offer text
    if (item.offerText) {
        details += `<br><span style="color: #e91e63; font-size: 13px;">⭐ ${item.offerText}</span>`;
    }
    
    return details;
};

 const welcomeEmailTemplate = (userName) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to Prolific Healing Herbs</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2c5530; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { background: #2c5530; color: white; padding: 15px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌿 Welcome to Prolific Healing Herbs</h1>
        </div>
        <div class="content">
            <h2>Namaste ${userName}!</h2>
            <p>Welcome to our authentic Prolific Healing Herbs! We're delighted to have you join our community of wellness enthusiasts.</p>
            <p>At our store, you'll find:</p>
            <ul>
                <li>✅ 100% Authentic Ayurvedic Products</li>
                <li>✅ Certified Organic Ingredients</li>
                <li>✅ Traditional Formulations</li>
                <li>✅ Expert Health Consultations</li>
            </ul>
            <p>Start your wellness journey today with our premium collection of Ayurvedic medicines, herbs, and supplements.</p>
            <p style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
                   style="background: #2c5530; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
                    Explore Our Products
                </a>
            </p>
        </div>
        <div class="footer">
            <p>© 2024 Prolific Healing Herbs. All rights reserved.</p>
            <p>For support, contact us at: support@ayurvedicstore.com</p>
        </div>
    </div>
</body>
</html>
`;

const orderConfirmationTemplate = (order, user) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Order Confirmation - Prolific Healing Herbs</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2c5530; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .order-details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #2c5530; }
        .footer { background: #2c5530; color: white; padding: 15px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌿 Order Confirmation</h1>
        </div>
        <div class="content">
            <h2>Thank you for your order, ${user.name}!</h2>
            <p>Your order has been confirmed and is being processed.</p>
            
            <div class="order-details">
                <h3>Order Details:</h3>
                <p><strong>Order ID:</strong> ${order._id}</p>
                <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                <p><strong>Total Amount:</strong> ₹${order.finalAmount}</p>
                <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
                <p><strong>Order Status:</strong> ${order.orderStatus}</p>
            </div>
            
            <p>We'll send you another email once your order ships. You can track your order status anytime in your account.</p>
        </div>
        <div class="footer">
            <p>© 2024 Prolific Healing Herbs. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

const adminNotificationTemplate = (user) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>New User Registration - Admin Notification</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .user-details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #dc3545; }
        .footer { background: #dc3545; color: white; padding: 15px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 New User Registration</h1>
        </div>
        <div class="content">
            <h2>New User Registered</h2>
            <p>A new user has registered on your Prolific Healing Herbs:</p>
            
            <div class="user-details">
                <h3>User Details:</h3>
                <p><strong>Name:</strong> ${user.name}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Phone:</strong> ${user.phone || 'Not provided'}</p>
                <p><strong>Registration Date:</strong> ${new Date(user.createdAt).toLocaleString()}</p>
                <p><strong>User ID:</strong> ${user._id}</p>
            </div>
            
            <p>Please check your admin dashboard for more details and user management options.</p>
        </div>
        <div class="footer">
            <p>© 2024 Prolific Healing Herbs Admin Panel</p>
        </div>
    </div>
</body>
</html>
`;

const orderStatusUpdateTemplate = (order, user, newStatus) => {
    const statusMessages = {
        pending: {
            title: 'Order Received',
            message: 'Your order has been received and is pending confirmation.',
            icon: '📝'
        },
        processing: {
            title: 'Order Being Processed',
            message: 'Great news! Your order is now being processed and will be shipped soon.',
            icon: '⚙️'
        },
        shipped: {
            title: 'Order Shipped',
            message: 'Your order is on its way! You should receive it within 3-5 business days.',
            icon: '🚚'
        },
        delivered: {
            title: 'Order Delivered',
            message: 'Your order has been successfully delivered. We hope you enjoy your products!',
            icon: '✅'
        },
        cancelled: {
            title: 'Order Cancelled',
            message: 'Your order has been cancelled. If you have any questions, please contact our support team.',
            icon: '❌'
        }
    };

    const statusInfo = statusMessages[newStatus] || statusMessages.pending;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${statusInfo.title} - Prolific Healing Herbs</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .header { background: #2c5530; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; background: white; border-radius: 0 0 8px 8px; }
        .status-badge { display: inline-block; padding: 10px 20px; background: #2c5530; color: white; border-radius: 20px; font-weight: bold; margin: 20px 0; }
        .order-info { background: #f9f9f9; padding: 20px; border-left: 4px solid #2c5530; margin: 20px 0; border-radius: 4px; }
        .order-info h3 { margin-top: 0; color: #2c5530; }
        .order-info p { margin: 8px 0; }
        .items-list { margin: 15px 0; }
        .item { padding: 10px; background: white; margin: 8px 0; border-radius: 4px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 12px 30px; background: #2c5530; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .timeline { margin: 20px 0; padding-left: 20px; border-left: 2px solid #2c5530; }
        .timeline-item { margin: 15px 0; padding-left: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${statusInfo.icon} ${statusInfo.title}</h1>
        </div>
        <div class="content">
            <h2>Hello ${user.name},</h2>
            <p style="font-size: 16px;">${statusInfo.message}</p>
            
            <div class="status-badge">
                Status: ${newStatus.toUpperCase()}
            </div>
            
            <div class="order-info">
                <h3>Order Details:</h3>
                <p><strong>Order ID:</strong> #${order._id.toString().slice(-8).toUpperCase()}</p>
                <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-IN', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</p>
                <p><strong>Total Amount:</strong> ₹${order.finalAmount.toFixed(2)}</p>
                <p><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
                <p><strong>Items:</strong> ${order.items.length} item(s)</p>
            </div>
            
            <div class="items-list">
                <h3>Order Items:</h3>
                ${order.items.map(item => `
                    <div class="item">
                        ${formatOrderItemDetails(item)}
                        <br>
                        <span style="font-weight: bold; float: right;">₹${(item.price * item.quantity).toFixed(2)}</span>
                        <div style="clear: both;"></div>
                    </div>
                `).join('')}
            </div>
            
            ${order.shippingAddress ? `
            <div class="order-info">
                <h3>Shipping Address:</h3>
                <p>${order.shippingAddress.fullName}</p>
                <p>${order.shippingAddress.addressLine}</p>
                ${order.shippingAddress.landmark ? `<p>Landmark: ${order.shippingAddress.landmark}</p>` : ''}
                <p>${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}</p>
                <p>Phone: ${order.shippingAddress.phone}</p>
            </div>
            ` : ''}
            
            <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${order._id}" class="button">
                    Track Your Order
                </a>
            </div>
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
                If you have any questions about your order, please don't hesitate to contact our customer support team.
            </p>
        </div>
        <div class="footer">
            <p>© 2024 Prolific Healing Herbs. All rights reserved.</p>
            <p>📧 support@ayurvedicstore.com | 📞 +91-XXXXXXXXXX</p>
        </div>
    </div>
</body>
</html>
    `;
};

const orderDeliveredWishesTemplate = (order, user) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>🎉 Congratulations on Your Delivery! - Prolific Healing Herbs</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .header { 
            background: linear-gradient(135deg, #2c5530 0%, #3d7a42 100%); 
            color: white; 
            padding: 40px 20px; 
            text-align: center; 
            border-radius: 8px 8px 0 0; 
        }
        .celebration { font-size: 48px; margin: 10px 0; }
        .content { padding: 30px; background: white; border-radius: 0 0 8px 8px; }
        .highlight-box { 
            background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); 
            padding: 25px; 
            border-radius: 8px; 
            margin: 25px 0; 
            border-left: 5px solid #2c5530;
        }
        .order-info { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .wellness-tips { background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #ffc107; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .button { 
            display: inline-block; 
            padding: 15px 35px; 
            background: #2c5530; 
            color: white !important; 
            text-decoration: none; 
            border-radius: 25px; 
            margin: 20px 0;
            font-weight: bold;
        }
        .icon-list { list-style: none; padding: 0; }
        .icon-list li { padding: 10px 0; }
        .icon-list li:before { content: "✅ "; color: #2c5530; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="celebration">🎉 🌿 🎊</div>
            <h1>Congratulations, ${user.name}!</h1>
            <h2 style="margin: 10px 0; font-weight: normal;">Your Wellness Journey Has Begun</h2>
        </div>
        <div class="content">
            <h2 style="color: #2c5530;">Your Order Has Been Delivered! 🎁</h2>
            <p style="font-size: 16px; line-height: 1.8;">
                We're thrilled to inform you that your order has been successfully delivered! 
                Thank you for choosing our authentic Ayurvedic products for your wellness journey.
            </p>
            
            <div class="highlight-box">
                <h3 style="margin-top: 0; color: #2c5530;">🙏 Namaste & Thank You!</h3>
                <p style="font-size: 15px; margin: 0;">
                    Your trust in our products means the world to us. We hope these authentic Ayurvedic 
                    remedies bring you health, happiness, and harmony.
                </p>
            </div>
            
            <div class="order-info">
                <h3 style="color: #2c5530; margin-top: 0;">📦 Delivery Details:</h3>
                <p><strong>Order ID:</strong> #${order._id.toString().slice(-8).toUpperCase()}</p>
                <p><strong>Delivered On:</strong> ${new Date().toLocaleDateString('en-IN', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</p>
                <p><strong>Order Amount:</strong> ₹${order.finalAmount.toFixed(2)}</p>
                <p><strong>Items Delivered:</strong> ${order.items.length} product(s)</p>
            </div>
            
            <div class="wellness-tips">
                <h3 style="color: #856404; margin-top: 0;">💡 Wellness Tips:</h3>
                <ul class="icon-list" style="margin: 15px 0;">
                    <li>Follow the recommended dosage for best results</li>
                    <li>Store products in a cool, dry place</li>
                    <li>Maintain consistency for optimal benefits</li>
                    <li>Stay hydrated and follow a balanced diet</li>
                    <li>Consult our experts if you have any questions</li>
                </ul>
            </div>
            
            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 5px solid #2196f3;">
                <h3 style="color: #1976d2; margin-top: 0;">💬 We Value Your Feedback!</h3>
                <p style="margin: 10px 0;">
                    Your experience matters to us! Please take a moment to share your thoughts about 
                    your purchase and help others make informed decisions.
                </p>
                <div style="text-align: center;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${order._id}" class="button">
                        Rate Your Products
                    </a>
                </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <h3 style="color: #2c5530;">Continue Your Wellness Journey</h3>
                <p>Explore more authentic Ayurvedic products</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/products" class="button">
                    Browse Products
                </a>
            </div>
            
            <div style="border-top: 2px dashed #ddd; padding-top: 20px; margin-top: 30px;">
                <h3 style="color: #2c5530;">📞 Need Assistance?</h3>
                <p>Our customer support team is always here to help you:</p>
                <ul style="line-height: 2;">
                    <li>📧 Email: support@ayurvedicstore.com</li>
                    <li>📞 Phone: +91-XXXXXXXXXX</li>
                    <li>💬 Live Chat: Available on our website</li>
                    <li>⏰ Working Hours: Mon-Sat, 9 AM - 7 PM</li>
                </ul>
            </div>
            
            <div style="background: #f0f0f0; padding: 20px; border-radius: 8px; margin-top: 30px; text-align: center;">
                <h4 style="color: #2c5530; margin-top: 0;">🎁 Special Offer for You!</h4>
                <p>
                    As a token of our appreciation, enjoy <strong>10% OFF</strong> on your next purchase.
                    <br>Use code: <strong style="color: #2c5530; font-size: 18px;">WELLNESS10</strong>
                </p>
            </div>
            
            <p style="text-align: center; margin-top: 30px; color: #666; font-style: italic;">
                "स्वास्थ्यं परमं भाग्यम्"<br>
                <em>(Health is the greatest blessing)</em>
            </p>
        </div>
        <div class="footer">
            <p style="font-weight: bold;">Thank you for choosing Prolific Healing Herbs! 🌿</p>
            <p>© 2024 Prolific Healing Herbs. All rights reserved.</p>
            <p>📧 support@ayurvedicstore.com | 📞 +91-XXXXXXXXXX</p>
            <p style="margin-top: 15px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="color: #2c5530; text-decoration: none;">Visit Our Store</a> | 
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/contact" style="color: #2c5530; text-decoration: none;">Contact Us</a>
            </p>
        </div>
    </div>
</body>
</html>
`;

const adminNewOrderNotificationTemplate = (order, user) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>🛒 New Order Received - Admin Notification</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .header { 
            background: linear-gradient(135deg, #2c5530 0%, #3d7a42 100%); 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
            border-radius: 8px 8px 0 0; 
        }
        .alert-badge { 
            display: inline-block; 
            background: #ff9800; 
            color: white; 
            padding: 8px 20px; 
            border-radius: 20px; 
            font-weight: bold; 
            margin: 10px 0; 
        }
        .content { padding: 30px; background: white; border-radius: 0 0 8px 8px; }
        .order-info { background: #e8f5e9; padding: 20px; border-left: 5px solid #2c5530; margin: 20px 0; border-radius: 4px; }
        .customer-info { background: #e3f2fd; padding: 20px; border-left: 5px solid #2196f3; margin: 20px 0; border-radius: 4px; }
        .items-list { margin: 15px 0; }
        .item { padding: 12px; background: #f9f9f9; margin: 8px 0; border-radius: 4px; border-left: 3px solid #2c5530; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .button { 
            display: inline-block; 
            padding: 12px 30px; 
            background: #2c5530; 
            color: white !important; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
            font-weight: bold;
        }
        .highlight { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ffc107; }
        table { width: 100%; border-collapse: collapse; }
        table td { padding: 8px; border-bottom: 1px solid #e0e0e0; }
        table td:first-child { font-weight: bold; color: #555; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛒 New Order Received!</h1>
            <div class="alert-badge">Action Required</div>
        </div>
        <div class="content">
            <h2 style="color: #2c5530;">New Order Alert</h2>
            <p style="font-size: 16px;">
                A new order has been placed and requires your attention. Please process this order promptly.
            </p>
            
            <div class="order-info">
                <h3 style="color: #2c5530; margin-top: 0;">📦 Order Information:</h3>
                <table>
                    <tr>
                        <td>Order ID:</td>
                        <td><strong>#${order._id.toString().slice(-8).toUpperCase()}</strong></td>
                    </tr>
                    <tr>
                        <td>Order Date:</td>
                        <td>${new Date(order.createdAt).toLocaleString('en-IN', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</td>
                    </tr>
                    <tr>
                        <td>Total Amount:</td>
                        <td><strong style="color: #2c5530; font-size: 18px;">₹${order.finalAmount.toFixed(2)}</strong></td>
                    </tr>
                    <tr>
                        <td>Payment Method:</td>
                        <td><strong>${order.paymentMethod.toUpperCase()}</strong></td>
                    </tr>
                    <tr>
                        <td>Payment Status:</td>
                        <td>${order.paymentStatus}</td>
                    </tr>
                    <tr>
                        <td>Order Status:</td>
                        <td><span style="background: #fff3cd; padding: 4px 12px; border-radius: 12px;">${order.orderStatus}</span></td>
                    </tr>
                    <tr>
                        <td>Items:</td>
                        <td>${order.items.length} product(s)</td>
                    </tr>
                </table>
            </div>
            
            <div class="customer-info">
                <h3 style="color: #1976d2; margin-top: 0;">👤 Customer Details:</h3>
                <table>
                    <tr>
                        <td>Name:</td>
                        <td>${user.name}</td>
                    </tr>
                    <tr>
                        <td>Email:</td>
                        <td><a href="mailto:${user.email}">${user.email}</a></td>
                    </tr>
                    <tr>
                        <td>Phone:</td>
                        <td>${user.phone || order.shippingAddress?.phone || 'Not provided'}</td>
                    </tr>
                </table>
            </div>
            
            <div class="items-list">
                <h3 style="color: #2c5530;">🛍️ Order Items:</h3>
                ${order.items.map(item => `
                    <div class="item">
                        ${formatOrderItemDetails(item)}
                        <br>
                        <span style="color: #666; font-size: 14px;">
                            Quantity: ${item.quantity} × ₹${item.price.toFixed(2)} = <strong>₹${(item.price * item.quantity).toFixed(2)}</strong>
                        </span>
                    </div>
                `).join('')}
                
                <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin-top: 15px;">
                    <table style="margin: 0;">
                        <tr>
                            <td>Subtotal:</td>
                            <td style="text-align: right;">₹${(order.totalAmount - (order.shippingCost || 0)).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Shipping:</td>
                            <td style="text-align: right; ${order.shippingCost === 0 ? 'color: #4caf50;' : ''}">
                                ${order.shippingCost > 0 ? `₹${order.shippingCost.toFixed(2)}` : 'FREE'}
                            </td>
                        </tr>
                        ${order.discount > 0 ? `
                        <tr>
                            <td>Discount:</td>
                            <td style="text-align: right; color: #4caf50;">-₹${order.discount.toFixed(2)}</td>
                        </tr>
                        ` : ''}
                        <tr style="font-size: 18px; font-weight: bold;">
                            <td>Total Amount:</td>
                            <td style="text-align: right; color: #2c5530;">₹${order.finalAmount.toFixed(2)}</td>
                        </tr>
                    </table>
                </div>
            </div>
            
            ${order.shippingAddress ? `
            <div class="order-info">
                <h3 style="color: #2c5530; margin-top: 0;">📍 Shipping Address:</h3>
                <p style="line-height: 1.8; margin: 0;">
                    <strong>${order.shippingAddress.fullName}</strong><br>
                    ${order.shippingAddress.addressLine}<br>
                    ${order.shippingAddress.landmark ? `Landmark: ${order.shippingAddress.landmark}<br>` : ''}
                    ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br>
                    Phone: ${order.shippingAddress.phone}
                    ${order.shippingAddress.email ? `<br>Email: ${order.shippingAddress.email}` : ''}
                </p>
            </div>
            ` : ''}
            
            <div class="highlight">
                <strong>⚡ Action Required:</strong> Please review this order and update its status to "Processing" once you begin preparing it for shipment.
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/orders/${order._id}" class="button">
                    View Order Details
                </a>
            </div>
            
            <p style="color: #666; font-size: 14px; text-align: center;">
                This is an automated notification. Please login to your admin panel to manage this order.
            </p>
        </div>
        <div class="footer">
            <p style="font-weight: bold;">Prolific Healing Herbs Admin Panel</p>
            <p>© 2024 Prolific Healing Herbs. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

const adminOrderCancelledNotificationTemplate = (order, user, reason) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>⚠️ Order Cancelled by Customer - Admin Notification</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .header { 
            background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
            border-radius: 8px 8px 0 0; 
        }
        .alert-badge { 
            display: inline-block; 
            background: #fbbf24; 
            color: #78350f; 
            padding: 8px 20px; 
            border-radius: 20px; 
            font-weight: bold; 
            margin: 10px 0; 
        }
        .content { padding: 30px; background: white; border-radius: 0 0 8px 8px; }
        .warning-box { background: #fee2e2; padding: 20px; border-left: 5px solid #dc2626; margin: 20px 0; border-radius: 4px; }
        .reason-box { background: #fff3cd; padding: 20px; border-left: 5px solid #ffc107; margin: 20px 0; border-radius: 4px; }
        .order-info { background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .customer-info { background: #e3f2fd; padding: 20px; border-left: 5px solid #2196f3; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .button { 
            display: inline-block; 
            padding: 12px 30px; 
            background: #dc2626; 
            color: white !important; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
            font-weight: bold;
        }
        table { width: 100%; border-collapse: collapse; }
        table td { padding: 8px; border-bottom: 1px solid #e0e0e0; }
        table td:first-child { font-weight: bold; color: #555; width: 40%; }
        .info-item { background: #f9fafb; padding: 12px; margin: 8px 0; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ Order Cancelled</h1>
            <div class="alert-badge">Customer Cancellation</div>
        </div>
        <div class="content">
            <h2 style="color: #dc2626;">Customer Cancelled Order</h2>
            
            <div class="warning-box">
                <p style="margin: 0; font-size: 16px;">
                    <strong>⚠️ Alert:</strong> A customer has cancelled their order. The stock has been automatically restored to inventory.
                </p>
            </div>
            
            <div class="reason-box">
                <h3 style="color: #856404; margin-top: 0;">📝 Cancellation Reason:</h3>
                <p style="margin: 0; font-size: 15px; font-style: italic;">
                    "${reason}"
                </p>
            </div>
            
            <div class="order-info">
                <h3 style="color: #374151; margin-top: 0;">📦 Order Details:</h3>
                <table>
                    <tr>
                        <td>Order ID:</td>
                        <td><strong>#${order._id.toString().slice(-8).toUpperCase()}</strong></td>
                    </tr>
                    <tr>
                        <td>Order Date:</td>
                        <td>${new Date(order.createdAt).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                        <td>Cancelled At:</td>
                        <td><strong>${new Date().toLocaleString('en-IN')}</strong></td>
                    </tr>
                    <tr>
                        <td>Order Amount:</td>
                        <td><strong style="color: #dc2626;">₹${order.finalAmount.toFixed(2)}</strong></td>
                    </tr>
                    <tr>
                        <td>Payment Method:</td>
                        <td>${order.paymentMethod.toUpperCase()}</td>
                    </tr>
                    <tr>
                        <td>Items:</td>
                        <td>${order.items.length} product(s)</td>
                    </tr>
                </table>
            </div>
            
            <div class="customer-info">
                <h3 style="color: #1976d2; margin-top: 0;">👤 Customer Information:</h3>
                <table>
                    <tr>
                        <td>Name:</td>
                        <td>${user.name}</td>
                    </tr>
                    <tr>
                        <td>Email:</td>
                        <td><a href="mailto:${user.email}">${user.email}</a></td>
                    </tr>
                    <tr>
                        <td>Phone:</td>
                        <td>${user.phone || order.shippingAddress?.phone || 'Not provided'}</td>
                    </tr>
                </table>
            </div>
            
            <div class="info-item">
                <strong>✅ Inventory Update:</strong> Stock has been automatically restored for all items in this order.
            </div>
            
            ${order.paymentStatus === 'paid' ? `
            <div class="info-item" style="background: #fef3c7; border-left: 3px solid #f59e0b;">
                <strong>💰 Refund Required:</strong> This order was already paid. Please process a refund of ₹${order.finalAmount.toFixed(2)}.
            </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/orders/${order._id}" class="button">
                    View Order Details
                </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px; padding: 15px; background: #f9fafb; border-radius: 8px;">
                <strong>Recommended Actions:</strong><br>
                • Review the cancellation reason<br>
                • Check if refund is required (for prepaid orders)<br>
                • Analyze cancellation patterns to improve service<br>
                • Consider reaching out to the customer for feedback
            </p>
        </div>
        <div class="footer">
            <p style="font-weight: bold;">Prolific Healing Herbs Admin Panel</p>
            <p>© 2024 Prolific Healing Herbs. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

module.exports = {
    welcomeEmailTemplate,
    orderConfirmationTemplate,
    adminNotificationTemplate,
    orderStatusUpdateTemplate,
    orderDeliveredWishesTemplate,
    adminNewOrderNotificationTemplate,
    adminOrderCancelledNotificationTemplate
};
