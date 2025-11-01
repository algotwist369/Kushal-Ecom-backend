const Razorpay = require('razorpay');
const Order = require('../models/Order');
const crypto = require('crypto');
const { handleAsync } = require('../utils/handleAsync');

// Initialize Razorpay only if credentials are available
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && 
    process.env.RAZORPAY_KEY_SECRET && 
    process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key_id') {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    console.log('✅ Razorpay initialized successfully');
} else {
    console.log('⚠️ Razorpay not configured - Only COD will be available');
}

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
        
        console.log('✅ Razorpay order created:', razorpayOrder.id);

        res.status(201).json({
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            receipt: razorpayOrder.receipt,
            razorpayAvailable: true
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

    const generated_signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

    if (generated_signature !== razorpay_signature) {
        return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Update order status to paid
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.paymentStatus = 'paid';
    order.orderStatus = 'processing';
    order.razorpayPaymentId = razorpay_payment_id;

    await order.save();

    res.json({ message: 'Payment verified successfully', order });
});

module.exports = { createRazorpayOrder, verifyRazorpayPayment };