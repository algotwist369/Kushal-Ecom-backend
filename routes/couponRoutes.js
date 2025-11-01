const express = require('express');
const {
    getAllCoupons,
    getCouponById,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    claimCoupon,
    getActiveCoupons,
    validateCoupon
} = require('../controllers/couponController.js');
const { protect, admin } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Public routes
router.get('/active', getActiveCoupons);
router.post('/claim', claimCoupon);
router.post('/validate', protect, validateCoupon);

// Admin routes
router.get('/', protect, admin, getAllCoupons);
router.post('/', protect, admin, createCoupon);
router.get('/:id', protect, admin, getCouponById);
router.put('/:id', protect, admin, updateCoupon);
router.delete('/:id', protect, admin, deleteCoupon);

module.exports = router;
