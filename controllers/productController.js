const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { handleAsync } = require('../utils/handleAsync');
const validateObjectId = require('../utils/validateObjectId');
const sendEmail = require('../utils/sendEmail');

const uploadsRoot = path.resolve(__dirname, '..');

const resolveLocalUploadPath = (imageUrl) => {
    if (!imageUrl || typeof imageUrl !== 'string') return null;

    const withoutHost = imageUrl.replace(/^https?:\/\/[^\/]+/, '');
    if (!withoutHost) return null;

    const relativePath = withoutHost.replace(/^\/+/, '');
    if (!relativePath) return null;

    const normalizedRelativePath = path.normalize(relativePath);
    if (normalizedRelativePath.startsWith('..') || path.isAbsolute(normalizedRelativePath)) {
        return null;
    }

    const absolutePath = path.resolve(uploadsRoot, normalizedRelativePath);
    const relativeToRoot = path.relative(uploadsRoot, absolutePath);
    if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
        return null;
    }

    return absolutePath;
};

const deleteLocalFileIfExists = (imageUrl) => {
    const filePath = resolveLocalUploadPath(imageUrl);
    if (!filePath) return;

    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('🗑️ Deleted review image:', filePath);
        } else {
            console.log('⚠️ Image file not found:', filePath);
        }
    } catch (error) {
        console.error('❌ Error deleting image:', imageUrl, error.message);
    }
};

const getAllProductsByFilter = handleAsync(async (req, res) => {
    let {
        page = 1,
        limit = 12,
        categories,
        minPrice,
        maxPrice,
        priceBuckets, // e.g., [{min:0,max:500},{min:500,max:1000}]
        rating,
        attributes,
        search,
        sortBy
    } = req.body;

    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;

    let filter = { isActive: true };

    // ----------------
    // Multiple categories filter - support both category and categories fields
    // ----------------
    if (categories && Array.isArray(categories) && categories.length > 0) {
        // Filter by either the old category field or new categories array
        filter.$or = [
            { category: { $in: categories } },
            { categories: { $in: categories } }
        ];
        // If $or already exists from price buckets, wrap in $and
        if (filter.$or && filter.$and) {
            const existingOr = filter.$or;
            filter.$or = undefined;
            filter.$and.push({ $or: existingOr });
        }
    }

    // ----------------
    // Price filter / price buckets
    // ----------------
    if (priceBuckets && Array.isArray(priceBuckets) && priceBuckets.length > 0) {
        const bucketConditions = priceBuckets.map(b => ({
            price: { $gte: b.min, $lte: b.max }
        }));
        filter.$or = bucketConditions;
    } else if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // ----------------
    // Rating filter
    // ----------------
    if (rating) filter.averageRating = { $gte: Number(rating) };

    // ----------------
    // Attributes filter
    // ----------------
    if (attributes && typeof attributes === 'object') {
        Object.keys(attributes).forEach(attrKey => {
            filter[`attributes.${attrKey}`] = { $in: attributes[attrKey] };
        });
    }

    // ----------------
    // Text search (using regex for broader compatibility)
    // ----------------
    if (search && search.trim() !== '') {
        const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        // Don't override $or if it already exists from price buckets
        if (filter.$or) {
            // If $or already exists, wrap both conditions in $and
            const existingOr = filter.$or;
            delete filter.$or;
            filter.$and = [
                { $or: existingOr },
                { $or: [{ name: searchRegex }, { description: searchRegex }] }
            ];
        } else {
            filter.$or = [
                { name: searchRegex },
                { description: searchRegex }
            ];
        }
    }

    // ----------------
    // Sorting
    // ----------------
    let sort = {};
    switch (sortBy) {
        case 'priceAsc':
            sort.price = 1;
            break;
        case 'priceDesc':
            sort.price = -1;
            break;
        case 'rating':
            sort.averageRating = -1;
            break;
        case 'newest':
            sort.createdAt = -1;
            break;
        default:
            sort.createdAt = -1;
    }

    // ----------------
    // Query
    // ----------------
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('category', 'name')
        .populate('categories', 'name');

    // ----------------
    // Chunking / batch data
    // ----------------
    const chunkSize = 4; // rows for frontend UI
    const chunks = [];
    for (let i = 0; i < products.length; i += chunkSize) {
        chunks.push(products.slice(i, i + chunkSize));
    }

    res.json({
        total,
        page,
        pages: Math.ceil(total / limit),
        chunkSize,
        chunks,
        products  
    });
});

