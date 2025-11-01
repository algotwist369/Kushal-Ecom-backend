const express = require('express');
const path = require('path');
const fs = require('fs');

// Middleware to add CORS headers for uploaded files
const addCorsHeaders = (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
};

// Serve static files from uploads directory
const serveUploads = express.static(path.join(__dirname, '../uploads'), {
    maxAge: '1d', // Cache for 1 day
    etag: true,
    lastModified: true
});

// Middleware to handle missing files
const handleMissingFiles = (req, res, next) => {
    const filePath = path.join(__dirname, '../uploads', req.path);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({
            message: 'File not found',
            path: req.path
        });
    }
    
    next();
};

// Middleware to log file access
const logFileAccess = (req, res, next) => {
    if (req.path.startsWith('/uploads/')) {
        console.log(`File accessed: ${req.path} - ${req.method} - ${req.ip}`);
    }
    next();
};

module.exports = {
    serveUploads,
    handleMissingFiles,
    logFileAccess,
    addCorsHeaders
};
