const Coupon = require('../models/Coupon');
const { handleAsync } = require('../utils/handleAsync');

// @desc    Get all coupons (Admin)
// @route   GET /api/coupons
// @access  Private/Admin
const getAllCoupons = handleAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    
    // Filter by active status
    if (req.query.isActive !== undefined) {
        query.isActive = req.query.isActive === 'true';
    }

    const [coupons, total] = await Promise.all([
        Coupon.find(query)
            .populate('applicableProducts', 'name')
            .populate('applicableCategories', 'name')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Coupon.countDocuments(query)
    ]);

    res.json({
        coupons,
        total,
        page,
        pages: Math.ceil(total / limit)
    });
});

// @desc    Get single coupon (Admin)
// @route   GET /api/coupons/:id
// @access  Private/Admin
const getCouponById = handleAsync(async (req, res) => {
    const coupon = await Coupon.findById(req.params.id)
        .populate('applicableProducts', 'name')
        .populate('applicableCategories', 'name')
        .populate('createdBy', 'name email');

    if (!coupon) {
        return res.status(404).json({ message: 'Coupon not found' });
    }

    res.json(coupon);
});

// @desc    Create coupon (Admin)
// @route   POST /api/coupons
// @access  Private/Admin
const createCoupon = handleAsync(async (req, res) => {
    const {
        code,
        description,
        discountType,
        discountValue,
        minPurchaseAmount,
        maxDiscountAmount,
        validFrom,
        validUntil,
        usageLimit,
        perUserLimit,
        isActive,
        applicableProducts,
        applicableCategories
    } = req.body;

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
        return res.status(400).json({ message: 'Coupon code already exists' });
    }

    const coupon = new Coupon({
        code: code.toUpperCase(),
        description,
        discountType,
        discountValue,
        minPurchaseAmount,
        maxDiscountAmount,
        validFrom,
        validUntil,
        usageLimit,
        perUserLimit,
        isActive,
        applicableProducts,
        applicableCategories,
        createdBy: req.user._id
    });

    const savedCoupon = await coupon.save();
    res.status(201).json(savedCoupon);
});

// @desc    Update coupon (Admin)
// @route   PUT /api/coupons/:id
// @access  Private/Admin
const updateCoupon = handleAsync(async (req, res) => {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
        return res.status(404).json({ message: 'Coupon not found' });
    }

    const {
        code,
        description,
        discountType,
        discountValue,
        minPurchaseAmount,
        maxDiscountAmount,
        validFrom,
        validUntil,
        usageLimit,
        perUserLimit,
        isActive,
        applicableProducts,
        applicableCategories
    } = req.body;

    // Check if code is being changed and if new code already exists
    if (code && code.toUpperCase() !== coupon.code) {
        const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            return res.status(400).json({ message: 'Coupon code already exists' });
        }
        coupon.code = code.toUpperCase();
    }

    if (description !== undefined) coupon.description = description;
    if (discountType !== undefined) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (minPurchaseAmount !== undefined) coupon.minPurchaseAmount = minPurchaseAmount;
    if (maxDiscountAmount !== undefined) coupon.maxDiscountAmount = maxDiscountAmount;
    if (validFrom !== undefined) coupon.validFrom = validFrom;
    if (validUntil !== undefined) coupon.validUntil = validUntil;
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (perUserLimit !== undefined) coupon.perUserLimit = perUserLimit;
    if (isActive !== undefined) coupon.isActive = isActive;
    if (applicableProducts !== undefined) coupon.applicableProducts = applicableProducts;
    if (applicableCategories !== undefined) coupon.applicableCategories = applicableCategories;

    const updatedCoupon = await coupon.save();
    res.json(updatedCoupon);
});

// @desc    Delete coupon (Admin)
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
const deleteCoupon = handleAsync(async (req, res) => {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
        return res.status(404).json({ message: 'Coupon not found' });
    }

    await coupon.deleteOne();
    res.json({ message: 'Coupon deleted successfully' });
});

