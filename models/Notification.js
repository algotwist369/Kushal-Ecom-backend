const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['new_user', 'new_product', 'order_cancelled', 'order_placed', 'order_update', 'system'],
        required: true
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
    isRead: {
        type: Boolean,
        default: false
    },
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Index for faster queries
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);

