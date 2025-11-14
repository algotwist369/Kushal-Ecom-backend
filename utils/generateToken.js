const jwt = require('jsonwebtoken');

const DEFAULT_EXPIRY = '30d';

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined');
    }
    return secret;
};

const generateToken = (userId, options = {}) => {
    if (!userId) {
        throw new Error('generateToken requires a userId');
    }

    const payload = { id: userId };
    const signOptions = {
        expiresIn: options.expiresIn || process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRY,
        ...options.signOptions
    };

    return jwt.sign(payload, getJwtSecret(), signOptions);
};

module.exports = { generateToken };

