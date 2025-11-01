const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
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

// All notification routes require authentication
router.use(protect);

// Get all notifications (Admin only)
router.get('/', admin, getAllNotifications);

// Get notification stats (Admin only)
router.get('/stats', admin, getNotificationStats);

// Mark notification as read (Admin only)
router.patch('/:id/read', admin, markAsRead);

// Mark all notifications as read (Admin only)
router.patch('/mark-all-read', admin, markAllAsRead);

// Delete notification (Admin only)
router.delete('/:id', admin, deleteNotification);

// Send welcome email (Admin only)
router.post('/welcome/:userId', admin, sendWelcomeEmail);

// Send order confirmation (Admin only)
router.post('/order-confirmation/:orderId', admin, sendOrderConfirmation);

// Send admin notification (Admin only)
router.post('/admin-notification/:userId', admin, sendAdminNotification);

// Send order status update (Admin only)
router.post('/order-status/:orderId', admin, sendOrderStatusUpdate);

// Send bulk notification (Admin only)
router.post('/bulk', admin, sendBulkNotification);

module.exports = router;
