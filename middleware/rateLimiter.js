const rateLimit = require('express-rate-limit');

const buildLimiter = ({ windowMs, max, message, skipSuccessfulRequests = false }) =>
    rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests,
        handler: (req, res, _next, options) => {
            res.status(options.statusCode || 429).json({
                message:
                    message ||
                    'Too many requests from this IP, please try again after a short break.',
                retryAfter: Math.ceil((options.windowMs || windowMs) / 1000)
            });
        }
    });

const generalLimiter = buildLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_GENERAL_MAX, 10) || 500
});

const authLimiter = buildLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: parseInt(process.env.RATE_LIMIT_AUTH_MAX, 10) || 50,
    skipSuccessfulRequests: true,
    message: 'Too many login attempts. Please try again in a few minutes.'
});

const paymentLimiter = buildLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: parseInt(process.env.RATE_LIMIT_PAYMENT_MAX, 10) || 20,
    message: 'Payment attempts rate limit exceeded. Please wait before retrying.'
});

module.exports = {
    generalLimiter,
    authLimiter,
    paymentLimiter
};

