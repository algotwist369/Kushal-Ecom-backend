const mongoose = require('mongoose');
const { buildUniqueSlug } = require('../utils/generateSlug');

const categorySchema = new mongoose.Schema(
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
        image: String,
        isActive: {
            type: Boolean,
            default: true
        },
        parent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category'
        },
        attributes: [
            {
                name: String,
                values: [String]
            }
        ],
        metaTitle: String,
        metaDescription: String,
        displayOrder: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

categorySchema.pre('save', async function setSlug(next) {
    if (this.isModified('name') || !this.slug) {
        this.slug = await buildUniqueSlug(this.constructor, this.name, this._id);
    }
    next();
});

module.exports = mongoose.model('Category', categorySchema);

