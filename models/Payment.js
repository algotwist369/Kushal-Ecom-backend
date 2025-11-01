const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true
    },
    paymentMethod: {
        type: String,
        enum: ['razorpay', 'cod'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    razorpayPaymentId: String,
    paymentDetails: Object
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
