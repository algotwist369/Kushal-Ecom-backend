const mongoose = require('mongoose');

const PopUpSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    image: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    // Display Settings
    delaySeconds: {
        type: Number,
        default: 2,
        min: 0,
        max: 60,
        comment: 'Delay in seconds before showing popup'
    },
    displayFrequency: {
        type: String,
        enum: ['once_per_session', 'once_per_day', 'always', 'once_per_week'],
        default: 'once_per_session',
        comment: 'How often to show the popup'
    },
    showOnPages: {
        type: [String],
        default: ['home'],
        enum: ['home', 'products', 'product_details', 'cart', 'checkout', 'about', 'contact', 'all'],
        comment: 'Which pages to show popup on'
    },
    closeableAfter: {
        type: Number,
        default: 0,
        min: 0,
        max: 30,
        comment: 'Seconds before user can close popup (0 = immediately closeable)'
    },
    autoCloseAfter: {
        type: Number,
        default: 0,
        min: 0,
        max: 120,
        comment: 'Automatically close after X seconds (0 = never auto-close)'
    },
    buttonText: {
        type: String,
        default: 'Shop Now',
        maxlength: 30
    },
    buttonColor: {
        type: String,
        default: '#111827', // gray-900
        comment: 'Hex color for CTA button'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Analytics
    viewCount: {
        type: Number,
        default: 0
    },
    clickCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Index for faster queries
PopUpSchema.index({ isActive: 1, createdAt: -1 });

// Pre-save hook to ensure only one popup is active
PopUpSchema.pre('save', async function(next) {
    // If this popup is being set to active
    if (this.isActive === true && this.isModified('isActive')) {
        // Deactivate all other popups
        await this.constructor.updateMany(
            { _id: { $ne: this._id } },
            { $set: { isActive: false } }
        );
        console.log(`✅ Deactivated other popups for: ${this.title}`.green);
    }
    next();
});

const PopUp = mongoose.model('PopUp', PopUpSchema);

module.exports = PopUp;