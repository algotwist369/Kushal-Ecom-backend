const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const { handleAsync } = require('../utils/handleAsync');

// Get dashboard analytics (Admin only)
const getDashboardAnalytics = handleAsync(async (req, res) => {
    const [
        totalUsers,
        totalProducts,
        totalOrders,
        totalCategories,
        recentOrders,
        topProducts,
        salesData,
        userGrowth
    ] = await Promise.all([
        User.countDocuments(),
        Product.countDocuments(),
        Order.countDocuments(),
        Category.countDocuments(),
        Order.find()
            .populate('user', 'name email')
            .populate('items.product', 'name')
            .sort({ createdAt: -1 })
            .limit(5),
        Product.aggregate([
            { $match: { isActive: true } },
            { $sort: { averageRating: -1, numReviews: -1 } },
            { $limit: 5 },
            { $project: { name: 1, price: 1, averageRating: 1, numReviews: 1 } }
        ]),
        Order.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    totalSales: { $sum: '$finalAmount' },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            { $limit: 12 }
        ]),
        User.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    userCount: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            { $limit: 12 }
        ])
    ]);

    // Calculate total revenue
    const totalRevenue = await Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$finalAmount' } } }
    ]);

    res.json({
        overview: {
            totalUsers,
            totalProducts,
            totalOrders,
            totalCategories,
            totalRevenue: totalRevenue[0]?.total || 0
        },
        recentOrders,
        topProducts,
        salesData,
        userGrowth
    });
});

// Get product analytics
const getProductAnalytics = handleAsync(async (req, res) => {
    const [
        productStats,
        categoryStats,
        lowStockProducts,
        topRatedProducts
    ] = await Promise.all([
        Product.aggregate([
            {
                $group: {
                    _id: null,
                    totalProducts: { $sum: 1 },
                    activeProducts: { $sum: { $cond: ['$isActive', 1, 0] } },
                    averagePrice: { $avg: '$price' },
                    totalStock: { $sum: '$stock' }
                }
            }
        ]),
        Product.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: '$category',
                    productCount: { $sum: 1 },
                    averagePrice: { $avg: '$price' }
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            { $unwind: '$category' },
            { $project: { categoryName: '$category.name', productCount: 1, averagePrice: 1 } }
        ]),
        Product.find({ stock: { $lte: 10 }, isActive: true })
            .select('name stock price')
            .limit(10),
        Product.find({ isActive: true })
            .sort({ averageRating: -1 })
            .limit(10)
            .select('name averageRating numReviews price')
    ]);

    res.json({
        productStats: productStats[0] || {},
        categoryStats,
        lowStockProducts,
        topRatedProducts
    });
});

// Get sales analytics
const getSalesAnalytics = handleAsync(async (req, res) => {
    const { period = '30d' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
        case '7d':
            dateFilter = { createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
            break;
        case '30d':
            dateFilter = { createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
            break;
        case '90d':
            dateFilter = { createdAt: { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) } };
            break;
        case '1y':
            dateFilter = { createdAt: { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) } };
            break;
    }

    const [
        salesData,
        orderStatusData,
        paymentMethodData,
        topSellingProducts
    ] = await Promise.all([
        Order.aggregate([
            { $match: { ...dateFilter, paymentStatus: 'paid' } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    totalSales: { $sum: '$finalAmount' },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]),
        Order.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$orderStatus',
                    count: { $sum: 1 }
                }
            }
        ]),
        Order.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$paymentMethod',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$finalAmount' }
                }
            }
        ]),
        Order.aggregate([
            { $match: { ...dateFilter, paymentStatus: 'paid' } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    totalQuantity: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 },
            { $project: { productName: '$product.name', totalQuantity: 1, totalRevenue: 1 } }
        ])
    ]);

    res.json({
        salesData,
        orderStatusData,
        paymentMethodData,
        topSellingProducts
    });
});

module.exports = {
    getDashboardAnalytics,
    getProductAnalytics,
    getSalesAnalytics
};
