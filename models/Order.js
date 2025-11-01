const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
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
                required: true
            },
            quantity: Number,
            price: Number,
            // Pack details if purchased as pack
            packDetails: {
                isPack: {
                    type: Boolean,
                    default: false
                },
                packSize: Number,
                packPrice: Number,
                savingsPercent: Number,
                label: String
            },
            // Free products with this purchase
            freeProducts: [{
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product'
                },
                quantity: Number,
                name: String // Store name for history
            }],
            // Bundle details if part of bundle
            bundleDetails: {
                isBundle: {
                    type: Boolean,
                    default: false
                },
                bundledWith: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product'
                },
                bundlePrice: Number,
                savingsAmount: Number,
                bundledProductName: String // Store for history
            },
            // Special offer text
            offerText: String
        }
    ],
    totalAmount: {
        type: Number,
        required: true
    },
    shippingCost: {
        type: Number,
        default: 49
    },
    discount: {
        type: Number,
        default: 0
    },
    finalAmount: {
        type: Number,
        required: true
    },
    coupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon'
    },
    paymentMethod: {
        type: String,
        enum: ['razorpay', 'cod'],
        required: true,
        index: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    razorpayPaymentId: String,
    orderStatus: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    shippingAddress: {
        fullName: String,
        phone: String,
        email: String,
        pincode: String,
        city: String,
        state: String,
        addressLine: String,
        landmark: String
    },
    cancellationReason: {
        type: String,
        default: null
    },
    cancelledAt: {
        type: Date,
        default: null
    },
    invoicePath: String // local invoice PDF path
}, { timestamps: true });

// Compound index for user & order status
orderSchema.index({ user: 1, orderStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);
