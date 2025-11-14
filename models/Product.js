const mongoose = require('mongoose');
const { buildUniqueSlug } = require('../utils/generateSlug');

const packOptionSchema = new mongoose.Schema(
    {
        packSize: { type: Number, min: 1 },
        packPrice: { type: Number, min: 0 },
        savingsPercent: { type: Number, min: 0, max: 100 },
        label: String,
        image: String
    },
    { _id: false }
);

const productLinkSchema = new mongoose.Schema(
    {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, default: 1 },
        bundlePrice: Number,
        savingsAmount: Number
    },
    { _id: false }
);

const freeProductSchema = new mongoose.Schema(
    {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, default: 1 },
        minQuantity: { type: Number, default: 1 }
    },
    { _id: false }
);

const reviewSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, trim: true },
        images: { type: [String], default: [] }
    },
    { timestamps: true }
);

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        slug: {
            type: String,
            unique: true,
            index: true
        },
        description: String,
        price: {
            type: Number,
            required: true,
            min: 0
        },
        discountPrice: {
            type: Number,
            min: 0
        },
        stock: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category'
        },
        images: {
            type: [String],
            default: []
        },
        attributes: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        isActive: {
            type: Boolean,
            default: true
        },
        averageRating: {
            type: Number,
            default: 0
        },
        numReviews: {
            type: Number,
            default: 0
        },
        ratingBreakdown: {
            type: Map,
            of: Number,
            default: {}
        },
        ingredients: [{
            image: String,
            name: String,
            description: String
        }],
        benefits: [{
            image: String,
            name: String,
            description: String
        }],
        dosage: String,
        contraindications: [{
            image: String,
            name: String,
            description: String
        }],
        shelfLife: String,
        storageInstructions: String,
        manufacturer: String,
        batchNumber: String,
        expiryDate: Date,
        certification: [{
            image: String,
            name: String,
            description: String
        }],
        origin: String,
        processingMethod: String,
        potency: String,
        formulation: String,
        ageGroup: {
            type: [String],
            default: []
        },
        gender: {
            type: [String],
            default: []
        },
        season: {
            type: [String],
            default: []
        },
        timeOfDay: {
            type: [String],
            default: []
        },
        faq: [
            {
                question: String,
                answer: String
            }
        ],
        howToUse: [{
            image: String,
            name: String,
            description: String
        }],
        howToStore: [{
            image: String,
            name: String,
            description: String
        }],
        howToConsume: [{
            image: String,
            name: String,
            description: String
        }],
        metaTitle: String,
        metaDescription: String,
        keywords: {
            type: [String],
            default: []
        },
        packOptions: {
            type: [packOptionSchema],
            default: []
        },
        freeProducts: {
            type: [freeProductSchema],
            default: []
        },
        bundleWith: {
            type: [productLinkSchema],
            default: []
        },
        offerText: String,
        isOnOffer: {
            type: Boolean,
            default: false
        },
        freeShipping: {
            type: Boolean,
            default: false
        },
        shippingCost: {
            type: Number,
            default: 0
        },
        minOrderForFreeShipping: {
            type: Number,
            default: 0
        },
        tags: {
            type: [String],
            default: []
        },
        views: {
            type: Number,
            default: 0
        },
        reviews: {
            type: [reviewSchema],
            default: []
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    { timestamps: true }
);

productSchema.pre('save', async function generateSlug(next) {
    if (this.isModified('name') || !this.slug) {
        this.slug = await buildUniqueSlug(this.constructor, this.name, this._id);
    }
    next();
});

productSchema.methods.getRatingStats = function getRatingStats() {
    const stats = {
        total: this.reviews.length,
        average: 0,
        breakdown: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
        }
    };

    if (!this.reviews.length) {
        return stats;
    }

    let totalScore = 0;
    this.reviews.forEach((review) => {
        const rating = Math.round(review.rating || 0);
        if (rating >= 1 && rating <= 5) {
            stats.breakdown[rating] += 1;
        }
        totalScore += review.rating || 0;
    });

    stats.average = Number((totalScore / this.reviews.length).toFixed(2));
    return stats;
};

productSchema.methods.updateRating = async function updateRating() {
    const stats = this.getRatingStats();
    this.averageRating = stats.average;
    this.numReviews = stats.total;
    this.ratingBreakdown = stats.breakdown;
    await this.save();
    return this;
};

module.exports = mongoose.model('Product', productSchema);

