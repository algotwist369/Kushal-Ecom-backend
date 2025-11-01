const express = require('express');
const {
    submitContactForm,
    getAllContacts,
    getContactById,
    updateContact,
    deleteContact,
    getContactStats
} = require('../controllers/contactController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// Public route - submit contact form
router.post('/submit', submitContactForm);

// Admin routes - protected
router.get('/stats', protect, admin, getContactStats);
router.route('/')
    .get(protect, admin, getAllContacts);

router.route('/:id')
    .get(protect, admin, getContactById)
    .put(protect, admin, updateContact)
    .delete(protect, admin, deleteContact);

module.exports = router;

