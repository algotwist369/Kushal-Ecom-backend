const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        index: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300 // Document automatically deleted after 5 minutes (300 seconds)
    }
}, { timestamps: true });

module.exports = mongoose.model('Otp', otpSchema);
