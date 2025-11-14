const express = require('express');
const {
    getAllPopUps,
    getActivePopUp,
    getPopUpById,
    createPopUp,
    updatePopUp,
    deletePopUp,
    trackPopUpClick
} = require('../controllers/popUpController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');

const router = express.Router();

router.get('/active', cacheMiddleware(120), getActivePopUp);
router.post('/:id/click', trackPopUpClick);

router.get('/', protect, authorize('admin'), getAllPopUps);
router.post('/', protect, authorize('admin'), createPopUp);
router.put('/:id', protect, authorize('admin'), updatePopUp);
router.delete('/:id', protect, authorize('admin'), deletePopUp);
router.get('/:id', protect, authorize('admin'), getPopUpById);

module.exports = router;
