const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');
const { handleAsync } = require('../utils/handleAsync');
const { verifyGoogleToken } = require('../utils/googleAuth');

/**
 * Google OAuth Login/Signup
 * Creates new user if doesn't exist, or logs in existing user
 */
const googleAuth = handleAsync(async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ message: 'Google credential is required' });
    }

    try {
        // Verify Google token
        const googleUser = await verifyGoogleToken(credential);

        // Check if user exists
        let user = await User.findOne({ email: googleUser.email });

        if (user) {
            // Check if account is active
            if (!user.isActive) {
                return res.status(401).json({
                    message: 'Account is inactive or no longer exists'
                });
            }

            // User exists - login
            // Update Google ID if not set
            if (!user.googleId) {
                user.googleId = googleUser.googleId;
                await user.save();
            }
        } else {
            // User doesn't exist - create new user
            user = await User.create({
                name: googleUser.name,
                email: googleUser.email,
                googleId: googleUser.googleId,
                // Generate a random password for OAuth users
                // Generate a random password that meets validation requirements (Uppercase, Lowercase, Number, 8+ chars)
                password: Math.random().toString(36).slice(-8) + 'Aa1' + Math.random().toString(36).slice(-8).toUpperCase(),
                isActive: true,
            });
        }

        // Return user data with token
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            token: generateToken(user._id),
            message: user.isNew ? 'Account created successfully' : 'Login successful'
        });

    } catch (error) {
        console.error('Google auth error:', error);
        res.status(401).json({
            message: error.message || 'Google authentication failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = {
    googleAuth
};

