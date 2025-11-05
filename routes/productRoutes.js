const express = require('express');
const {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    addOrUpdateReview,
    deleteReview,
    getAllProductsByFilter,
    getAllProductsAdmin,
    getBestsellers,
    getNewArrivals,
} = require('../controllers/productController.js');
const { protect, admin } = require('../middleware/authMiddleware.js');
const { validateProduct, validateProductUpdate, validateObjectId } = require('../middleware/validationMiddleware.js');

const router = express.Router();

// Public
router.get('/', getProducts);
router.get('/bestsellers/list', getBestsellers); // Must be before /:id to avoid conflict
router.get('/newarrivals/list', getNewArrivals); // Must be before /:id to avoid conflict
router.get('/:id', getProductById);
router.post('/filter', getAllProductsByFilter);

// Admin
router.get('/admin/all', protect, admin, getAllProductsAdmin);
router.post('/', protect, admin, validateProduct, createProduct);
router.put('/:id', protect, admin, validateObjectId, validateProductUpdate, updateProduct);
router.delete('/:id', protect, admin, validateObjectId, deleteProduct);

// Reviews (User)
router.post('/:id/review', protect, addOrUpdateReview);
router.delete('/:id/review/:reviewId', protect, deleteReview);

module.exports = router;
