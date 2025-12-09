const express = require('express');
const {
    getHeroImages,
    getHeroImagesAdmin,
    createOrUpdateHeroImages,
    addHeroImages,
    deleteHeroImage,
    deleteAllHeroImages
} = require('../controllers/heroImageController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');

const router = express.Router();

// Public route - Get hero images for frontend
router.get('/', cacheMiddleware(300), getHeroImages);

// Admin routes
router.get('/admin', protect, authorize('admin'), getHeroImagesAdmin);
router.post('/', protect, authorize('admin'), createOrUpdateHeroImages);
router.post('/add', protect, authorize('admin'), addHeroImages);
router.delete('/:index', protect, authorize('admin'), deleteHeroImage);
router.delete('/', protect, authorize('admin'), deleteAllHeroImages);

module.exports = router;

