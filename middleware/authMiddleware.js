const jwt = require('jsonwebtoken');
const User = require('../models/User');
const BlacklistedToken = require('../models/BlacklistedToken');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        // Check if token is blacklisted
        const blacklisted = await BlacklistedToken.findOne({ token });
        if (blacklisted) {
            return res.status(401).json({ 
                message: 'Token has been invalidated. Please login again.',
                reason: blacklisted.reason
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        
        if (!req.user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Check if user is active
        if (!req.user.isActive) {
            // Blacklist token if user is inactive
            await BlacklistedToken.create({
                token,
                userId: req.user._id,
                reason: 'user_deactivated',
                expiresAt: new Date(decoded.exp * 1000)
            });
            
            return res.status(403).json({ 
                message: 'Your account has been deactivated. Please contact support.'
            });
        }

        req.token = token; // Store token for logout
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
};

module.exports = { protect, admin };