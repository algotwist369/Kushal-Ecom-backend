const User = require('../models/User');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const { handleAsync } = require('../utils/handleAsync');
const sendEmail = require('../utils/sendEmail');
const { 
    welcomeEmailTemplate, 
    orderConfirmationTemplate, 
    adminNotificationTemplate 
} = require('../utils/emailTemplates');

// Send welcome email to new user
const sendWelcomeEmail = handleAsync(async (req, res) => {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    try {
        const emailHtml = welcomeEmailTemplate(user.name);
        await sendEmail(user.email, 'Welcome to Prolific Healing Herbs!', emailHtml);
        
        res.json({ message: 'Welcome email sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to send welcome email', error: error.message });
    }
});

// Send order confirmation email
const sendOrderConfirmation = handleAsync(async (req, res) => {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate('user');
    
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    try {
        const emailHtml = orderConfirmationTemplate(order, order.user);
        await sendEmail(order.user.email, 'Order Confirmation - Prolific Healing Herbs', emailHtml);
        
        res.json({ message: 'Order confirmation email sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to send order confirmation email', error: error.message });
    }
});

// Send admin notification
const sendAdminNotification = handleAsync(async (req, res) => {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@ayurvedicstore.com';
        const emailHtml = adminNotificationTemplate(user);
        await sendEmail(adminEmail, 'New User Registration - Admin Notification', emailHtml);
        
        res.json({ message: 'Admin notification sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to send admin notification', error: error.message });
    }
});

// Send order status update notification
const sendOrderStatusUpdate = handleAsync(async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;
    
    const order = await Order.findById(orderId).populate('user');
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    try {
        const statusMessages = {
            'processing': 'Your order is being processed',
            'shipped': 'Your order has been shipped',
            'delivered': 'Your order has been delivered',
            'cancelled': 'Your order has been cancelled'
        };

        const subject = `Order Update - ${statusMessages[status] || 'Status Updated'}`;
        const emailHtml = `
            <h2>Order Status Update</h2>
            <p>Dear ${order.user.name},</p>
            <p>Your order #${order._id} status has been updated to: <strong>${status}</strong></p>
            <p>Thank you for choosing Prolific Healing Herbs!</p>
        `;

        await sendEmail(order.user.email, subject, emailHtml);
        
        res.json({ message: 'Order status update notification sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to send order status update', error: error.message });
    }
});

// Send bulk notification to all users
const sendBulkNotification = handleAsync(async (req, res) => {
    const { subject, message, userType = 'all' } = req.body;
    
    let users;
    if (userType === 'all') {
        users = await User.find({ isActive: true });
    } else {
        users = await User.find({ role: userType, isActive: true });
    }

    const emailHtml = `
        <h2>${subject}</h2>
        <p>${message}</p>
        <p>Best regards,<br>Prolific Healing Herbs Team</p>
    `;

    const results = [];
    for (const user of users) {
        try {
            await sendEmail(user.email, subject, emailHtml);
            results.push({ userId: user._id, status: 'sent' });
        } catch (error) {
            results.push({ userId: user._id, status: 'failed', error: error.message });
        }
    }

    res.json({ 
        message: 'Bulk notification process completed',
        results,
        totalSent: results.filter(r => r.status === 'sent').length,
        totalFailed: results.filter(r => r.status === 'failed').length
    });
});

// Get all notifications (Admin only)
const getAllNotifications = handleAsync(async (req, res) => {
    const { type, isRead, limit = 50, page = 1 } = req.query;
    
    const filter = {};
    if (type) filter.type = type;
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const notifications = await Notification.find(filter)
        .populate('relatedUser', 'name email')
        .populate('relatedProduct', 'name price images')
        .populate('relatedOrder', 'orderNumber totalAmount')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip);
    
    const total = await Notification.countDocuments(filter);
    
    res.json({
        notifications,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        total
    });
});

// Mark notification as read
const markAsRead = handleAsync(async (req, res) => {
    const { id } = req.params;
    
    const notification = await Notification.findByIdAndUpdate(
        id,
        { 
            isRead: true,
            $addToSet: { readBy: req.user._id }
        },
        { new: true }
    );
    
    if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(notification);
});

// Mark all notifications as read
const markAllAsRead = handleAsync(async (req, res) => {
    await Notification.updateMany(
        { isRead: false },
        { 
            isRead: true,
            $addToSet: { readBy: req.user._id }
        }
    );
    
    res.json({ message: 'All notifications marked as read' });
});

// Delete notification
const deleteNotification = handleAsync(async (req, res) => {
    const { id } = req.params;
    
    const notification = await Notification.findByIdAndDelete(id);
    
    if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted successfully' });
});

// Get notification stats
const getNotificationStats = handleAsync(async (req, res) => {
    const total = await Notification.countDocuments();
    const unread = await Notification.countDocuments({ isRead: false });
    const byType = await Notification.aggregate([
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 }
            }
        }
    ]);
    
    res.json({
        total,
        unread,
        read: total - unread,
        byType: byType.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {})
    });
});

module.exports = {
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
};
