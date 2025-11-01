const rateLimit = require('express-rate-limit');

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// General rate limiter
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 1000 : 100, // Much higher limit in development
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isDevelopment && process.env.DISABLE_RATE_LIMIT === 'true', // Can disable completely in dev
});

// Auth rate limiter (stricter for login/register)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 100 : 5, // More lenient in development
    message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isDevelopment && process.env.DISABLE_RATE_LIMIT === 'true',
});

// Payment rate limiter (very strict)
const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 50 : 3, // More lenient in development
    message: {
        error: 'Too many payment attempts, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isDevelopment && process.env.DISABLE_RATE_LIMIT === 'true',
});

module.exports = {
    generalLimiter,
    authLimiter,
    paymentLimiter
};
