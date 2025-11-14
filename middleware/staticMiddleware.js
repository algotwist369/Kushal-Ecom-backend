const path = require('path');
const fs = require('fs');
const express = require('express');
const { getAllowedOrigins } = require('./securityMiddleware');

const uploadsDir = path.join(__dirname, '..', 'uploads');

const ensureUploadsDir = () => {
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
};

const addCorsHeaders = (req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = getAllowedOrigins();
    const allowedOrigin = allowedOrigins.includes(origin)
        ? origin
        : allowedOrigins[0] || 'http://localhost:5173';

    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
};

const logFileAccess = (req, _res, next) => {
    console.log(`[UPLOADS] ${req.method} ${req.originalUrl}`);
    next();
};

const serveUploads = (() => {
    ensureUploadsDir();
    return express.static(uploadsDir, {
        fallthrough: true,
        maxAge: '1d',
        setHeaders: (res) => {
            res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type');
        }
    });
})();

const handleMissingFiles = (req, res) => {
    res.status(404).json({
        message: 'File not found',
        path: req.originalUrl
    });
};

module.exports = {
    addCorsHeaders,
    logFileAccess,
    serveUploads,
    handleMissingFiles
};

