const express = require('express');
const {
    sendWelcomeEmail,
    sendOrderConfirmation,
    sendAdminNotification,
    sendOrderStatusUpdate,
    sendBulkNotification,
    getAllNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationStats
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, authorize('admin'), getAllNotifications);
router.get('/stats', protect, authorize('admin'), getNotificationStats);

router.patch('/:id/read', protect, authorize('admin'), markAsRead);
router.patch('/mark-all-read', protect, authorize('admin'), markAllAsRead);
router.delete('/:id', protect, authorize('admin'), deleteNotification);

router.post('/welcome/:userId', protect, authorize('admin'), sendWelcomeEmail);
router.post('/order-confirmation/:orderId', protect, authorize('admin'), sendOrderConfirmation);
router.post('/order-status/:orderId', protect, authorize('admin'), sendOrderStatusUpdate);
router.post('/admin/:userId', protect, authorize('admin'), sendAdminNotification);
router.post('/bulk', protect, authorize('admin'), sendBulkNotification);

module.exports = router;
