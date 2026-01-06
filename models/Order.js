const mongoose = require('mongoose');

const freeProductSchema = new mongoose.Schema(
    {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, default: 1 },
        name: String
    },
    { _id: false }
);

const packDetailsSchema = new mongoose.Schema(
    {
        isPack: Boolean,
        packSize: Number,
        packPrice: Number,
        savingsPercent: Number,
        label: String
    },
    { _id: false }
);

const bundleDetailsSchema = new mongoose.Schema(
    {
        isBundle: Boolean,
        bundledWith: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        bundlePrice: Number,
        savingsAmount: Number,
        bundledProductName: String
    },
    { _id: false }
);

const orderItemSchema = new mongoose.Schema(
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
        offerText: String,
        packDetails: packDetailsSchema,
        freeProducts: {
            type: [freeProductSchema],
            default: []
        },
        bundleDetails: bundleDetailsSchema
    },
    { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
    {
        fullName: String,
        phone: String,
        email: String,
        addressLine: String,
        landmark: String,
        city: String,
        state: String,
        pincode: String
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        items: {
            type: [orderItemSchema],
            default: []
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },
        shippingCost: {
            type: Number,
            default: 0
        },
        discount: {
            type: Number,
            default: 0
        },
        finalAmount: {
            type: Number,
            required: true,
            min: 0
        },
        paymentMethod: {
            type: String,
            enum: ['cod', 'razorpay', 'stripe', 'manual'],
            default: 'cod'
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending'
        },
        orderStatus: {
            type: String,
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
            default: 'pending'
        },
        coupon: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Coupon'
        },
        shippingAddress: shippingAddressSchema,
        notes: String,
        razorpayOrderId: String,
        razorpayPaymentId: String,
        invoiceUrl: String,
        invoicePath: String,
        cancellationReason: String,
        cancelledAt: Date,
        deliveredAt: Date,
        meta: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 }); // Status with date for better queries
orderSchema.index({ paymentStatus: 1 }); // Payment status filtering
orderSchema.index({ createdAt: -1 }); // Date sorting

module.exports = mongoose.model('Order', orderSchema);

