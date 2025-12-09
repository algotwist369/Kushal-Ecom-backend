const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.status = 404;
    next(error);
};

const errorHandler = (err, req, res, _next) => {
    const statusCode = err.status || err.statusCode || res.statusCode || 500;
    res.status(statusCode);

    // Sanitize error messages in production to prevent information leakage
    const isProduction = process.env.NODE_ENV === 'production';
    
    const response = {
        message: isProduction 
            ? (statusCode === 500 ? 'Internal Server Error' : err.message || 'An error occurred')
            : err.message || 'Internal Server Error',
        status: statusCode,
        requestId: req.id
    };

    if (!isProduction) {
        response.stack = err.stack;
        response.details = err;
    }

    // Log error details server-side
    console.error(`Error ${statusCode} [${req.id}]:`, {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
    });

    res.json(response);
};

module.exports = {
    notFound,
    errorHandler
};

