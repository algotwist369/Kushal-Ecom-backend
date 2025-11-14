const handleAsync = (fn) => {
    if (typeof fn !== 'function') {
        throw new TypeError('handleAsync expects a function');
    }

    return async (req, res, next) => {
        try {
            await fn(req, res, next);
        } catch (error) {
            next(error);
        }
    };
};

module.exports = { handleAsync };