const createProduct = handleAsync(async (req, res) => {
    // Extract all fields except slug (slug is auto-generated from name)
    const { slug, ...productData } = req.body;

    const {
        name, description, price, discountPrice, stock, category, categories, images, attributes, isActive,
        // Ayurvedic-specific fields
        ingredients, benefits, dosage, contraindications, shelfLife, storageInstructions,
        manufacturer, batchNumber, expiryDate, certification, origin, processingMethod,
        potency, formulation, ageGroup, gender, season, timeOfDay, faq, howToUse,
        howToStore, howToConsume, metaTitle, metaDescription, keywords,
        // Pack & Combo Options
        packOptions, freeProducts, bundleWith, offerText, isOnOffer,
        // Shipping Options
        freeShipping, shippingCost, minOrderForFreeShipping
    } = productData;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'Product name is required' });
    }

    if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
        return res.status(400).json({ message: 'Valid product price is required' });
    }

    // Validate categories - support both single category (backward compatibility) and categories array
    let validatedCategories = [];
    const Category = require('../models/Category');
    
    // Handle categories array (new way)
    if (categories && Array.isArray(categories) && categories.length > 0) {
        // Remove duplicates and empty values
        const uniqueCategories = [...new Set(categories.filter(cat => cat && cat.trim() !== ''))];
        
        // Validate each category ID
        for (const catId of uniqueCategories) {
            if (!validateObjectId(catId)) {
                return res.status(400).json({ message: `Invalid category ID: ${catId}` });
            }
            const categoryExists = await Category.findById(catId);
            if (!categoryExists) {
                return res.status(400).json({ message: `Category not found: ${catId}` });
            }
        }
        validatedCategories = uniqueCategories;
    }
    // Handle single category (backward compatibility)
    else if (category) {
        if (!validateObjectId(category)) {
            return res.status(400).json({ message: 'Invalid category ID' });
        }
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return res.status(400).json({ message: 'Category not found' });
        }
        validatedCategories = [category];
    }
    
    // At least one category is required
    if (validatedCategories.length === 0) {
        return res.status(400).json({ message: 'At least one category is required' });
    }

    // Validate discountPrice if provided
    if (discountPrice !== undefined && discountPrice !== null) {
        const discountPriceNum = Number(discountPrice);
        if (isNaN(discountPriceNum) || discountPriceNum < 0) {
            return res.status(400).json({ message: 'Invalid discount price' });
        }
        if (discountPriceNum >= Number(price)) {
            return res.status(400).json({ message: 'Discount price must be less than regular price' });
        }
    }

    // Validate stock if provided
    if (stock !== undefined && stock !== null) {
        const stockNum = Number(stock);
        if (isNaN(stockNum) || stockNum < 0) {
            return res.status(400).json({ message: 'Invalid stock quantity' });
        }
    }

    const product = new Product({
        name,
        description,
        price,
        discountPrice,
        stock,
        category: validatedCategories[0], // Keep single category for backward compatibility
        categories: validatedCategories, // New multiple categories array
        images,
        attributes,
        isActive,
        // Ayurvedic-specific fields
        ingredients,
        benefits,
        dosage,
        contraindications,
        shelfLife,
        storageInstructions,
        manufacturer,
        batchNumber,
        expiryDate,
        certification,
        origin,
        processingMethod,
        potency,
        formulation,
        ageGroup,
        gender,
        season,
        timeOfDay,
        faq,
        howToUse,
        howToStore,
        howToConsume,
        metaTitle,
        metaDescription,
        keywords,
        // Pack & Combo Options
        packOptions,
        freeProducts,
        bundleWith,
        offerText,
        isOnOffer,
        // Shipping Options
        freeShipping,
        shippingCost,
        minOrderForFreeShipping
    });

    const createdProduct = await product.save();
    console.log('✅ Product created successfully:', createdProduct._id, createdProduct.name);

    // Emit real-time product creation event via Socket.IO
    if (global.io) {
        const populatedProduct = await Product.findById(createdProduct._id)
            .populate('category', 'name')
            .populate('categories', 'name');
        global.io.emit('product_created', populatedProduct);
        console.log('🔔 Real-time product creation event sent:', createdProduct._id);
    }

    // Send email notification to all registered users
    try {
        const users = await User.find({ isActive: true });
        const productUrl = `${process.env.FRONTEND_URL}/products/${createdProduct._id}`;

        const emailSubject = `New Product Alert: ${createdProduct.name} 🌿`;
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #059669;">New Ayurvedic Product Available! 🌿</h2>
                <p>Dear Customer,</p>
                <p>We're excited to introduce our latest addition:</p>
                
                <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #059669; margin-top: 0;">${createdProduct.name}</h3>
                    <p style="color: #374151;">${createdProduct.description?.substring(0, 150) || 'Check out this amazing new product'}...</p>
                    <p style="font-size: 24px; font-weight: bold; color: #059669;">₹${createdProduct.price}</p>
                    ${createdProduct.discountPrice ? `<p style="text-decoration: line-through; color: #9ca3af;">₹${createdProduct.discountPrice}</p>` : ''}
                </div>
                
                <p><a href="${productUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Product</a></p>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                    Thank you for choosing our Prolific Healing Herbs!<br>
                    Best regards,<br>
                    Prolific Healing Herbs Team
                </p>
            </div>
        `;

        // Send emails to all users (async, don't wait)
        users.forEach(user => {
            sendEmail(user.email, emailSubject, emailHtml).catch(err => {
                console.error(`Failed to send email to ${user.email}:`, err.message);
            });
        });

        // Create notification in database
        const notification = await Notification.create({
            type: 'new_product',
            title: 'New Product Added',
            message: `${createdProduct.name} is now available`,
            relatedProduct: createdProduct._id,
            metadata: {
                productName: createdProduct.name,
                productPrice: createdProduct.price,
                emailsSent: users.length
            }
        });

        // Emit real-time notification via Socket.IO
        if (global.io) {
            const populatedNotification = await Notification.findById(notification._id)
                .populate('relatedProduct', 'name price images');
            global.io.emit('new_notification', populatedNotification);
            console.log('🔔 Real-time notification sent: new_product');
        }

        console.log(`✅ New product notification sent to ${users.length} users`);
    } catch (error) {
        console.error('Failed to send product notification:', error);
        // Don't fail the product creation if email fails
    }

    res.status(201).json(createdProduct);
});

const getProducts = handleAsync(async (req, res) => {
    let { page, limit, category, minPrice, maxPrice, sortBy } = req.query;

    page = Number(page) || 1;
    limit = Number(limit) || 10;
    const skip = (page - 1) * limit;

    let filter = { isActive: true };
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    let sort = {};
    if (sortBy === 'priceAsc') sort.price = 1;
    else if (sortBy === 'priceDesc') sort.price = -1;
    else if (sortBy === 'rating') sort.averageRating = -1;
    else sort.createdAt = -1;

    const products = await Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('category', 'name')
        .populate('categories', 'name');

    const count = await Product.countDocuments(filter);

    res.json({ products, total: count, page, pages: Math.ceil(count / limit) });
});

// Admin: Get all products with advanced filters
const getAllProductsAdmin = handleAsync(async (req, res) => {
    let { page, limit, category, minPrice, maxPrice, sortBy, search, status, stock } = req.query;

    // Validate and sanitize pagination parameters
    page = Number(page) || 1;
    limit = Number(limit) || 10;
    
    // Ensure page and limit are positive integers
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;
    // Cap limit to prevent excessive data retrieval
    if (limit > 100) limit = 100;
    
    const skip = (page - 1) * limit;

    let filter = {};

    // Category filter with validation - support both category and categories fields
    if (category) {
        if (validateObjectId(category)) {
            filter.$or = [
                { category: category },
                { categories: category }
            ];
        } else {
            return res.status(400).json({ message: 'Invalid category ID' });
        }
    }

    // Price filter with validation
    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) {
            const minPriceNum = Number(minPrice);
            if (isNaN(minPriceNum) || minPriceNum < 0) {
                return res.status(400).json({ message: 'Invalid minPrice parameter' });
            }
            filter.price.$gte = minPriceNum;
        }
        if (maxPrice) {
            const maxPriceNum = Number(maxPrice);
            if (isNaN(maxPriceNum) || maxPriceNum < 0) {
                return res.status(400).json({ message: 'Invalid maxPrice parameter' });
            }
            filter.price.$lte = maxPriceNum;
        }
        // Validate that minPrice <= maxPrice if both are provided
        if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
            return res.status(400).json({ message: 'minPrice cannot be greater than maxPrice' });
        }
    }

    // Status filter (active/inactive)
    if (status === 'active') filter.isActive = true;
    else if (status === 'inactive') filter.isActive = false;
    // If status is 'all' or undefined, don't filter by isActive

    // Stock filter
    if (stock === 'instock') filter.stock = { $gt: 0 };
    else if (stock === 'outofstock') filter.stock = 0;

    // Search filter with regex escaping for security
    if (search && search.trim() !== '') {
        // Escape special regex characters to prevent regex injection
        const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.$or = [
            { name: { $regex: escapedSearch, $options: 'i' } },
            { description: { $regex: escapedSearch, $options: 'i' } }
        ];
    }

    // Sorting with validation
    let sort = {};
    const validSortOptions = ['name', 'nameDesc', 'priceAsc', 'priceDesc', 'stock', 'stockDesc', 'rating', 'oldest', 'newest'];
    const sortOption = sortBy && validSortOptions.includes(sortBy) ? sortBy : 'newest';
    
    switch (sortOption) {
        case 'name':
            sort.name = 1;
            break;
        case 'nameDesc':
            sort.name = -1;
            break;
        case 'priceAsc':
            sort.price = 1;
            break;
        case 'priceDesc':
            sort.price = -1;
            break;
        case 'stock':
            sort.stock = 1;
            break;
        case 'stockDesc':
            sort.stock = -1;
            break;
        case 'rating':
            sort.averageRating = -1;
            break;
        case 'oldest':
            sort.createdAt = 1;
            break;
        case 'newest':
        default:
            sort.createdAt = -1;
    }

    const products = await Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('category', 'name')
        .populate('categories', 'name');

    const count = await Product.countDocuments(filter);

    res.json({
        products,
        total: count,
        page,
        pages: Math.ceil(count / limit),
        limit
    });
});

const getProductById = handleAsync(async (req, res) => {
    const { id } = req.params;
    let product;

    // Check if it's a slug or ObjectId
    if (validateObjectId(id)) {
        product = await Product.findById(id)
            .populate('category', 'name')
            .populate('categories', 'name')
            .populate('reviews.user', 'name email');
    } else {
        // Treat as slug
        product = await Product.findOne({ slug: id })
            .populate('category', 'name')
            .populate('categories', 'name')
            .populate('reviews.user', 'name email');
    }

    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    // Add rating statistics
    const productData = product.toObject();
    productData.ratingStats = product.getRatingStats();

    // Log reviews with images for debugging
    console.log('📦 Sending product with reviews:', productData.reviews.map(r => ({
        user: r.user?.name,
        hasImages: !!r.images,
        imageCount: r.images?.length || 0,
        images: r.images
    })));

    res.json(productData);
});

const updateProduct = handleAsync(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    // Validate request body exists
    if (!req.body || typeof req.body !== 'object') {
        console.error('❌ Update product error: req.body is missing or invalid', {
            bodyType: typeof req.body,
            body: req.body,
            headers: req.headers,
            method: req.method
        });
        return res.status(400).json({ 
            message: 'Request body is required and must be an object',
            received: req.body ? 'Body exists but invalid type' : 'Body is missing'
        });
    }

    // Extract all fields except slug (slug is auto-generated from name)
    // Use safe destructuring with default empty object
    const { slug, ...updateData } = req.body || {};

    // Validate name if provided
    if (updateData.name !== undefined) {
        if (!updateData.name || typeof updateData.name !== 'string' || updateData.name.trim() === '') {
            return res.status(400).json({ message: 'Product name cannot be empty' });
        }
    }

    // Validate price if provided
    if (updateData.price !== undefined && updateData.price !== null) {
        const priceNum = Number(updateData.price);
        if (isNaN(priceNum) || priceNum < 0) {
            return res.status(400).json({ message: 'Invalid product price' });
        }
    }

    // Validate discountPrice if provided
    if (updateData.discountPrice !== undefined && updateData.discountPrice !== null) {
        const discountPriceNum = Number(updateData.discountPrice);
        if (isNaN(discountPriceNum) || discountPriceNum < 0) {
            return res.status(400).json({ message: 'Invalid discount price' });
        }
        
        // Determine the current price (updated or existing)
        let currentPrice;
        if (updateData.price !== undefined && updateData.price !== null) {
            currentPrice = Number(updateData.price);
            // Validate the new price first
            if (isNaN(currentPrice) || currentPrice < 0) {
                return res.status(400).json({ message: 'Invalid product price' });
            }
        } else {
            currentPrice = product.price || 0;
        }
        
        // Price must be greater than 0 to have a discount
        if (currentPrice <= 0) {
            return res.status(400).json({ message: 'Product price must be greater than 0 before setting discount price' });
        }
        
        // Discount price must be less than regular price
        if (discountPriceNum >= currentPrice) {
            return res.status(400).json({ message: 'Discount price must be less than regular price' });
        }
    }

    // Validate and prepare categories - support both single category (backward compatibility) and categories array
    let validatedCategories = undefined;
    const Category = require('../models/Category');
    
    // Handle categories array (new way) - takes precedence over single category
    if (updateData.categories !== undefined) {
        if (Array.isArray(updateData.categories)) {
            // If empty array, preserve existing categories (don't require at least one)
            if (updateData.categories.length === 0) {
                // Keep existing categories - don't update
                validatedCategories = undefined;
            } else {
                // Remove duplicates and empty values - handle both strings and ObjectIds
                const uniqueCategories = [...new Set(updateData.categories.filter(cat => {
                    if (!cat) return false;
                    // Handle both string and ObjectId types
                    if (typeof cat === 'string') {
                        return cat.trim() !== '';
                    }
                    // ObjectId or other types
                    return true;
                }))];
                
                if (uniqueCategories.length === 0) {
                    return res.status(400).json({ message: 'At least one valid category is required' });
                }
                
                // Validate each category ID
                for (const catId of uniqueCategories) {
                    // Convert to string for validation if needed
                    const catIdStr = catId.toString ? catId.toString() : catId;
                    if (!validateObjectId(catIdStr)) {
                        return res.status(400).json({ message: `Invalid category ID: ${catIdStr}` });
                    }
                    const categoryExists = await Category.findById(catIdStr);
                    if (!categoryExists) {
                        return res.status(400).json({ message: `Category not found: ${catIdStr}` });
                    }
                }
                validatedCategories = uniqueCategories;
            }
        } else {
            return res.status(400).json({ message: 'Categories must be an array' });
        }
    }
    // Handle single category (backward compatibility) - only if categories not provided
    else if (updateData.category !== undefined) {
        // If category is explicitly set to empty string or null, don't update it (keep existing)
        if (updateData.category === '' || updateData.category === null) {
            // Don't update categories - keep existing value
            validatedCategories = undefined;
        } else {
            // Validate category ID
            if (!validateObjectId(updateData.category)) {
                return res.status(400).json({ message: 'Invalid category ID' });
            }
            const categoryExists = await Category.findById(updateData.category);
            if (!categoryExists) {
                return res.status(400).json({ message: 'Category not found' });
            }
            // Convert single category to array for consistency
            validatedCategories = [updateData.category];
        }
    }

    // Validate stock if provided
    if (updateData.stock !== undefined && updateData.stock !== null) {
        const stockNum = Number(updateData.stock);
        if (isNaN(stockNum) || stockNum < 0) {
            return res.status(400).json({ message: 'Invalid stock quantity' });
        }
    }

    const {
        name, description, price, discountPrice, stock, category, categories, images, attributes, isActive,
        // Ayurvedic-specific fields
        ingredients, benefits, dosage, contraindications, shelfLife, storageInstructions,
        manufacturer, batchNumber, expiryDate, certification, origin, processingMethod,
        potency, formulation, ageGroup, gender, season, timeOfDay, faq, howToUse,
        howToStore, howToConsume, metaTitle, metaDescription, keywords,
        // Pack & Combo Options
        packOptions, freeProducts, bundleWith, offerText, isOnOffer,
        // Shipping Options
        freeShipping, shippingCost, minOrderForFreeShipping
    } = updateData;

    // Basic fields - Use !== undefined to allow falsy values like 0, false, empty string
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (discountPrice !== undefined) product.discountPrice = discountPrice;
    if (stock !== undefined) product.stock = stock;
    // Handle categories - update both category (backward compatibility) and categories array
    if (validatedCategories !== undefined) {
        product.categories = validatedCategories;
        product.category = validatedCategories[0]; // Set first category as primary for backward compatibility
    }
    if (images !== undefined) product.images = images;
    if (attributes !== undefined) product.attributes = attributes;
    if (isActive !== undefined) product.isActive = isActive;

    // Ayurvedic-specific fields
    if (ingredients !== undefined) product.ingredients = ingredients;
    if (benefits !== undefined) product.benefits = benefits;
    if (dosage !== undefined) product.dosage = dosage;
    if (contraindications !== undefined) product.contraindications = contraindications;
    if (shelfLife !== undefined) product.shelfLife = shelfLife;
    if (storageInstructions !== undefined) product.storageInstructions = storageInstructions;
    if (manufacturer !== undefined) product.manufacturer = manufacturer;
    if (batchNumber !== undefined) product.batchNumber = batchNumber;
    if (expiryDate !== undefined) product.expiryDate = expiryDate;
    if (certification !== undefined) product.certification = certification;
    if (origin !== undefined) product.origin = origin;
    if (processingMethod !== undefined) product.processingMethod = processingMethod;
    if (potency !== undefined) product.potency = potency;
    if (formulation !== undefined) product.formulation = formulation;
    if (ageGroup !== undefined) product.ageGroup = ageGroup;
    if (gender !== undefined) product.gender = gender;
    if (season !== undefined) product.season = season;
    if (timeOfDay !== undefined) product.timeOfDay = timeOfDay;
    if (faq !== undefined) product.faq = faq;
    if (howToUse !== undefined) product.howToUse = howToUse;
    if (howToStore !== undefined) product.howToStore = howToStore;
    if (howToConsume !== undefined) product.howToConsume = howToConsume;
    if (metaTitle !== undefined) product.metaTitle = metaTitle;
    if (metaDescription !== undefined) product.metaDescription = metaDescription;
    if (keywords !== undefined) product.keywords = keywords;

    // Pack & Combo Options with validation
    if (packOptions !== undefined) {
        if (Array.isArray(packOptions)) {
            // Validate each pack option - both packSize and packPrice are required together
            for (let i = 0; i < packOptions.length; i++) {
                const pack = packOptions[i];
                if (!pack || typeof pack !== 'object') {
                    return res.status(400).json({ message: `Invalid pack option at index ${i}` });
                }
                
                // Both packSize and packPrice must be provided together
                const hasPackSize = pack.packSize !== undefined && pack.packSize !== null && pack.packSize !== '';
                const hasPackPrice = pack.packPrice !== undefined && pack.packPrice !== null && pack.packPrice !== '';
                
                if (hasPackSize || hasPackPrice) {
                    // If one is provided, both must be provided
                    if (!hasPackSize || !hasPackPrice) {
                        return res.status(400).json({ message: `Pack option at index ${i}: Both packSize and packPrice are required together` });
                    }
                    
                    // Validate packSize
                    const packSizeNum = Number(pack.packSize);
                    if (isNaN(packSizeNum) || packSizeNum < 1) {
                        return res.status(400).json({ message: `Invalid pack size at index ${i}: must be a positive number` });
                    }
                    
                    // Validate packPrice
                    const packPriceNum = Number(pack.packPrice);
                    if (isNaN(packPriceNum) || packPriceNum < 0) {
                        return res.status(400).json({ message: `Invalid pack price at index ${i}: must be a non-negative number` });
                    }
                }
            }
            product.packOptions = packOptions;
        } else {
            return res.status(400).json({ message: 'packOptions must be an array' });
        }
    }
    if (freeProducts !== undefined) {
        if (Array.isArray(freeProducts)) {
            // Validate each free product and check product existence
            for (let i = 0; i < freeProducts.length; i++) {
                const free = freeProducts[i];
                if (!free || typeof free !== 'object') {
                    return res.status(400).json({ message: `Invalid free product at index ${i}` });
                }
                
                if (!free.product) {
                    return res.status(400).json({ message: `Product ID is required in free products at index ${i}` });
                }
                
                // Validate product ID format
                const productIdStr = free.product.toString ? free.product.toString() : free.product;
                if (!validateObjectId(productIdStr)) {
                    return res.status(400).json({ message: `Invalid product ID in free products at index ${i}` });
                }
                
                // Check if product exists
                const productExists = await Product.findById(productIdStr);
                if (!productExists) {
                    return res.status(400).json({ message: `Product not found in free products at index ${i}: ${productIdStr}` });
                }
                
                // Validate minQuantity
                if (free.minQuantity !== undefined && free.minQuantity !== null && free.minQuantity !== '') {
                    const minQtyNum = Number(free.minQuantity);
                    if (isNaN(minQtyNum) || minQtyNum < 1) {
                        return res.status(400).json({ message: `Invalid min quantity in free products at index ${i}: must be a positive number` });
                    }
                }
                
                // Validate quantity
                if (free.quantity !== undefined && free.quantity !== null && free.quantity !== '') {
                    const qtyNum = Number(free.quantity);
                    if (isNaN(qtyNum) || qtyNum < 1) {
                        return res.status(400).json({ message: `Invalid quantity in free products at index ${i}: must be a positive number` });
                    }
                }
            }
            product.freeProducts = freeProducts;
        } else {
            return res.status(400).json({ message: 'freeProducts must be an array' });
        }
    }
    if (bundleWith !== undefined) {
        if (Array.isArray(bundleWith)) {
            // Validate each bundle and check product existence
            for (let i = 0; i < bundleWith.length; i++) {
                const bundle = bundleWith[i];
                if (!bundle || typeof bundle !== 'object') {
                    return res.status(400).json({ message: `Invalid bundle at index ${i}` });
                }
                
                if (!bundle.product) {
                    return res.status(400).json({ message: `Product ID is required in bundle with at index ${i}` });
                }
                
                // Validate product ID format
                const productIdStr = bundle.product.toString ? bundle.product.toString() : bundle.product;
                if (!validateObjectId(productIdStr)) {
                    return res.status(400).json({ message: `Invalid product ID in bundle with at index ${i}` });
                }
                
                // Check if product exists
                const productExists = await Product.findById(productIdStr);
                if (!productExists) {
                    return res.status(400).json({ message: `Product not found in bundle with at index ${i}: ${productIdStr}` });
                }
                
                // Validate bundlePrice
                if (bundle.bundlePrice !== undefined && bundle.bundlePrice !== null && bundle.bundlePrice !== '') {
                    const bundlePriceNum = Number(bundle.bundlePrice);
                    if (isNaN(bundlePriceNum) || bundlePriceNum < 0) {
                        return res.status(400).json({ message: `Invalid bundle price at index ${i}: must be a non-negative number` });
                    }
                }
            }
            product.bundleWith = bundleWith;
        } else {
            return res.status(400).json({ message: 'bundleWith must be an array' });
        }
    }
    if (offerText !== undefined) product.offerText = offerText;
    if (isOnOffer !== undefined) product.isOnOffer = isOnOffer;

    // Shipping Options with validation
    if (freeShipping !== undefined) product.freeShipping = freeShipping;
    if (shippingCost !== undefined && shippingCost !== null) {
        const shippingCostNum = Number(shippingCost);
        if (isNaN(shippingCostNum) || shippingCostNum < 0) {
            return res.status(400).json({ message: 'Invalid shipping cost' });
        }
        product.shippingCost = shippingCostNum;
    }
    if (minOrderForFreeShipping !== undefined && minOrderForFreeShipping !== null) {
        const minOrderNum = Number(minOrderForFreeShipping);
        if (isNaN(minOrderNum) || minOrderNum < 0) {
            return res.status(400).json({ message: 'Invalid minimum order for free shipping' });
        }
        product.minOrderForFreeShipping = minOrderNum;
    }

    // Handle image cleanup if images are being updated
    if (updateData.images !== undefined && Array.isArray(updateData.images)) {
        // Find images that were removed
        const oldImages = Array.isArray(product.images) ? product.images : [];
        const newImages = updateData.images.filter(img => img && typeof img === 'string' && img.trim() !== '');
        const removedImages = oldImages.filter(img => img && !newImages.includes(img));
        
        // Delete removed images (async, don't block update)
        if (removedImages.length > 0) {
            removedImages.forEach(imageUrl => {
                if (imageUrl && typeof imageUrl === 'string') {
                    try {
                        deleteLocalFileIfExists(imageUrl);
                    } catch (fileError) {
                        console.error('Error deleting image file:', imageUrl, fileError);
                        // Continue with update even if file deletion fails
                    }
                }
            });
        }
    }

    // Validate images array if provided
    if (updateData.images !== undefined && !Array.isArray(updateData.images)) {
        return res.status(400).json({ message: 'Images must be an array' });
    }

    const updatedProduct = await product.save();
    
    // Reload product to ensure we have the latest data from database
    const reloadedProduct = await Product.findById(updatedProduct._id);
    
    // Populate categories for response
    await reloadedProduct.populate('category', 'name');
    await reloadedProduct.populate('categories', 'name');
    
    console.log('✅ Product updated successfully:', reloadedProduct._id, reloadedProduct.name);
    
    // Emit real-time product update event via Socket.IO
    if (global.io) {
        global.io.emit('product_updated', reloadedProduct);
        console.log('🔔 Real-time product update event sent:', reloadedProduct._id);
    }
    
    res.json(reloadedProduct);
});

const deleteProduct = handleAsync(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    // Check if product is in any orders (optional: you might want to prevent deletion if product has orders)
    const ordersWithProduct = await Order.countDocuments({
        'items.product': req.params.id,
        orderStatus: { $nin: ['cancelled', 'refunded'] }
    });

    if (ordersWithProduct > 0) {
        // Option 1: Prevent deletion (recommended for production)
        return res.status(400).json({ 
            message: `Cannot delete product. It is associated with ${ordersWithProduct} active order(s). Consider marking it as inactive instead.`
        });
        
        // Option 2: Allow deletion but log warning (uncomment if you want to allow)
        // console.warn(`⚠️ Deleting product ${product.name} that is in ${ordersWithProduct} order(s)`);
    }

    // Delete associated images/files
    try {
        // Delete product images
        if (product.images && Array.isArray(product.images)) {
            product.images.forEach(imageUrl => {
                if (imageUrl) deleteLocalFileIfExists(imageUrl);
            });
        }

        // Delete pack option images
        if (product.packOptions && Array.isArray(product.packOptions)) {
            product.packOptions.forEach(pack => {
                if (pack.image) deleteLocalFileIfExists(pack.image);
            });
        }

        // Delete images from ingredients, benefits, etc.
        const imageFields = ['ingredients', 'benefits', 'contraindications', 'certification', 'howToUse', 'howToStore', 'howToConsume'];
        imageFields.forEach(field => {
            if (product[field] && Array.isArray(product[field])) {
                product[field].forEach(item => {
                    if (item && item.image) deleteLocalFileIfExists(item.image);
                });
            }
        });

        console.log('🗑️ Deleted associated files for product:', product.name);
    } catch (fileError) {
        console.error('❌ Error deleting product files:', fileError);
        // Continue with deletion even if file deletion fails
    }

    // Delete the product
    await Product.findByIdAndDelete(req.params.id);
    
    console.log('✅ Product deleted successfully:', product.name);
    
    // Emit real-time product deletion event via Socket.IO
    if (global.io) {
        global.io.emit('product_deleted', { productId: req.params.id, productName: product.name });
        console.log('🔔 Real-time product deletion event sent:', req.params.id);
    }
    
    res.json({ message: 'Product removed successfully' });
});

const addOrUpdateReview = handleAsync(async (req, res) => {
    const { rating, comment, images } = req.body;

    console.log('📝 Review submission received:', { rating, comment, images });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const existingReview = product.reviews.find(r => r.user.toString() === req.user._id.toString());

    let reviewImages = [];
    if (Array.isArray(images)) {
        reviewImages = images;
    } else if (typeof images === 'string') {
        const trimmedImages = images.trim();
        if (trimmedImages) {
            try {
                const parsedImages = JSON.parse(trimmedImages);
                if (!Array.isArray(parsedImages)) {
                    return res.status(400).json({ message: 'Images payload must be an array' });
                }
                reviewImages = parsedImages;
            } catch (error) {
                console.error('❌ Invalid review images payload:', error.message);
                return res.status(400).json({ message: 'Invalid images payload' });
            }
        }
    } else if (images !== undefined && images !== null) {
        return res.status(400).json({ message: 'Images payload must be an array' });
    }

    console.log('🖼️ Parsed review images:', reviewImages);

    if (existingReview) {
        // Delete old images that are not in the new images array
        const oldImages = existingReview.images || [];
        const imagesToDelete = oldImages.filter(img => !reviewImages.includes(img));

        if (imagesToDelete.length > 0) {
            imagesToDelete.forEach(deleteLocalFileIfExists);
            console.log(`✅ Deleted ${imagesToDelete.length} old image(s) during review update`);
        }

        existingReview.rating = rating;
        existingReview.comment = comment;
        existingReview.images = reviewImages;
        console.log('✏️ Updated existing review with images:', existingReview.images);
    } else {
        product.reviews.push({
            user: req.user._id,
            rating,
            comment,
            images: reviewImages
        });
        console.log('➕ Added new review with images');
    }

    // Update average rating (this already saves the product)
    await product.updateRating();

    console.log('✅ Review saved. Total reviews:', product.reviews.length);
    console.log('🔍 Last review images:', product.reviews[product.reviews.length - 1].images);

    // Fetch the updated product with populated fields to return
    const updatedProduct = await Product.findById(product._id)
        .populate('category', 'name')
        .populate('categories', 'name')
        .populate('reviews.user', 'name email');

    // Add rating statistics
    const productData = updatedProduct.toObject();
    productData.ratingStats = updatedProduct.getRatingStats();

    res.status(201).json({
        message: 'Review submitted',
        product: productData
    });
});

const deleteReview = handleAsync(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const reviewIndex = product.reviews.findIndex(r => r._id.toString() === req.params.reviewId);
    if (reviewIndex === -1) return res.status(404).json({ message: 'Review not found' });

    const review = product.reviews[reviewIndex];

    // Only admin or review owner can delete
    if (req.user.role !== 'admin' && review.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to delete review' });
    }

    // Delete associated images from server
    if (review.images && review.images.length > 0) {
        review.images.forEach(deleteLocalFileIfExists);
        console.log(`✅ Deleted ${review.images.length} image(s) for review ${req.params.reviewId}`);
    }

    // Remove the review using splice
    product.reviews.splice(reviewIndex, 1);

    // Update rating
    await product.updateRating();

    res.json({ message: 'Review removed' });
});

// Get bestseller products based on order data
const getBestsellers = handleAsync(async (req, res) => {
    const { limit = 8 } = req.query;
    const limitNum = parseInt(limit);

    try {
        // Check if Order collection exists and has data
        const orderCount = await Order.countDocuments();

        // If no orders, fallback to popular products immediately
        if (orderCount === 0) {
            const fallbackProducts = await Product.find({ isActive: true })
                .populate('category', 'name')
                .populate('categories', 'name')
                .select('-reviews')
                .sort({ averageRating: -1, numReviews: -1, createdAt: -1 })
                .limit(limitNum)
                .lean();

            return res.json({
                success: true,
                count: fallbackProducts.length,
                products: fallbackProducts,
                fallback: true,
                reason: 'no_orders'
            });
        }

        // Aggregate orders with timeout protection
        const bestsellers = await Order.aggregate([
            // Only include completed orders (delivered)
            {
                $match: {
                    orderStatus: { $in: ['delivered', 'shipped', 'processing'] },
                    paymentStatus: 'paid'
                }
            },
            // Unwind items array to get individual products
            { $unwind: '$items' },
            // Group by product and sum quantities
            {
                $group: {
                    _id: '$items.product',
                    totalSold: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
                }
            },
            // Sort by total sold (descending)
            { $sort: { totalSold: -1 } },
            // Limit results
            { $limit: limitNum }
        ]).maxTimeMS(5000); // 5 second timeout

        if (!bestsellers || bestsellers.length === 0) {
            // No bestsellers found, use fallback
            const fallbackProducts = await Product.find({ isActive: true })
                .populate('category', 'name')
                .populate('categories', 'name')
                .select('-reviews')
                .sort({ averageRating: -1, numReviews: -1, createdAt: -1 })
                .limit(limitNum)
                .lean();

            return res.json({
                success: true,
                count: fallbackProducts.length,
                products: fallbackProducts,
                fallback: true,
                reason: 'no_bestsellers'
            });
        }

        // Get product IDs
        const productIds = bestsellers.map(item => item._id);

        // Fetch full product details
        const products = await Product.find({
            _id: { $in: productIds },
            isActive: true
        })
            .populate('category', 'name')
            .populate('categories', 'name')
            .select('-reviews')
            .lean();

        // Create a map for easy lookup
        const productMap = {};
        products.forEach(product => {
            productMap[product._id.toString()] = product;
        });

        // Combine sales data with product details and maintain sort order
        const result = bestsellers
            .map(item => {
                const product = productMap[item._id.toString()];
                if (product) {
                    return {
                        ...product,
                        totalSold: item.totalSold,
                        totalRevenue: item.totalRevenue
                    };
                }
                return null;
            })
            .filter(item => item !== null);

        res.json({
            success: true,
            count: result.length,
            products: result
        });
    } catch (error) {
        console.error('Error fetching bestsellers:', error);

        // Fallback: return products sorted by rating if aggregation fails
        const fallbackProducts = await Product.find({ isActive: true })
            .populate('category', 'name')
            .select('-reviews')
            .sort({ averageRating: -1, numReviews: -1, createdAt: -1 })
            .limit(limitNum)
            .lean();

        res.json({
            success: true,
            count: fallbackProducts.length,
            products: fallbackProducts,
            fallback: true,
            reason: 'error'
        });
    }
});

// Get new arrival products (recently added)
const getNewArrivals = handleAsync(async (req, res) => {
    const { limit = 8 } = req.query;
    const limitNum = parseInt(limit);

    try {
        // Get recently added products (last 30 days or newest products)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const newArrivals = await Product.find({
            isActive: true,
            createdAt: { $gte: thirtyDaysAgo }
        })
            .populate('category', 'name')
            .populate('categories', 'name')
            .select('-reviews')
            .sort({ createdAt: -1 })
            .limit(limitNum)
            .lean();

        // If less than limit found in last 30 days, get newest products overall
        if (newArrivals.length < limitNum) {
            const additionalProducts = await Product.find({
                isActive: true,
                _id: { $nin: newArrivals.map(p => p._id) }
            })
                .populate('category', 'name')
                .populate('categories', 'name')
                .select('-reviews')
                .sort({ createdAt: -1 })
                .limit(limitNum - newArrivals.length)
                .lean();

            newArrivals.push(...additionalProducts);
        }

        res.json({
            success: true,
            count: newArrivals.length,
            products: newArrivals
        });
    } catch (error) {
        console.error('Error fetching new arrivals:', error);

        // Fallback: return newest products
        const fallbackProducts = await Product.find({ isActive: true })
            .populate('category', 'name')
            .select('-reviews')
            .sort({ createdAt: -1 })
            .limit(limitNum)
            .lean();

        res.json({
            success: true,
            count: fallbackProducts.length,
            products: fallbackProducts,
            fallback: true
        });
    }
});

module.exports = {
    getAllProductsByFilter,
    getAllProductsAdmin,
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    addOrUpdateReview,
    deleteReview,
    getBestsellers,
    getNewArrivals,
};
