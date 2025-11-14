const express = require('express');
const {
    submitContactForm,
    getAllContacts,
    getContactById,
    updateContact,
    deleteContact,
    getContactStats
} = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { rateLimit } = require('express-rate-limit');

const router = express.Router();

const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20
});

router.post('/submit', contactLimiter, submitContactForm);

router.get('/stats', protect, authorize('admin'), getContactStats);
router.get('/', protect, authorize('admin'), getAllContacts);
router.get('/:id', protect, authorize('admin'), getContactById);
router.put('/:id', protect, authorize('admin'), updateContact);
router.delete('/:id', protect, authorize('admin'), deleteContact);

module.exports = router;
