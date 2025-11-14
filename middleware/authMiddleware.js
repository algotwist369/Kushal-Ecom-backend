const jwt = require('jsonwebtoken');
const User = require('../models/User');
const BlacklistedToken = require('../models/BlacklistedToken');

const getTokenFromRequest = (req) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        return req.headers.authorization.split(' ')[1];
    }

    if (req.cookies && req.cookies.token) {
        return req.cookies.token;
    }

    return null;
};

const protect = async (req, res, next) => {
    try {
        const token = getTokenFromRequest(req);
        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        const isBlacklisted = await BlacklistedToken.exists({ token });
        if (isBlacklisted) {
            return res.status(401).json({ message: 'Session expired. Please log in again.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || !user.isActive) {
            return res.status(401).json({ message: 'Account is inactive or no longer exists' });
        }

        req.user = user;
        req.token = token;

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({ message: 'Not authorized' });
    }
};

const authorize = (...allowedRoles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized' });
    }

    if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
};

module.exports = {
    protect,
    authorize
};

