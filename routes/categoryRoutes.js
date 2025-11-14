const express = require('express');
const {
    createCategory,
    getCategories,
    getAllCategoriesAdmin,
    getCategoryById,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');

const router = express.Router();

// Admin
router.get('/admin/all', protect, authorize('admin'), getAllCategoriesAdmin);
router.post('/', protect, authorize('admin'), createCategory);
router.put('/:id', protect, authorize('admin'), updateCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

// Public
router.get('/', cacheMiddleware(600), getCategories);
router.get('/:id', cacheMiddleware(600), getCategoryById);

module.exports = router;
