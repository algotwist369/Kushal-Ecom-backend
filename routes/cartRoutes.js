const express = require('express');
const {
    addToCart,
    getCart,
    removeFromCart,
    updateCartItemQuantity
} = require('../controllers/cartController.js');
const { protect } = require('../middleware/authMiddleware.js');

const router = express.Router();

router.post('/', protect, addToCart);
router.get('/', protect, getCart);
router.put('/:productId', protect, updateCartItemQuantity);
router.delete('/:productId', protect, removeFromCart);

module.exports = router;
