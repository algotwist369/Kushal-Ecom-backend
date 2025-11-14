const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        subject: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['new', 'in_progress', 'resolved', 'closed'],
            default: 'new'
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium'
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        resolvedAt: Date,
        adminNotes: String,
        tags: {
            type: [String],
            default: []
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Contact', contactSchema);

