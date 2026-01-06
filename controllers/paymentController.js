const crypto = require('crypto');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const { handleAsync } = require('../utils/handleAsync');
const { getRazorpayInstance } = require('../config/razorpay');

// ---------------------
// Create Razorpay Order
// ---------------------
const createRazorpayOrder = handleAsync(async (req, res) => {
    const { orderId } = req.body;
    
    console.log('💳 Creating Razorpay order for:', orderId);
    
    if (!orderId) {
        return res.status(400).json({ message: 'Order ID is required' });
    }
    
    const order = await Order.findById(orderId).populate('user');
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if Razorpay is initialized
    const razorpay = getRazorpayInstance();
    if (!razorpay) {
        console.error('❌ Razorpay not initialized - credentials not configured');
        return res.status(400).json({ 
            message: 'Online payment is currently unavailable. Please use Cash on Delivery.',
            razorpayAvailable: false
        });
    }

    try {
        const options = {
            amount: Math.round(order.finalAmount * 100), // amount in paise (must be integer)
            currency: 'INR',
            receipt: `order_rcptid_${order._id}`,
            payment_capture: 1
        };

        console.log('💳 Razorpay order options:', options);
        
        const razorpayOrder = await razorpay.orders.create(options);

        // Persist a payment record for auditing/reconciliation
        await Payment.findOneAndUpdate(
            { order: order._id, provider: 'razorpay' },
            {
                order: order._id,
                provider: 'razorpay',
                status: 'pending',
                amount: order.finalAmount,
                currency: options.currency,
                razorpayOrderId: razorpayOrder.id,
                metadata: {
                    receipt: razorpayOrder.receipt
                }
            },
            { upsert: true, new: true }
        );

        // Store Razorpay order id on Order for later verification
        order.razorpayOrderId = razorpayOrder.id;
        await order.save();

        console.log('✅ Razorpay order created:', razorpayOrder.id);

        res.status(201).json({
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            receipt: razorpayOrder.receipt,
            razorpayAvailable: true,
            key: process.env.RAZORPAY_KEY_ID // convenience for frontend
        });
    } catch (error) {
        console.error('❌ Razorpay error:', error);
        return res.status(500).json({ 
            message: 'Payment gateway error. Please try Cash on Delivery.',
            error: error.message,
            razorpayAvailable: false
        });
    }
});

// ---------------------
// Verify Razorpay Payment
// ---------------------
const verifyRazorpayPayment = handleAsync(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
        return res.status(500).json({ message: 'Payment verification unavailable' });
    }

    const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

    if (!razorpay_signature) {
        return res.status(400).json({ message: 'Payment signature missing' });
    }

    const signaturesMatch =
        generatedSignature.length === razorpay_signature.length &&
        crypto.timingSafeEqual(Buffer.from(generatedSignature), Buffer.from(razorpay_signature));

    if (!signaturesMatch) {
        return res.status(400).json({ message: 'Payment verification failed' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    // Ensure Razorpay order matches what we generated
    if (order.razorpayOrderId && order.razorpayOrderId !== razorpay_order_id) {
        return res.status(400).json({ message: 'Order mismatch' });
    }

    // Validate amount against stored payment (if any)
    const paymentDoc = await Payment.findOne({ order: orderId, provider: 'razorpay' });
    if (paymentDoc && paymentDoc.razorpayOrderId && paymentDoc.razorpayOrderId !== razorpay_order_id) {
        return res.status(400).json({ message: 'Payment record mismatch' });
    }

    // Atomic update to prevent race condition - check if already paid
    const updatedOrder = await Order.findOneAndUpdate(
        { 
            _id: orderId, 
            paymentStatus: { $ne: 'paid' } // Only update if not already paid
        },
        { 
            paymentStatus: 'paid',
            orderStatus: 'processing',
            razorpayPaymentId: razorpay_payment_id
        },
        { new: true }
    );

    if (!updatedOrder) {
        // Check if order exists but is already paid
        if (order && order.paymentStatus === 'paid') {
            return res.status(400).json({ 
                message: 'Order has already been paid',
                order
            });
        }
        return res.status(404).json({ message: 'Order not found' });
    }

    // Update payment record
    const existingMetadata = paymentDoc?.metadata ? Object.fromEntries(paymentDoc.metadata) : {};

    await Payment.findOneAndUpdate(
        { order: orderId, provider: 'razorpay' },
        {
            status: 'success',
            transactionId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            metadata: {
                ...existingMetadata,
                signature: razorpay_signature
            }
        },
        { upsert: true }
    );

    res.json({ message: 'Payment verified successfully', order: updatedOrder });
});

module.exports = { createRazorpayOrder, verifyRazorpayPayment };