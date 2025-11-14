const mongoose = require('mongoose');

const popUpSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        image: String,
        title: {
            type: String,
            required: true
        },
        description: String,
        delaySeconds: {
            type: Number,
            default: 2,
            min: 0
        },
        displayFrequency: {
            type: String,
            enum: ['always', 'once_per_session', 'once_per_day'],
            default: 'once_per_session'
        },
        showOnPages: {
            type: [String],
            default: ['home']
        },
        closeableAfter: {
            type: Number,
            default: 0,
            min: 0
        },
        autoCloseAfter: {
            type: Number,
            default: 0,
            min: 0
        },
        buttonText: {
            type: String,
            default: 'Shop Now'
        },
        buttonColor: {
            type: String,
            default: '#111827'
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        },
        viewCount: {
            type: Number,
            default: 0
        },
        clickCount: {
            type: Number,
            default: 0
        },
        metadata: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('PopUp', popUpSchema);

