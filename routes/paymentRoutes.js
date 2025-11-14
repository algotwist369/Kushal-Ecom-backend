const express = require('express');
const { createRazorpayOrder, verifyRazorpayPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/create-razorpay-order', protect, createRazorpayOrder);
router.post('/verify-razorpay-payment', protect, verifyRazorpayPayment);

module.exports = router;
