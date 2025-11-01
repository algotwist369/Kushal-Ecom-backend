const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Coupon code is required'],
        unique: true,
        uppercase: true,
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required']
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true,
        default: 'percentage'
    },
    discountValue: {
        type: Number,
        required: [true, 'Discount value is required'],
        min: 0
    },
    minPurchaseAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    maxDiscountAmount: {
        type: Number, // Maximum discount amount (useful for percentage discounts)
        min: 0
    },
    validFrom: {
        type: Date,
        required: true,
        default: Date.now
    },
    validUntil: {
        type: Date,
        required: true
    },
    usageLimit: {
        type: Number, // Total times this coupon can be used
        default: null // null means unlimited
    },
    usageCount: {
        type: Number,
        default: 0
    },
    perUserLimit: {
        type: Number, // How many times one user can use this coupon
        default: 1
    },
    isActive: {
        type: Boolean,
        default: true
    },
    applicableProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    applicableCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    // Track which phone numbers have claimed this coupon
    claimedBy: [{
        phoneNumber: String,
        claimedAt: {
            type: Date,
            default: Date.now
        },
        usedCount: {
            type: Number,
            default: 0
        }
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Index for faster queries
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, validUntil: 1 });
couponSchema.index({ 'claimedBy.phoneNumber': 1 });

// Method to check if coupon is valid
couponSchema.methods.isValid = function() {
    const now = new Date();
    return this.isActive && 
           now >= this.validFrom && 
           now <= this.validUntil &&
           (this.usageLimit === null || this.usageCount < this.usageLimit);
};

// Method to check if user can claim/use this coupon
couponSchema.methods.canUserClaim = function(phoneNumber) {
    const userClaim = this.claimedBy.find(claim => claim.phoneNumber === phoneNumber);
    
    if (!userClaim) {
        return true; // User hasn't claimed yet
    }
    
    return userClaim.usedCount < this.perUserLimit;
};

// Method to calculate discount
couponSchema.methods.calculateDiscount = function(orderAmount) {
    if (orderAmount < this.minPurchaseAmount) {
        return 0;
    }
    
    let discount = 0;
    if (this.discountType === 'percentage') {
        discount = (orderAmount * this.discountValue) / 100;
        if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
            discount = this.maxDiscountAmount;
        }
    } else {
        discount = this.discountValue;
    }
    
    return Math.min(discount, orderAmount);
};

module.exports = mongoose.model('Coupon', couponSchema);
