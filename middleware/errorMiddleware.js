const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.status = 404;
    next(error);
};

const errorHandler = (err, req, res, _next) => {
    const statusCode = err.status || err.statusCode || res.statusCode || 500;
    res.status(statusCode);

    const response = {
        message: err.message || 'Internal Server Error',
        status: statusCode,
        requestId: req.id
    };

    if (process.env.NODE_ENV !== 'production') {
        response.stack = err.stack;
    }

    res.json(response);
};

module.exports = {
    notFound,
    errorHandler
};

