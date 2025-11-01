const Product = require('../models/Product');
const Category = require('../models/Category');

// Advanced search functionality
const searchProducts = async (searchParams) => {
    const {
        query,
        category,
        minPrice,
        maxPrice,
        rating,
        ingredients,
        benefits,
        formulation,
        ageGroup,
        gender,
        season,
        timeOfDay,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 12
    } = searchParams;

    // Build filter object
    let filter = { isActive: true };

    // Text search
    if (query) {
        filter.$or = [
            { name: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { 'ingredients.name': { $regex: query, $options: 'i' } },
            { 'benefits.name': { $regex: query, $options: 'i' } },
            { keywords: { $in: [new RegExp(query, 'i')] } },
            { manufacturer: { $regex: query, $options: 'i' } },
            { origin: { $regex: query, $options: 'i' } },
            { processingMethod: { $regex: query, $options: 'i' } },
            { potency: { $regex: query, $options: 'i' } },
            { formulation: { $regex: query, $options: 'i' } }
        ];
    }

    // Category filter
    if (category) {
        filter.category = category;
    }

    // Price range filter
    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Rating filter
    if (rating) {
        filter.averageRating = { $gte: Number(rating) };
    }

    // Ayurvedic-specific filters
    if (ingredients && ingredients.length > 0) {
        filter['ingredients.name'] = { $in: ingredients };
    }

    if (benefits && benefits.length > 0) {
        filter['benefits.name'] = { $in: benefits };
    }

    if (formulation) {
        filter.formulation = formulation;
    }

    if (ageGroup && ageGroup.length > 0) {
        filter.ageGroup = { $in: ageGroup };
    }

    if (gender && gender.length > 0) {
        filter.gender = { $in: gender };
    }

    if (season && season.length > 0) {
        filter.season = { $in: season };
    }

    if (timeOfDay && timeOfDay.length > 0) {
        filter.timeOfDay = { $in: timeOfDay };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [products, total] = await Promise.all([
        Product.find(filter)
            .populate('category', 'name slug')
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        Product.countDocuments(filter)
    ]);

    return {
        products,
        total,
        page,
        pages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
    };
};

// Get search suggestions
const getSearchSuggestions = async (query, limit = 10) => {
    if (!query || query.length < 2) return [];

    const suggestions = await Product.aggregate([
        {
            $match: {
                isActive: true,
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { 'ingredients.name': { $regex: query, $options: 'i' } },
                    { 'benefits.name': { $regex: query, $options: 'i' } },
                    { manufacturer: { $regex: query, $options: 'i' } },
                    { formulation: { $regex: query, $options: 'i' } }
                ]
            }
        },
        {
            $project: {
                name: 1,
                slug: 1,
                price: 1,
                images: { $slice: ['$images', 1] },
                category: 1
            }
        },
        { $limit: limit }
    ]);

    return suggestions;
};

// Get filter options for search
const getFilterOptions = async () => {
    const [
        categories,
        formulations,
        ageGroups,
        genders,
        seasons,
        timeOfDays,
        priceRange
    ] = await Promise.all([
        Category.find({ isActive: true }).select('name slug'),
        Product.distinct('formulation', { isActive: true }),
        Product.distinct('ageGroup', { isActive: true }),
        Product.distinct('gender', { isActive: true }),
        Product.distinct('season', { isActive: true }),
        Product.distinct('timeOfDay', { isActive: true }),
        Product.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: null,
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' }
                }
            }
        ])
    ]);

    return {
        categories,
        formulations,
        ageGroups,
        genders,
        seasons,
        timeOfDays,
        priceRange: priceRange[0] || { minPrice: 0, maxPrice: 0 }
    };
};

// Get trending products
const getTrendingProducts = async (limit = 8) => {
    return await Product.find({ isActive: true })
        .sort({ averageRating: -1, numReviews: -1 })
        .limit(limit)
        .populate('category', 'name slug')
        .select('name slug price images averageRating numReviews')
        .lean();
};

// Get related products
const getRelatedProducts = async (productId, limit = 4) => {
    const product = await Product.findById(productId).select('category ingredients benefits formulation ageGroup gender');
    if (!product) return [];

    const relatedProducts = await Product.find({
        _id: { $ne: productId },
        isActive: true,
        $or: [
            { category: product.category },
            { 'ingredients.name': { $in: product.ingredients.map(i => i.name) } },
            { 'benefits.name': { $in: product.benefits.map(b => b.name) } },
            { formulation: product.formulation },
            { ageGroup: { $in: product.ageGroup } },
            { gender: { $in: product.gender } }
        ]
    })
        .limit(limit)
        .populate('category', 'name slug')
        .select('name slug price images averageRating')
        .lean();

    return relatedProducts;
};

module.exports = {
    searchProducts,
    getSearchSuggestions,
    getFilterOptions,
    getTrendingProducts,
    getRelatedProducts
};
