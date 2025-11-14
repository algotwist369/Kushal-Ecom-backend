const cacheStore = new Map();

const buildCacheKey = (req) => {
    const { originalUrl, method, body } = req;
    if (method !== 'GET') return null;
    const bodyKey = body && Object.keys(body).length ? JSON.stringify(body) : '';
    return `${originalUrl}:${bodyKey}`;
};

const cacheMiddleware = (ttlSeconds = 60) => (req, res, next) => {
    const key = buildCacheKey(req);
    if (!key) {
        return next();
    }

    const cacheEntry = cacheStore.get(key);
    if (cacheEntry && cacheEntry.expiry > Date.now()) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cacheEntry.payload);
    }

    res.setHeader('X-Cache', 'MISS');

    const originalJson = res.json.bind(res);
    res.json = (payload) => {
        cacheStore.set(key, {
            payload,
            expiry: Date.now() + ttlSeconds * 1000
        });
        return originalJson(payload);
    };

    next();
};

module.exports = {
    cacheMiddleware
};

