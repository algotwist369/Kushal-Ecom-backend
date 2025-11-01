require('colors');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const connectDB = require('./config/db.js');

// Security middleware
const {
    securityHeaders,
    sanitizeData,
    sanitizeInput,
    preventParameterPollution,
    corsOptions,
    getAllowedOrigins
} = require('./middleware/securityMiddleware');

// Rate limiting
const { generalLimiter, authLimiter, paymentLimiter } = require('./middleware/rateLimiter');

// Logging
const { accessLogger, errorLogger, consoleLogger, addRequestId } = require('./middleware/requestLogger');

// Cache
const { cacheMiddleware } = require('./middleware/cacheMiddleware');

// Static file serving
const { serveUploads, handleMissingFiles, logFileAccess, addCorsHeaders } = require('./middleware/staticMiddleware');

// Routes
const authRoutes = require('./routes/authRoutes.js');
const googleAuthRoutes = require('./routes/googleAuthRoutes.js');
const productRoutes = require('./routes/productRoutes.js');
const categoryRoutes = require('./routes/categoryRoutes.js');
const cartRoutes = require('./routes/cartRoutes.js');
const orderRoutes = require('./routes/orderRoutes.js');
const couponRoutes = require('./routes/couponRoutes.js');
const paymentRoutes = require('./routes/paymentRoutes.js');
const invoiceRoutes = require('./routes/invoiceRoutes.js');
const searchRoutes = require('./routes/searchRoutes.js');
const analyticsRoutes = require('./routes/analyticsRoutes.js');
const notificationRoutes = require('./routes/notificationRoutes.js');
const uploadRoutes = require('./routes/uploadRoutes.js');
const fileManagementRoutes = require('./routes/fileManagementRoutes.js');
const popUpRoutes = require('./routes/popUpRoutes.js');
const contactRoutes = require('./routes/contactRoutes.js');

// Connect to Database
connectDB();

// Initialize upload directories
const { createUploadDirectories } = require('./utils/fileUtils');
createUploadDirectories();

const app = express();

// Trust proxy for rate limiting and security
app.set('trust proxy', 1);

// Security middleware
app.use(securityHeaders);
// app.use(sanitizeData); // Temporarily disabled - Express 5 compatibility issue
// app.use(sanitizeInput); // Temporarily disabled - Express 5 compatibility issue
app.use(preventParameterPollution);

// CORS
app.use(cors(corsOptions));
// Explicitly enable preflight across the board
app.options('*', cors(corsOptions));

// Morgan HTTP request logger
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')); // Colored, concise output for development
} else {
    app.use(morgan('combined')); // Standard Apache combined log for production
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request ID and logging
app.use(addRequestId);
if (process.env.NODE_ENV === 'production') {
    app.use(accessLogger);
    app.use(errorLogger);
} else {
    app.use(consoleLogger);
}

// Rate limiting
app.use(generalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0'
    });
});

// Serve static files from uploads directory with CORS
app.use('/uploads', (req, res, next) => {
    // Set CORS headers for all upload requests based on request origin
    const origin = req.headers.origin;
    const allowedOrigins = getAllowedOrigins();
    const allowOrigin = allowedOrigins.includes(origin) ? origin : (process.env.FRONTEND_URL || allowedOrigins[0] || 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Origin', allowOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    next();
}, logFileAccess, serveUploads, handleMissingFiles);

// Mount Routes with specific rate limiting
console.log('Mounting routes...'.cyan);
app.use('/v1/api/users', authLimiter, authRoutes);
console.log('✅ Auth routes mounted at /v1/api/users'.green);
app.use('/v1/api/auth', authLimiter, googleAuthRoutes);
console.log('✅ Google auth routes mounted at /v1/api/auth'.green);
app.use('/v1/api/products', cacheMiddleware(300), productRoutes); // 5 min cache
app.use('/v1/api/categories', cacheMiddleware(600), categoryRoutes); // 10 min cache
app.use('/v1/api/cart', cartRoutes);
app.use('/v1/api/orders', orderRoutes);
app.use('/v1/api/coupons', cacheMiddleware(300), couponRoutes); // 5 min cache
app.use('/v1/api/payments', paymentLimiter, paymentRoutes);
app.use('/v1/api/invoices', invoiceRoutes);
app.use('/v1/api/search', cacheMiddleware(300), searchRoutes); // 5 min cache
app.use('/v1/api/analytics', analyticsRoutes);
app.use('/v1/api/notifications', notificationRoutes);
app.use('/v1/api/upload', uploadRoutes);
app.use('/v1/api/files', fileManagementRoutes);
app.use('/v1/api/popups', cacheMiddleware(300), popUpRoutes); // 5 min cache
app.use('/v1/api/contacts', contactRoutes);
console.log('✅ All routes mounted successfully'.green);

// Error Handling Middleware
const { notFound, errorHandler } = require('./middleware/errorMiddleware.js');
app.use(notFound);
app.use(errorHandler);

const server = app.listen(process.env.PORT, () =>
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${process.env.PORT}`.yellow.bold)
);

// Socket.IO setup for real-time notifications
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: getAllowedOrigins(),
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('✅ Client connected to Socket.IO:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
    });
});

// Make io available globally for notification events
global.io = io;

console.log('🔌 Socket.IO initialized for real-time notifications'.green);
