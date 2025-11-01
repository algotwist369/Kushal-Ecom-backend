const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// User registration validation
const validateUserRegistration = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    body('phone')
        .optional()
        .isMobilePhone('en-IN')
        .withMessage('Please provide a valid Indian mobile number'),
    handleValidationErrors
];

// User login validation
const validateUserLogin = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    handleValidationErrors
];

// Product validation
const validateProduct = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Product name must be between 2 and 100 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters'),
    body('price')
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    body('stock')
        .isInt({ min: 0 })
        .withMessage('Stock must be a non-negative integer'),
    body('category')
        .isMongoId()
        .withMessage('Please provide a valid category ID'),
    handleValidationErrors
];

// Category validation
const validateCategory = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Category name must be between 2 and 50 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must not exceed 500 characters'),
    handleValidationErrors
];

// Order validation
const validateOrder = [
    body('items')
        .isArray({ min: 1 })
        .withMessage('Order must contain at least one item'),
    body('items.*.product')
        .isMongoId()
        .withMessage('Please provide valid product IDs'),
    body('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be at least 1'),
    body('shippingAddress')
        .isObject()
        .withMessage('Shipping address is required'),
    body('shippingAddress.fullName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Full name must be between 2 and 50 characters'),
    body('shippingAddress.phone')
        .isMobilePhone('en-IN')
        .withMessage('Please provide a valid Indian mobile number'),
    body('shippingAddress.pincode')
        .isPostalCode('IN')
        .withMessage('Please provide a valid Indian pincode'),
    handleValidationErrors
];

// MongoDB ObjectId validation
const validateObjectId = [
    param('id')
        .isMongoId()
        .withMessage('Please provide a valid ID'),
    handleValidationErrors
];

// Pagination validation
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    validateUserRegistration,
    validateUserLogin,
    validateProduct,
    validateCategory,
    validateOrder,
    validateObjectId,
    validatePagination
};
