const express = require('express');
const router = express.Router();
const {
    searchProductsController,
    getSearchSuggestionsController,
    getFilterOptionsController,
    getTrendingProductsController,
    getRelatedProductsController
} = require('../controllers/searchController');

// Search products
router.get('/products', searchProductsController);

// Get search suggestions
router.get('/suggestions', getSearchSuggestionsController);

// Get filter options
router.get('/filters', getFilterOptionsController);

// Get trending products
router.get('/trending', getTrendingProductsController);

// Get related products
router.get('/related/:productId', getRelatedProductsController);

module.exports = router;
