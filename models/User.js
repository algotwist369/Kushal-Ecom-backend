const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        index: true           // search optimization
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    phone: {
        type: String,
        index: true
    },
    googleId: {
        type: String,
        sparse: true,
        index: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    address: [
        {
            fullName: String,
            phone: String,
            pincode: String,
            city: String,
            state: String,
            addressLine: String,
            landmark: String,
            default: { type: Boolean, default: false }
        }
    ],
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
