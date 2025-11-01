const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getDashboardAnalytics,
    getProductAnalytics,
    getSalesAnalytics
} = require('../controllers/analyticsController');

// All analytics routes require admin access
router.use(protect);
router.use(admin);

// Dashboard analytics
router.get('/dashboard', getDashboardAnalytics);

// Product analytics
router.get('/products', getProductAnalytics);

// Sales analytics
router.get('/sales', getSalesAnalytics);

module.exports = router;
