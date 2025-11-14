const express = require('express');
const {
    getAllProductsByFilter,
    getAllProductsAdmin,
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    addOrUpdateReview,
    deleteReview,
    getBestsellers,
    getNewArrivals
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');

const router = express.Router();

// Public product endpoints
router.get('/', cacheMiddleware(120), getProducts);
router.post('/filter', getAllProductsByFilter);
router.get('/bestsellers/list', cacheMiddleware(300), getBestsellers);
router.get('/new-arrivals', cacheMiddleware(300), getNewArrivals);
// Reviews (authenticated users)
router.post('/:id/review', protect, addOrUpdateReview);
router.delete('/:id/review/:reviewId', protect, deleteReview);

// Admin product management
router.get('/admin/all', protect, authorize('admin'), getAllProductsAdmin);
router.post('/', protect, authorize('admin'), createProduct);
router.put('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

// Fetch by id or slug (must be last to avoid conflicts)
router.get('/:id', getProductById);

module.exports = router;
