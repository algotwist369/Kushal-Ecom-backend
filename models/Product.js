const mongoose = require('mongoose');
const { generateUniqueSlug } = require('../utils/generateSlug');

// Review Subdocument Schema
const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true
    },
    images: [{
        type: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure a user can only leave one review per product
reviewSchema.index({ user: 1 }, { unique: false });

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        index: true,
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        index: true
    },
    discountPrice: {
        type: Number
    },
    stock: {
        type: Number,
        required: true,
        index: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
        index: true
    },
    images: [String],
    attributes: {
        type: Map,
        of: String
    },
    // ⭐ Ratings & Reviews Section
    reviews: [reviewSchema],
    averageRating: {
        type: Number,
        default: 0,
        index: true
    },
    numReviews: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Ayurvedic-specific fields
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
    }], // FSSAI, ISO, etc.
    origin: String, // Country/Region of origin
    processingMethod: String, // Traditional, Modern, etc.
    potency: String, // High, Medium, Low
    formulation: String, // Tablet, Powder, Oil, etc.
    ageGroup: [String], // Adult, Child, Senior, etc.
    gender: [String], // Male, Female, Unisex
    season: [String], // Summer, Winter, Monsoon, All season
    timeOfDay: [String], // Morning, Evening, Night, Anytime
    faq: [{
        question: String,
        answer: String
    }],
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
    // SEO fields
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
    // Pack & Combo Options
    packOptions: [{
        packSize: Number, // e.g., 2, 3, 5
        packPrice: Number, // Special price for pack
        savingsPercent: Number, // How much % saved
        label: String, // e.g., "Pack of 2", "Family Pack"
        image: String // Pack option specific image
    }],
    freeProducts: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        minQuantity: Number, // Buy X to get this free
        quantity: Number // How many free items
    }],
    bundleWith: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        bundlePrice: Number, // Combo price
        savingsAmount: Number
    }],
    offerText: String, // e.g., "Buy 2 Get 1 Free", "Limited Time Offer"
    isOnOffer: {
        type: Boolean,
        default: false
    },
    // Shipping Options
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
        default: 0 // Free shipping above this amount (0 means no minimum)
    }
}, { timestamps: true });

// Compound index for faster filtering
productSchema.index({ category: 1, price: 1 });

// Method to update average rating easily
productSchema.methods.updateRating = function () {
    if (this.reviews.length > 0) {
        this.numReviews = this.reviews.length;
        this.averageRating =
            this.reviews.reduce((acc, item) => acc + item.rating, 0) / this.numReviews;
    } else {
        this.numReviews = 0;
        this.averageRating = 0;
    }
    return this.save();
};

// Method to get rating statistics
productSchema.methods.getRatingStats = function () {
    const stats = {
        averageRating: this.averageRating,
        totalReviews: this.numReviews,
        distribution: {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0
        }
    };

    if (this.reviews && this.reviews.length > 0) {
        this.reviews.forEach(review => {
            stats.distribution[review.rating] = (stats.distribution[review.rating] || 0) + 1;
        });
    }

    // Calculate percentages
    stats.distributionPercentage = {};
    Object.keys(stats.distribution).forEach(rating => {
        stats.distributionPercentage[rating] = this.numReviews > 0 
            ? Math.round((stats.distribution[rating] / this.numReviews) * 100)
            : 0;
    });

    return stats;
};

// Generate slug before saving - handles both new documents and name changes
productSchema.pre('save', async function (next) {
    try {
        // Ensure name exists and is not empty
        if (!this.name || !this.name.trim()) {
            return next(new Error('Product name is required'));
        }

        const trimmedName = this.name.trim();

        // Always generate slug if it doesn't exist (for new products)
        // Or regenerate if name changes (slug is always auto-generated from name)
        if (!this.slug || this.isModified('name')) {
            this.slug = await generateUniqueSlug(this.constructor, trimmedName, this._id);
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Product', productSchema);
