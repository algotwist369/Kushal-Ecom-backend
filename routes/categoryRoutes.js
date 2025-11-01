const express =  require('express');
const {
  createCategory,
  getCategories,
  getAllCategoriesAdmin,
  getCategoryById,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController.js');
const { protect, admin } =  require('../middleware/authMiddleware.js');

const router = express.Router();

// Public
router.get('/', getCategories);
router.get('/:id', getCategoryById);

// Admin
router.get('/admin/all', protect, admin, getAllCategoriesAdmin);
router.post('/', protect, admin, createCategory);
router.put('/:id', protect, admin, updateCategory);
router.delete('/:id', protect, admin, deleteCategory);

module.exports = router;