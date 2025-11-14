const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema(
    {
        phoneNumber: {
            type: String,
            required: true
        },
        claimedAt: {
            type: Date,
            default: Date.now
        },
        usedCount: {
            type: Number,
            default: 0
        }
    },
    { _id: false }
);

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },
        description: String,
        discountType: {
            type: String,
            enum: ['flat', 'percentage'],
            default: 'flat'
        },
        discountValue: {
            type: Number,
            required: true,
            min: 0
        },
        minPurchaseAmount: {
            type: Number,
            default: 0
        },
        maxDiscountAmount: {
            type: Number,
            default: null
        },
        validFrom: {
            type: Date,
            default: Date.now
        },
        validUntil: Date,
        usageLimit: {
            type: Number,
            default: null
        },
        usageCount: {
            type: Number,
            default: 0
        },
        perUserLimit: {
            type: Number,
            default: 1
        },
        isActive: {
            type: Boolean,
            default: true
        },
        applicableProducts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product'
            }
        ],
        applicableCategories: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Category'
            }
        ],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        claimedBy: {
            type: [claimSchema],
            default: []
        },
        metadata: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    { timestamps: true }
);

couponSchema.methods.isValid = function isValid() {
    if (!this.isActive) {
        return false;
    }

    const now = new Date();
    if (this.validFrom && now < this.validFrom) {
        return false;
    }

    if (this.validUntil && now > this.validUntil) {
        return false;
    }

    if (Number.isFinite(this.usageLimit) && this.usageLimit !== null) {
        if (this.usageCount >= this.usageLimit) {
            return false;
        }
    }

    return true;
};

couponSchema.methods.calculateDiscount = function calculateDiscount(amount) {
    if (!Number.isFinite(amount) || amount <= 0) {
        return 0;
    }

    let discount = 0;
    if (this.discountType === 'percentage') {
        discount = (amount * this.discountValue) / 100;
    } else {
        discount = this.discountValue;
    }

    if (Number.isFinite(this.maxDiscountAmount) && this.maxDiscountAmount !== null) {
        discount = Math.min(discount, this.maxDiscountAmount);
    }

    return Math.max(0, Math.min(discount, amount));
};

couponSchema.methods.canUserClaim = function canUserClaim(phoneNumber) {
    if (!phoneNumber) {
        return true;
    }

    const entry = this.claimedBy.find((claim) => claim.phoneNumber === phoneNumber);

    if (!entry) {
        return true;
    }

    if (!Number.isFinite(this.perUserLimit) || this.perUserLimit === null) {
        return true;
    }

    return entry.usedCount < this.perUserLimit;
};

couponSchema.methods.incrementUsage = function incrementUsage(phoneNumber) {
    this.usageCount = (this.usageCount || 0) + 1;

    if (!phoneNumber) {
        return;
    }

    const entry = this.claimedBy.find((claim) => claim.phoneNumber === phoneNumber);
    if (entry) {
        entry.usedCount = (entry.usedCount || 0) + 1;
    } else {
        this.claimedBy.push({
            phoneNumber,
            claimedAt: new Date(),
            usedCount: 1
        });
    }
};

module.exports = mongoose.model('Coupon', couponSchema);

