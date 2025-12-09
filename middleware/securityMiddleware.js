const DEFAULT_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173'
];

const parseOriginsFromEnv = () => {
    const envOrigins = [
        process.env.FRONTEND_URL,
        process.env.ADMIN_URL,
        process.env.CLIENT_URL,
        process.env.ALLOWED_ORIGINS
    ]
        .filter(Boolean)
        .flatMap((value) => value.split(','))
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0);

    const combined = [...DEFAULT_ALLOWED_ORIGINS, ...envOrigins];
    return Array.from(new Set(combined));
};

const getAllowedOrigins = () => parseOriginsFromEnv();

const securityHeaders = (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

    // Enforce HTTPS when behind a proxy that terminates TLS
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    next();
};

const preventParameterPollution = (req, res, next) => {
    // Check if query exists and has properties
    if (!req.query || Object.keys(req.query).length === 0) {
        return next();
    }

    const cleanQuery = {};
    let needsCleaning = false;

    Object.keys(req.query).forEach((key) => {
        const value = req.query[key];

        if (Array.isArray(value)) {
            cleanQuery[key] = value[value.length - 1];
            needsCleaning = true;
        } else if (value !== undefined) {
            cleanQuery[key] = value;
        }
    });

    // Only update if we found arrays (parameter pollution)
    if (needsCleaning) {
        // Use Object.defineProperty to set query for Express 5 compatibility
        try {
            Object.defineProperty(req, 'query', {
                value: cleanQuery,
                writable: true,
                configurable: true,
                enumerable: true
            });
        } catch (error) {
            // If we can't set it directly, use a fallback property
            // Routes should check req.cleanQuery if req.query is read-only
            req.cleanQuery = cleanQuery;
            if (process.env.NODE_ENV === 'development') {
                console.warn('Could not set req.query directly, using req.cleanQuery');
            }
        }
    }
    
    next();
};

const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = getAllowedOrigins();

        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // Allow only explicit subdomains (www, admin, api) for security
        const originHost = origin.replace(/^https?:\/\//i, '');
        const allowedSubdomains = ['www', 'admin', 'api']; // Explicit whitelist
        const isSubdomainAllowed = allowedOrigins.some((allowed) => {
            const allowedHost = allowed.replace(/^https?:\/\//i, '');
            if (originHost === allowedHost) return true;
            // Check if it's an allowed subdomain
            return allowedSubdomains.some(sub => originHost === `${sub}.${allowedHost}`);
        });

        if (isSubdomainAllowed) {
            return callback(null, true);
        }

        return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control',
        'Pragma'
    ],
    exposedHeaders: ['Content-Length', 'ETag', 'X-Request-Id'],
    optionsSuccessStatus: 204
};

module.exports = {
    securityHeaders,
    preventParameterPollution,
    corsOptions,
    getAllowedOrigins
};