// @desc    Claim coupon by phone number (Public)
// @route   POST /api/coupons/claim
// @access  Public
const claimCoupon = handleAsync(async (req, res) => {
    const { phoneNumber, couponCode } = req.body;

    if (!phoneNumber || !couponCode) {
        return res.status(400).json({ message: 'Phone number and coupon code are required' });
    }

    // Validate phone number format (Indian format)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({ message: 'Invalid phone number format' });
    }

    // Check if this phone number has already claimed ANY coupon
    const existingClaim = await Coupon.findOne({
        'claimedBy.phoneNumber': phoneNumber
    });

    if (existingClaim) {
        return res.status(400).json({ 
            message: 'This phone number has already claimed a coupon' 
        });
    }

    // Find active coupon by code
    const coupon = await Coupon.findOne({ 
        code: couponCode.toUpperCase(),
        isActive: true
    })
    .populate('applicableProducts', 'name images price discountPrice')
    .populate('applicableCategories', 'name');

    if (!coupon) {
        return res.status(404).json({ message: 'Coupon not found or inactive' });
    }

    // Check if coupon is valid
    if (!coupon.isValid()) {
        return res.status(400).json({ message: 'Coupon has expired or reached usage limit' });
    }

    // Add new claim
    coupon.claimedBy.push({
        phoneNumber,
        claimedAt: new Date(),
        usedCount: 0
    });

    await coupon.save();

    res.json({
        message: 'Coupon claimed successfully!',
        coupon: {
            code: coupon.code,
            description: coupon.description,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            minPurchaseAmount: coupon.minPurchaseAmount,
            maxDiscountAmount: coupon.maxDiscountAmount,
            validUntil: coupon.validUntil,
            applicableProducts: coupon.applicableProducts,
            applicableCategories: coupon.applicableCategories
        }
    });
});

// @desc    Get active coupons for claiming (Public)
// @route   GET /api/coupons/active
// @access  Public
const getActiveCoupons = handleAsync(async (req, res) => {
    const now = new Date();
    
    const coupons = await Coupon.find({
        isActive: true,
        validFrom: { $lte: now },
        validUntil: { $gte: now },
        $or: [
            { usageLimit: null },
            { $expr: { $lt: ['$usageCount', '$usageLimit'] } }
        ]
    })
    .select('code description discountType discountValue minPurchaseAmount validUntil')
    .sort({ createdAt: -1 })
    .limit(10);

    res.json(coupons);
});

// @desc    Validate coupon for order (Used during checkout)
// @route   POST /api/coupons/validate
// @access  Private
const validateCoupon = handleAsync(async (req, res) => {
    const { couponCode, phoneNumber, orderAmount, productIds, categoryIds } = req.body;

    if (!couponCode) {
        return res.status(400).json({ message: 'Coupon code is required' });
    }

    const coupon = await Coupon.findOne({ 
        code: couponCode.toUpperCase(),
        isActive: true
    });

    if (!coupon) {
        return res.status(404).json({ message: 'Invalid coupon code' });
    }

    // Check if coupon is valid
    if (!coupon.isValid()) {
        return res.status(400).json({ message: 'Coupon has expired or reached usage limit' });
    }

    // Check if user can use this coupon
    if (phoneNumber && !coupon.canUserClaim(phoneNumber)) {
        return res.status(400).json({ 
            message: `You have already used this coupon the maximum number of times` 
        });
    }

    // Check minimum purchase amount
    if (orderAmount < coupon.minPurchaseAmount) {
        return res.status(400).json({ 
            message: `Minimum purchase amount of ₹${coupon.minPurchaseAmount} required` 
        });
    }

    // Check if coupon is applicable to products/categories
    if (coupon.applicableProducts.length > 0) {
        const hasApplicableProduct = productIds?.some(id => 
            coupon.applicableProducts.some(pId => pId.toString() === id.toString())
        );
        if (!hasApplicableProduct) {
            return res.status(400).json({ 
                message: 'Coupon not applicable to products in cart' 
            });
        }
    }

    if (coupon.applicableCategories.length > 0) {
        const hasApplicableCategory = categoryIds?.some(id => 
            coupon.applicableCategories.some(cId => cId.toString() === id.toString())
        );
        if (!hasApplicableCategory) {
            return res.status(400).json({ 
                message: 'Coupon not applicable to products in cart' 
            });
        }
    }

    // Calculate discount
    const discount = coupon.calculateDiscount(orderAmount);

    res.json({
        valid: true,
        coupon: {
            code: coupon.code,
            description: coupon.description,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue
        },
        discount,
        finalAmount: orderAmount - discount
    });
});

module.exports = {
    getAllCoupons,
    getCouponById,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    claimCoupon,
    getActiveCoupons,
    validateCoupon
};
