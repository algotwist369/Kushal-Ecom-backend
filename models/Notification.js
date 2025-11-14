const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            default: 'general'
        },
        title: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        relatedUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        relatedProduct: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        relatedOrder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order'
        },
        metadata: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
            default: {}
        },
        isRead: {
            type: Boolean,
            default: false
        },
        readBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ]
    },
    { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);

