/**
 * Custom sanitization middleware compatible with Express 5
 * Replaces express-mongo-sanitize for better Express 5 compatibility
 */

/**
 * Recursively sanitize objects to prevent NoSQL injection
 */
const sanitizeObject = (obj) => {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }

    if (typeof obj !== 'object') {
        return obj;
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        // Remove MongoDB operators from keys
        const sanitizedKey = key.replace(/^\$/, '_');
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            sanitized[sanitizedKey] = sanitizeObject(value);
        } else if (Array.isArray(value)) {
            sanitized[sanitizedKey] = value.map(item => sanitizeObject(item));
        } else {
            // Check for MongoDB operators in string values
            if (typeof value === 'string' && /^\$/.test(value)) {
                sanitized[sanitizedKey] = value.replace(/^\$/, '_');
            } else {
                sanitized[sanitizedKey] = value;
            }
        }
    }

    return sanitized;
};

/**
 * Set a property on req object (compatible with Express 5)
 */
const setReqProperty = (req, property, value) => {
    try {
        Object.defineProperty(req, property, {
            value: value,
            writable: true,
            configurable: true,
            enumerable: true
        });
    } catch (error) {
        // Fallback: use a different property name
        req[`_${property}`] = value;
    }
};

/**
 * Main sanitization middleware
 */
const sanitizeMiddleware = (req, res, next) => {
    try {
        // Sanitize query parameters
        if (req.query && Object.keys(req.query).length > 0) {
            const sanitizedQuery = sanitizeObject(req.query);
            setReqProperty(req, 'query', sanitizedQuery);
        }

        // Sanitize body parameters
        if (req.body && Object.keys(req.body).length > 0) {
            req.body = sanitizeObject(req.body);
        }

        // Sanitize params
        if (req.params && Object.keys(req.params).length > 0) {
            const sanitizedParams = sanitizeObject(req.params);
            setReqProperty(req, 'params', sanitizedParams);
        }

        next();
    } catch (error) {
        // If sanitization fails, log and continue (don't break the request)
        if (process.env.NODE_ENV === 'development') {
            console.warn('Sanitization warning:', error.message);
        }
        next();
    }
};

module.exports = sanitizeMiddleware;

