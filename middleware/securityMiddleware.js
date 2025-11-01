const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
require('dotenv').config();

// Security headers
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false
});

// Sanitize data against NoSQL query injection (Express 5 compatible)
const sanitizeData = mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        console.log(`Sanitized ${key} in request`.yellow);
    }
});

// Clean user input from malicious HTML
const sanitizeInput = xss();

// Prevent parameter pollution
const preventParameterPollution = hpp();

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

module.exports = {
    securityHeaders,
    sanitizeData,
    sanitizeInput,
    preventParameterPollution,
    corsOptions
};
