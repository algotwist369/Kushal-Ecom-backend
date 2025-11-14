const express = require('express');
const {
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
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public auth routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Authenticated routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/change-password', protect, changePassword);
router.post('/logout', protect, logoutUser);

// Admin routes
router.get('/', protect, authorize('admin'), getUsers);
router.get('/:id', protect, authorize('admin'), getUserById);
router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
