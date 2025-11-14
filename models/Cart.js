const mongoose = require('mongoose');

const packInfoSchema = new mongoose.Schema(
    {
        packSize: { type: Number, min: 1 },
        packPrice: { type: Number, min: 0 },
        savingsPercent: { type: Number, min: 0, max: 100 },
        label: String
    },
    { _id: false }
);

const cartItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        isPack: {
            type: Boolean,
            default: false
        },
        packInfo: packInfoSchema
    },
    { _id: false }
);

const cartSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },
        items: {
            type: [cartItemSchema],
            default: []
        },
        totalPrice: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);

