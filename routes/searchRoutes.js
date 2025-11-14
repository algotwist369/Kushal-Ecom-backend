const express = require('express');
const {
    searchProductsController,
    getSearchSuggestionsController,
    getFilterOptionsController,
    getTrendingProductsController,
    getRelatedProductsController
} = require('../controllers/searchController');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');

const router = express.Router();

router.get('/', cacheMiddleware(120), searchProductsController);
router.get('/suggestions', cacheMiddleware(300), getSearchSuggestionsController);
router.get('/filters', cacheMiddleware(600), getFilterOptionsController);
router.get('/trending', cacheMiddleware(300), getTrendingProductsController);
router.get('/related/:productId', cacheMiddleware(300), getRelatedProductsController);

module.exports = router;
