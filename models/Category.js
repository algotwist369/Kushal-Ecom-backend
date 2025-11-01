const mongoose = require('mongoose');
const { generateUniqueSlug } = require('../utils/generateSlug');
const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        index: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    description: String,
    image: String, // optional
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Generate slug before saving
categorySchema.pre('save', async function (next) {
    if (this.isModified('name') && !this.slug) {
        this.slug = await generateUniqueSlug(this.constructor, this.name, this._id);
    }
    next();
});

// Update slug if name changes
categorySchema.pre('save', async function (next) {
    if (this.isModified('name') && this.slug) {
        this.slug = await generateUniqueSlug(this.constructor, this.name, this._id);
    }
    next();
});

module.exports = mongoose.model('Category', categorySchema);
