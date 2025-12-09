const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const addressSchema = new mongoose.Schema(
    {
        street: String,
        city: String,
        state: String,
        country: String,
        postalCode: String
    },
    { _id: false }
);

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            validate: [validator.isEmail, 'Please provide a valid email address']
        },
        password: {
            type: String,
            required: true,
            minlength: 8,
            validate: {
                validator: function(v) {
                    // Skip validation if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
                    // This prevents validation errors when loading existing users or updating other fields
                    if (v && (v.startsWith('$2a$') || v.startsWith('$2b$') || v.startsWith('$2y$'))) {
                        return true; // Already hashed, skip validation
                    }
                    // Skip validation if password hasn't been modified (updating other fields)
                    if (this.isModified && !this.isModified('password')) {
                        return true; // Password not changed, skip validation
                    }
                    // Validate password format for new passwords or password changes
                    // At least 8 characters, with uppercase, lowercase, number and optionally special character
                    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/.test(v);
                },
                message: 'Password must be at least 8 characters with uppercase, lowercase, and number'
            }
        },
        phone: {
            type: String,
            trim: true
        },
        address: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },
        deliveryAddresses: [addressSchema],
        role: {
            type: String,
            enum: ['user', 'admin', 'staff'],
            default: 'user'
        },
        isActive: {
            type: Boolean,
            default: true
        },
        googleId: {
            type: String,
            index: true,
            sparse: true
        },
        avatar: {
            type: String
        },
        lastLoginAt: {
            type: Date
        },
        resetPasswordToken: String,
        resetPasswordExpires: Date,
        meta: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.matchPassword = function matchPassword(enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
    const obj = this.toObject({ getters: true, virtuals: false });
    delete obj.password;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpires;
    return obj;
};

userSchema.set('toJSON', {
    transform: (_doc, ret) => {
        delete ret.password;
        delete ret.__v;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        return ret;
    }
});

module.exports = mongoose.model('User', userSchema);

