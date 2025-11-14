const express = require('express');
const {
    createOrder,
    getUserOrders,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
    deleteOrder
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createOrder);
router.get('/my-orders', protect, getUserOrders);

router.get('/', protect, authorize('admin'), getAllOrders);
router.put('/:id/status', protect, authorize('admin'), updateOrderStatus);
router.delete('/:id', protect, authorize('admin'), deleteOrder);

router.put('/:id/cancel', protect, cancelOrder);
router.get('/:id', protect, authorize('admin'), getOrderById);

module.exports = router;
