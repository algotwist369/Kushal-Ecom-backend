const express = require('express');
const {
    getDashboardAnalytics,
    getProductAnalytics,
    getSalesAnalytics
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/dashboard', protect, authorize('admin'), getDashboardAnalytics);
router.get('/products', protect, authorize('admin'), getProductAnalytics);
router.get('/sales', protect, authorize('admin'), getSalesAnalytics);

module.exports = router;
