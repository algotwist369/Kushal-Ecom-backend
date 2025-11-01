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
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/active', getActivePopUp);
router.post('/:id/click', trackPopUpClick); // Track clicks

// Admin routes - protected
router.route('/')
    .get(protect, admin, getAllPopUps)
    .post(protect, admin, createPopUp);

router.route('/:id')
    .get(protect, admin, getPopUpById)
    .put(protect, admin, updatePopUp)
    .delete(protect, admin, deletePopUp);

module.exports = router;

