 
const User = require('../models/User');
const Notification = require('../models/Notification');
const BlacklistedToken = require('../models/BlacklistedToken');
const { generateToken } = require('../utils/generateToken');
const { handleAsync } = require('../utils/handleAsync');
const validateObjectId = require('../utils/validateObjectId');
const sendEmail = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');

const registerUser = handleAsync(async (req, res) => {
    const { name, email, password, phone, address } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
        name,
        email,
        password,
        phone,
        address,
    });

    if (user) {
        // Send email notification to admin and create notification in database
        try {
            const adminEmail = process.env.ADMIN_EMAIL || 'admin@ayurvedicstore.com';
            const emailSubject = 'New User Registration - Prolific Healing Herbs';
            const emailHtml = `
                <h2>New User Registration</h2>
                <p>A new user has registered on your Prolific Healing Herbs:</p>
                <ul>
                    <li><strong>Name:</strong> ${user.name}</li>
                    <li><strong>Email:</strong> ${user.email}</li>
                    <li><strong>Phone:</strong> ${user.phone || 'Not provided'}</li>
                    <li><strong>Registration Date:</strong> ${new Date().toLocaleString()}</li>
                </ul>
                <p>Please check your admin dashboard for more details.</p>
            `;
            
            // Send email to admin
            await sendEmail(adminEmail, emailSubject, emailHtml);

            // Create notification in database
            const notification = await Notification.create({
                type: 'new_user',
                title: 'New User Registration',
                message: `${user.name} (${user.email}) has registered`,
                relatedUser: user._id,
                metadata: {
                    userName: user.name,
                    userEmail: user.email,
                    userPhone: user.phone
                }
            });

            // Emit real-time notification via Socket.IO
            if (global.io) {
                const populatedNotification = await Notification.findById(notification._id)
                    .populate('relatedUser', 'name email');
                global.io.emit('new_notification', populatedNotification);
                console.log('🔔 Real-time notification sent: new_user');
            }
        } catch (error) {
            console.error('Failed to send admin notification:', error);
        }

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
});


const loginUser = handleAsync(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
});

 
const getUserProfile = handleAsync(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            role: user.role,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

 
const updateUserProfile = handleAsync(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.phone = req.body.phone || user.phone;
        user.address = req.body.address || user.address;

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            address: updatedUser.address,
            role: updatedUser.role,
            token: generateToken(updatedUser._id),
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// Change password (requires current password verification)
const changePassword = handleAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user._id);

    if (user) {
        // Verify current password
        const isMatch = await user.matchPassword(currentPassword);
        
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            message: 'Password changed successfully',
            token: generateToken(user._id),
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

 
const getUsers = handleAsync(async (req, res) => {
    const users = await User.find().select('-password');
    res.json(users);
});

 
const deleteUser = handleAsync(async (req, res) => {
    // Validate ObjectId
    if (!validateObjectId(req.params.id)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting admin users
    if (user.role === 'admin') {
        return res.status(403).json({ message: 'Cannot delete admin users' });
    }

    // Blacklist all tokens for this user before deletion
    try {
        // Mark tokens as blacklisted with far future expiry
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 10);
        
        // Create a blacklist entry (won't have the actual token, but we'll check user existence)
        await BlacklistedToken.create({
            token: `user_deleted_${user._id}`,
            userId: user._id,
            reason: 'user_deleted',
            expiresAt: futureDate
        });
    } catch (error) {
        console.error('Error blacklisting tokens on user deletion:', error);
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
});
 
const getUserById = handleAsync(async (req, res) => {
    // Validate ObjectId
    if (!validateObjectId(req.params.id)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(req.params.id).select('-password');

    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// Update user by ID (Admin only)
const updateUser = handleAsync(async (req, res) => {
    // Validate ObjectId
    if (!validateObjectId(req.params.id)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is being deactivated
    const wasActive = user.isActive;
    
    // Update allowed fields
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.address = req.body.address || user.address;
    
    // Allow updating role and active status
    if (req.body.role !== undefined) {
        user.role = req.body.role;
    }
    if (req.body.isActive !== undefined) {
        user.isActive = req.body.isActive;
    }

    const updatedUser = await user.save();

    // If user is being deactivated, blacklist all their tokens
    if (wasActive && !updatedUser.isActive) {
        // Blacklist will happen automatically when they try to use the token
        // via the protect middleware
        console.log(`User ${updatedUser.email} deactivated - tokens will be blacklisted on next use`);
    }

    res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        role: updatedUser.role,
        isActive: updatedUser.isActive
    });
});

// Logout user
const logoutUser = handleAsync(async (req, res) => {
    const token = req.token; // Token stored by protect middleware

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Add token to blacklist
            await BlacklistedToken.create({
                token,
                userId: req.user._id,
                reason: 'logout',
                expiresAt: new Date(decoded.exp * 1000)
            });

            console.log(`Token blacklisted for user: ${req.user.email}`);
        } catch (error) {
            console.error('Error blacklisting token:', error);
        }
    }

    res.json({ message: 'Logged out successfully' });
});

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getUserProfile,
    updateUserProfile,
    changePassword,
    getUsers,
    deleteUser,
    getUserById,
    updateUser
};
