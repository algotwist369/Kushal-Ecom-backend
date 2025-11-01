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

// Centralized allowed origins helper
const getAllowedOrigins = () => {
    const envList = process.env.ALLOWED_ORIGINS?.split(',').map(s => s.trim()).filter(Boolean) || [];
    // Defaults include provided production URLs and localhost for dev
    const defaults = [
        'https://ui.rootedremedies.in',
        'http://ui.rootedremedies.in',
        'http://localhost:5173'
    ];
    // Merge uniquely, preserve env precedence
    const set = new Set([...envList, ...defaults]);
    return Array.from(set);
};

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        const allowedOrigins = getAllowedOrigins();
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200
};

module.exports = {
    securityHeaders,
    sanitizeData,
    sanitizeInput,
    preventParameterPollution,
    corsOptions,
    getAllowedOrigins
};
