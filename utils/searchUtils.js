const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');

const buildSearchFilter = (params = {}) => {
    const filter = { isActive: true };

    if (params.query) {
        const safeQuery = params.query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.$or = [
            { name: { $regex: safeQuery, $options: 'i' } },
            { description: { $regex: safeQuery, $options: 'i' } },
            { ingredients: { $regex: safeQuery, $options: 'i' } },
            { benefits: { $regex: safeQuery, $options: 'i' } }
        ];
    }

    if (params.category && mongoose.Types.ObjectId.isValid(params.category)) {
        filter.category = params.category;
    }

    if (params.minPrice || params.maxPrice) {
        filter.price = {};
        if (params.minPrice) filter.price.$gte = Number(params.minPrice);
        if (params.maxPrice) filter.price.$lte = Number(params.maxPrice);
    }

    if (params.rating) {
        filter.averageRating = { $gte: Number(params.rating) };
    }

    const multiValueFilters = [
        { key: 'ingredients', field: 'ingredients' },
        { key: 'benefits', field: 'benefits' },
        { key: 'formulation', field: 'formulation' },
        { key: 'ageGroup', field: 'ageGroup' },
        { key: 'gender', field: 'gender' },
        { key: 'season', field: 'season' },
        { key: 'timeOfDay', field: 'timeOfDay' }
    ];

    multiValueFilters.forEach(({ key, field }) => {
        if (params[key] && params[key].length) {
            filter[field] = { $in: params[key] };
        }
    });

    return filter;
};

const buildSort = (sortBy = 'createdAt', sortOrder = 'desc') => {
    const direction = sortOrder === 'asc' ? 1 : -1;

    switch (sortBy) {
        case 'price':
            return { price: direction };
        case 'rating':
            return { averageRating: direction, numReviews: direction };
        case 'stock':
            return { stock: direction };
        default:
            return { createdAt: direction };
    }
};

const searchProducts = async (params = {}) => {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(48, params.limit || 12);
    const skip = (page - 1) * limit;

    const filter = buildSearchFilter(params);
    const sort = buildSort(params.sortBy, params.sortOrder);

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
        limit
    };
};

const getSearchSuggestions = async (query) => {
    if (!query) {
        return [];
    }

    const safeQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const [productNames, categoryNames] = await Promise.all([
        Product.find(
            { name: { $regex: safeQuery, $options: 'i' }, isActive: true },
            { name: 1, slug: 1 }
        )
            .limit(5)
            .lean(),
        Category.find({ name: { $regex: safeQuery, $options: 'i' }, isActive: true }, { name: 1, slug: 1 })
            .limit(5)
            .lean()
    ]);

    return [
        ...productNames.map((product) => ({
            type: 'product',
            label: product.name,
            value: product.slug || product._id
        })),
        ...categoryNames.map((category) => ({
            type: 'category',
            label: category.name,
            value: category.slug || category._id
        }))
    ];
};

const getFilterOptions = async () => {
    const [categories, priceRange, attributes] = await Promise.all([
        Category.find({ isActive: true }).sort({ name: 1 }).lean(),
        Product.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: null,
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' }
                }
            }
        ]),
        Product.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: null,
                    ingredients: { $addToSet: '$ingredients' },
                    benefits: { $addToSet: '$benefits' },
                    formulation: { $addToSet: '$formulation' },
                    ageGroup: { $addToSet: '$ageGroup' },
                    gender: { $addToSet: '$gender' }
                }
            }
        ])
    ]);

    const priceStats = priceRange[0] || { minPrice: 0, maxPrice: 0 };
    const attributeStats = attributes[0] || {};

    const normalize = (value) => {
        if (!value) return [];
        if (Array.isArray(value)) {
            return [...new Set(value.flat().filter(Boolean))];
        }
        return [value];
    };

    return {
        categories: categories.map((category) => ({
            id: category._id,
            name: category.name,
            slug: category.slug
        })),
        price: {
            min: priceStats.minPrice || 0,
            max: priceStats.maxPrice || 0
        },
        attributes: {
            ingredients: normalize(attributeStats.ingredients),
            benefits: normalize(attributeStats.benefits),
            formulation: normalize(attributeStats.formulation),
            ageGroup: normalize(attributeStats.ageGroup),
            gender: normalize(attributeStats.gender)
        }
    };
};

const getTrendingProducts = async (limit = 8) => {
    const [topSold, topReviewed] = await Promise.all([
        Order.aggregate([
            { $match: { paymentStatus: 'paid' } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    totalSold: { $sum: '$items.quantity' }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: limit }
        ]),
        Product.find({ isActive: true })
            .sort({ numReviews: -1, averageRating: -1 })
            .limit(limit)
            .select('_id')
            .lean()
    ]);

    const trendingIds = new Set();
    topSold.forEach((item) => trendingIds.add(item._id?.toString()));
    topReviewed.forEach((item) => trendingIds.add(item._id?.toString()));

    const ids = Array.from(trendingIds)
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

    return Product.find({ _id: { $in: ids }, isActive: true })
        .populate('category', 'name slug')
        .lean();
};

const getRelatedProducts = async (productId, limit = 4) => {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return [];
    }

    const product = await Product.findById(productId).lean();
    if (!product) {
        return [];
    }

    return Product.find({
        _id: { $ne: product._id },
        category: product.category,
        isActive: true
    })
        .sort({ averageRating: -1, numReviews: -1 })
        .limit(limit)
        .populate('category', 'name slug')
        .lean();
};

module.exports = {
    searchProducts,
    getSearchSuggestions,
    getFilterOptions,
    getTrendingProducts,
    getRelatedProducts
};

