const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { handleAsync } = require('../utils/handleAsync');
const { getCartProductPopulateConfig } = require('../utils/productPopulate');

const populateCartProducts = (cartDoc) => cartDoc.populate(getCartProductPopulateConfig());

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
    await populateCartProducts(cart);
    res.json(cart);
});

// Get Cart
const getCart = handleAsync(async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
        await populateCartProducts(cart);
    }
    res.json(cart || { items: [] });
});

// Remove Item
const parseIsPack = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['true', '1', 'yes', 'pack'].includes(normalized)) return true;
        if (['false', '0', 'no', 'single'].includes(normalized)) return false;
    }
    return undefined;
};

const removeFromCart = handleAsync(async (req, res) => {
    const { productId } = req.params;
    const { packSize, isPack } = { ...req.query, ...req.body };

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const normalizedPackSize = packSize !== undefined ? Number(packSize) : undefined;
    if (packSize !== undefined && Number.isNaN(normalizedPackSize)) {
        return res.status(400).json({ message: 'Invalid pack size' });
    }
    const parsedIsPack = parseIsPack(isPack);
    const wantsPack = parsedIsPack === true || normalizedPackSize !== undefined;

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(item => {
        const matchesProduct = item.product.toString() === productId;
        if (!matchesProduct) return true;

        if (wantsPack) {
            if (!item.isPack) return true;
            if (Number.isFinite(normalizedPackSize)) {
                return item.packInfo?.packSize !== normalizedPackSize;
            }
            return false;
        }

        return item.isPack;
    });

    if (cart.items.length === initialLength) {
        return res.status(404).json({ message: 'Item not found in cart' });
    }
    
    // Recalculate total price
    cart.totalPrice = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    await cart.save();
    await populateCartProducts(cart);
    res.json(cart);
});

// Clear Cart (after order)
const clearCart = handleAsync(async (userId) => {
    await Cart.findOneAndUpdate({ user: userId }, { items: [], totalPrice: 0 });
});

// Update cart item quantity
const updateCartItemQuantity = handleAsync(async (req, res) => {
    const { productId } = req.params;
    const { quantity, packSize, isPack } = req.body;
    
    if (quantity < 1) {
        return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const normalizedPackSize = packSize !== undefined ? Number(packSize) : undefined;
    if (packSize !== undefined && Number.isNaN(normalizedPackSize)) {
        return res.status(400).json({ message: 'Invalid pack size' });
    }
    const parsedIsPack = parseIsPack(isPack);
    const wantsPack = parsedIsPack === true || normalizedPackSize !== undefined;

    let itemIndex = cart.items.findIndex(item => {
        if (item.product.toString() !== productId) return false;

        if (wantsPack) {
            if (!item.isPack) return false;
            if (Number.isFinite(normalizedPackSize)) {
                return item.packInfo?.packSize === normalizedPackSize;
            }
            return true;
        }

        return !item.isPack;
    });

    if (itemIndex === -1) {
        itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    }

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
    await populateCartProducts(cart);
    res.json(cart);
});

module.exports = {
    addToCart: addUpdateToCart,
    getCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart
};
