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
} = require('../controllers/authController.js');
const { protect, admin } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Public
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', protect, logoutUser);

// Private
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/change-password', protect, changePassword);

// Admin
router.get('/', protect, admin, getUsers);
router.get('/:id', protect, admin, getUserById);
router.put('/:id', protect, admin, updateUser);
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;
