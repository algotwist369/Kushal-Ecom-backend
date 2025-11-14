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
} = require('../controllers/couponController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public coupon endpoints
router.get('/active', getActiveCoupons);
router.post('/claim', claimCoupon);
router.post('/validate', protect, validateCoupon);

// Admin coupon management
router.get('/', protect, authorize('admin'), getAllCoupons);
router.post('/', protect, authorize('admin'), createCoupon);
router.get('/:id', protect, authorize('admin'), getCouponById);
router.put('/:id', protect, authorize('admin'), updateCoupon);
router.delete('/:id', protect, authorize('admin'), deleteCoupon);

module.exports = router;
