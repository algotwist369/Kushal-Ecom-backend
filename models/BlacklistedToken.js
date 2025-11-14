const mongoose = require('mongoose');

const blacklistedTokenSchema = new mongoose.Schema(
    {
        token: {
            type: String,
            required: true,
            index: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reason: {
            type: String
        },
        expiresAt: {
            type: Date,
            required: true,
            index: true
        }
    },
    { timestamps: true }
);

blacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('BlacklistedToken', blacklistedTokenSchema);

