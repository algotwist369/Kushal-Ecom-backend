const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { createRazorpayOrder, verifyRazorpayPayment } = require('../controllers/paymentController');

const router = express.Router();

router.post('/create-razorpay-order', protect, createRazorpayOrder);
router.post('/verify-razorpay-payment', protect, verifyRazorpayPayment);

// Legacy routes (for backwards compatibility)
router.post('/create-order', protect, createRazorpayOrder);
router.post('/verify-payment', protect, verifyRazorpayPayment);

module.exports = router;
