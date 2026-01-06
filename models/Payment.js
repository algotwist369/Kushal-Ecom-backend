const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true
        },
        provider: {
            type: String,
            enum: ['razorpay', 'stripe', 'manual', 'cod'],
            default: 'cod'
        },
        status: {
            type: String,
            enum: ['pending', 'success', 'failed', 'refunded'],
            default: 'pending'
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        currency: {
            type: String,
            default: 'INR'
        },
        method: String, // e.g. card, upi, netbanking (from Razorpay payload)
        razorpayOrderId: String,
        transactionId: String,
        metadata: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);

