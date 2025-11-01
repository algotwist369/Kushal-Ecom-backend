const express = require('express');
const {
    createOrder,
    getUserOrders,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
    deleteOrder
} = require('../controllers/orderController.js');
const { protect, admin } = require('../middleware/authMiddleware.js');

const router = express.Router();

// User
router.post('/', protect, createOrder);
router.get('/my-orders', protect, getUserOrders);
router.put('/:id/cancel', protect, cancelOrder);

// Admin
router.get('/', protect, admin, getAllOrders);
router.get('/:id', protect, admin, getOrderById);
router.put('/:id/status', protect, admin, updateOrderStatus);
router.delete('/:id', protect, admin, deleteOrder);

module.exports = router;
