const Razorpay = require('razorpay');
require('dotenv').config();

let razorpayInstance = null;

if (
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET &&
    process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key_id'
) {
    razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    console.log('✅ Razorpay initialized successfully');
} else {
    console.warn('⚠️ Razorpay not configured - online payments disabled');
}

const getRazorpayInstance = () => razorpayInstance;

module.exports = { razorpayInstance, getRazorpayInstance };
