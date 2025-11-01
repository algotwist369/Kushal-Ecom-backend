const NodeCache = require('node-cache');

// Create cache instance with 5 minutes default TTL
const cache = new NodeCache({ 
    stdTTL: 300, // 5 minutes
    checkperiod: 120, // Check for expired keys every 2 minutes
    useClones: false // Don't clone objects for better performance
});

// Cache middleware factory
const cacheMiddleware = (ttl = 300) => {
    return (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Create cache key from URL and query params
        const cacheKey = `${req.originalUrl}:${JSON.stringify(req.query)}`;
        
        // Try to get from cache
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            console.log(`Cache hit for key: ${cacheKey}`);
            return res.json(cachedData);
        }

        // Store original json method
        const originalJson = res.json;
        
        // Override json method to cache response
        res.json = function(data) {
            // Cache the response
            cache.set(cacheKey, data, ttl);
            console.log(`Cached data for key: ${cacheKey} with TTL: ${ttl}s`);
            
            // Call original json method
            return originalJson.call(this, data);
        };

        next();
    };
};

// Cache invalidation helper
const invalidateCache = (pattern) => {
    const keys = cache.keys();
    const regex = new RegExp(pattern);
    
    keys.forEach(key => {
        if (regex.test(key)) {
            cache.del(key);
            console.log(`Invalidated cache key: ${key}`);
        }
    });
};

// Clear all cache
const clearAllCache = () => {
    cache.flushAll();
    console.log('All cache cleared');
};

// Get cache stats
const getCacheStats = () => {
    return cache.getStats();
};

module.exports = {
    cache,
    cacheMiddleware,
    invalidateCache,
    clearAllCache,
    getCacheStats
};
