const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true,
                index: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            price: {
                type: Number,
                required: true
            },
            // Pack information
            isPack: {
                type: Boolean,
                default: false
            },
            packInfo: {
                packSize: Number,
                packPrice: Number,
                savingsPercent: Number,
                label: String
            }
        }
    ],
    totalPrice: {
        type: Number,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);
