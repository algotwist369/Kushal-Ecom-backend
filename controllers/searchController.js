const { 
    searchProducts, 
    getSearchSuggestions, 
    getFilterOptions, 
    getTrendingProducts,
    getRelatedProducts 
} = require('../utils/searchUtils');
const { handleAsync } = require('../utils/handleAsync');

// Advanced product search
const searchProductsController = handleAsync(async (req, res) => {
    const searchParams = {
        query: req.query.q,
        category: req.query.category,
        minPrice: req.query.minPrice,
        maxPrice: req.query.maxPrice,
        rating: req.query.rating,
        ingredients: req.query.ingredients ? req.query.ingredients.split(',') : undefined,
        benefits: req.query.benefits ? req.query.benefits.split(',') : undefined,
        formulation: req.query.formulation,
        ageGroup: req.query.ageGroup ? req.query.ageGroup.split(',') : undefined,
        gender: req.query.gender ? req.query.gender.split(',') : undefined,
        season: req.query.season ? req.query.season.split(',') : undefined,
        timeOfDay: req.query.timeOfDay ? req.query.timeOfDay.split(',') : undefined,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc',
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 12
    };

    const results = await searchProducts(searchParams);
    res.json(results);
});

// Get search suggestions
const getSearchSuggestionsController = handleAsync(async (req, res) => {
    const { q } = req.query;
    const suggestions = await getSearchSuggestions(q);
    res.json({ suggestions });
});

// Get filter options
const getFilterOptionsController = handleAsync(async (req, res) => {
    const options = await getFilterOptions();
    res.json(options);
});

// Get trending products
const getTrendingProductsController = handleAsync(async (req, res) => {
    const { limit = 8 } = req.query;
    const products = await getTrendingProducts(parseInt(limit));
    res.json({ products });
});

// Get related products
const getRelatedProductsController = handleAsync(async (req, res) => {
    const { productId } = req.params;
    const { limit = 4 } = req.query;
    const products = await getRelatedProducts(productId, parseInt(limit));
    res.json({ products });
});

module.exports = {
    searchProductsController,
    getSearchSuggestionsController,
    getFilterOptionsController,
    getTrendingProductsController,
    getRelatedProductsController
};
