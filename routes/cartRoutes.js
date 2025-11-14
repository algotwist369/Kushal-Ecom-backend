const express = require('express');
const {
    addToCart,
    getCart,
    removeFromCart,
    updateCartItemQuantity
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getCart);
router.post('/', protect, addToCart);
router.post('/add', protect, addToCart); // legacy alias
router.put('/:productId', protect, updateCartItemQuantity);
router.delete('/:productId', protect, removeFromCart);

module.exports = router;
