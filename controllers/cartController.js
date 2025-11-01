const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { handleAsync } = require('../utils/handleAsync');

// Add / Update Cart Item
const addUpdateToCart = handleAsync(async (req, res) => {
    const { productId, quantity, packInfo } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Check if product is in stock
    if (product.stock < quantity) {
        return res.status(400).json({ message: `Only ${product.stock} items available in stock` });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
        cart = new Cart({ user: req.user._id, items: [], totalPrice: 0 });
    }

    // Determine price based on pack or regular item
    let itemPrice;
    let isPack = false;
    let packData = null;

    if (packInfo && packInfo.packSize) {
        // It's a pack - calculate pack price based on actual product price and savings
        const baseProductPrice = product.discountPrice || product.price;
        const basePackPrice = baseProductPrice * packInfo.packSize;
        
        // Apply savings percentage if provided
        const finalPackPrice = packInfo.savingsPercent > 0 
            ? basePackPrice * (1 - packInfo.savingsPercent / 100)
            : packInfo.packPrice || basePackPrice;
        
        // Store per-item price for calculation
        itemPrice = finalPackPrice / packInfo.packSize;
        isPack = true;
        
        // Update packData with calculated price
        packData = {
            ...packInfo,
            packPrice: Math.round(finalPackPrice) // Store rounded final pack price
        };
    } else {
        // Regular item - use discount price if available, otherwise regular price
        itemPrice = product.discountPrice || product.price;
    }

    const itemIndex = cart.items.findIndex(item => 
        item.product.toString() === productId && 
        item.isPack === isPack &&
        (!isPack || item.packInfo?.packSize === packInfo?.packSize)
    );
    
    if (itemIndex > -1) {
        // Update existing item
        cart.items[itemIndex].quantity = quantity;
        cart.items[itemIndex].price = itemPrice;
        if (isPack) {
            cart.items[itemIndex].isPack = true;
            cart.items[itemIndex].packInfo = packData;
        }
    } else {
        // Add new item
        const newItem = { 
            product: productId, 
            quantity, 
            price: itemPrice,
            isPack,
            packInfo: isPack ? packData : undefined
        };
        cart.items.push(newItem);
    }

    // Calculate total price
    cart.totalPrice = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

    await cart.save();
    
    // Populate product details for response including all pack-related fields
    await cart.populate({
        path: 'items.product',
        select: 'name price discountPrice images stock slug category packOptions freeShipping shippingCost minOrderForFreeShipping freeProducts bundleWith offerText',
        populate: [
            {
                path: 'freeProducts.product',
                select: 'name images'
            },
            {
                path: 'bundleWith.product',
                select: 'name images'
            }
        ]
    });
    res.json(cart);
});

// Get Cart
const getCart = handleAsync(async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id }).populate({
        path: 'items.product',
        select: 'name price discountPrice images stock slug category packOptions freeShipping shippingCost minOrderForFreeShipping freeProducts bundleWith offerText',
        populate: [
            {
                path: 'freeProducts.product',
                select: 'name images'
            },
            {
                path: 'bundleWith.product',
                select: 'name images'
            }
        ]
    });
    res.json(cart || { items: [] });
});

// Remove Item
const removeFromCart = handleAsync(async (req, res) => {
    const { productId } = req.params;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(item => item.product.toString() !== productId);
    
    // Recalculate total price
    cart.totalPrice = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    await cart.save();
    await cart.populate({
        path: 'items.product',
        select: 'name price discountPrice images stock slug category packOptions freeShipping shippingCost minOrderForFreeShipping freeProducts bundleWith offerText',
        populate: [
            {
                path: 'freeProducts.product',
                select: 'name images'
            },
            {
                path: 'bundleWith.product',
                select: 'name images'
            }
        ]
    });
    res.json(cart);
});

// Clear Cart (after order)
const clearCart = handleAsync(async (userId) => {
    await Cart.findOneAndUpdate({ user: userId }, { items: [], totalPrice: 0 });
});

// Update cart item quantity
const updateCartItemQuantity = handleAsync(async (req, res) => {
    const { productId } = req.params;
    const { quantity } = req.body;
    
    if (quantity < 1) {
        return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    if (itemIndex === -1) {
        return res.status(404).json({ message: 'Item not found in cart' });
    }

    // Check stock
    const product = await Product.findById(productId);
    if (product.stock < quantity) {
        return res.status(400).json({ message: `Only ${product.stock} items available in stock` });
    }

    cart.items[itemIndex].quantity = quantity;
    
    // Recalculate total price
    cart.totalPrice = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    await cart.save();
    await cart.populate({
        path: 'items.product',
        select: 'name price discountPrice images stock slug category packOptions freeShipping shippingCost minOrderForFreeShipping freeProducts bundleWith offerText',
        populate: [
            {
                path: 'freeProducts.product',
                select: 'name images'
            },
            {
                path: 'bundleWith.product',
                select: 'name images'
            }
        ]
    });
    res.json(cart);
});

module.exports = {
    addToCart: addUpdateToCart,
    getCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart
};
