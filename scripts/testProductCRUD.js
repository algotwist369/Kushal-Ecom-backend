require('colors');
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');

// Connect to database
connectDB();

// Test configuration
let testProductId = '';
let testCategoryId = '';

// Test data
const testProduct = {
    name: 'Test Product - CRUD Validation',
    description: 'This is a test product created to validate CRUD operations. Contains all required fields and data types.',
    price: 999,
    discountPrice: 799,
    stock: 50,
    images: [
        'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500',
        'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=500'
    ],
    attributes: {
        weight: '500mg',
        quantity: '60 capsules',
        form: 'Vegetarian Capsule'
    },
    isActive: true,
    ingredients: [
        {
            image: 'https://images.unsplash.com/photo-1606787842090-a2f0c43a8b18?w=300',
            name: 'Test Ingredient 1',
            description: 'Primary active ingredient for testing'
        },
        {
            image: '',
            name: 'Test Ingredient 2',
            description: 'Secondary ingredient'
        }
    ],
    benefits: [
        {
            image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300',
            name: 'Test Benefit 1',
            description: 'Primary benefit description'
        }
    ],
    dosage: '1-2 capsules twice daily with water',
    contraindications: [
        {
            image: '',
            name: 'Pregnancy',
            description: 'Not recommended during pregnancy'
        }
    ],
    shelfLife: '24 months from manufacture date',
    storageInstructions: 'Store in cool, dry place away from sunlight',
    manufacturer: 'Test Manufacturer',
    batchNumber: 'TEST-2024-001',
    expiryDate: '2026-12-31',
    certification: [
        {
            image: '',
            name: 'FSSAI Certified',
            description: 'Food Safety certified'
        }
    ],
    origin: 'India',
    processingMethod: 'Standardized extraction',
    potency: '500mg per capsule',
    formulation: 'Vegetarian capsule',
    ageGroup: ['adult', 'senior'],
    gender: ['male', 'female'],
    season: ['all'],
    timeOfDay: ['morning', 'evening'],
    faq: [
        {
            question: 'How to use this product?',
            answer: 'Take 1-2 capsules twice daily with water after meals.'
        },
        {
            question: 'Is this safe?',
            answer: 'Yes, this product is safe when used as directed.'
        }
    ],
    howToUse: [
        {
            image: '',
            name: 'Dosage',
            description: 'Take 1-2 capsules twice daily'
        }
    ],
    howToStore: [
        {
            image: '',
            name: 'Storage',
            description: 'Store in original container'
        }
    ],
    howToConsume: [
        {
            image: '',
            name: 'With Water',
            description: 'Take with a full glass of water'
        }
    ],
    metaTitle: 'Test Product - CRUD Validation | Prolific Healing',
    metaDescription: 'Test product for validating CRUD operations with all fields',
    keywords: ['test', 'crud', 'validation', 'product'],
    packOptions: [
        {
            packSize: 1,
            packPrice: 799,
            savingsPercent: 20,
            label: 'Single Pack',
            image: ''
        },
        {
            packSize: 2,
            packPrice: 1498,
            savingsPercent: 25,
            label: 'Buy 2 Save More',
            image: ''
        }
    ],
    freeProducts: [],
    bundleWith: [],
    offerText: 'Test Offer - Buy 2 Get 10% Extra',
    isOnOffer: true,
    freeShipping: true,
    shippingCost: 0,
    minOrderForFreeShipping: 0
};


// Test CREATE operation
const testCreate = async () => {
    console.log('\n📝 Testing CREATE Operation...'.cyan);
    try {
        // Get or create category
        let category = await Category.findOne();
        if (!category) {
            category = await Category.create({
                name: 'Test Category',
                description: 'Category for testing',
                isActive: true
            });
            testCategoryId = category._id.toString();
            console.log('✅ Created test category'.green);
        } else {
            testCategoryId = category._id.toString();
        }

        // Add category to test product
        const productData = {
            ...testProduct,
            category: testCategoryId
        };

        // Create product directly via model (since we don't have API token)
        const product = new Product(productData);
        const createdProduct = await product.save();
        testProductId = createdProduct._id.toString();

        console.log('✅ Product created successfully!'.green);
        console.log(`   Product ID: ${testProductId}`.white);
        console.log(`   Product Name: ${createdProduct.name}`.white);
        console.log(`   Price: ₹${createdProduct.price}`.white);
        console.log(`   Stock: ${createdProduct.stock}`.white);
        console.log(`   Category: ${testCategoryId}`.white);
        
        // Verify data structure
        console.log('\n📊 Verifying data structure...'.cyan);
        console.log(`   Ingredients count: ${createdProduct.ingredients?.length || 0}`.white);
        console.log(`   Benefits count: ${createdProduct.benefits?.length || 0}`.white);
        console.log(`   Gender type: ${Array.isArray(createdProduct.gender) ? 'Array' : typeof createdProduct.gender}`.white);
        console.log(`   Dosage type: ${typeof createdProduct.dosage}`.white);
        console.log(`   MetaTitle type: ${typeof createdProduct.metaTitle}`.white);
        console.log(`   Pack Options: ${createdProduct.packOptions?.length || 0}`.white);
        
        return true;
    } catch (error) {
        console.error('❌ CREATE failed:'.red, error.message);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`   ${key}: ${error.errors[key].message}`.red);
            });
        }
        return false;
    }
};

// Test READ operations
const testRead = async () => {
    console.log('\n📖 Testing READ Operations...'.cyan);
    try {
        // Read by ID
        const product = await Product.findById(testProductId).populate('category');
        if (!product) {
            console.error('❌ Product not found!'.red);
            return false;
        }

        console.log('✅ Product found by ID!'.green);
        console.log(`   Name: ${product.name}`.white);
        console.log(`   Price: ₹${product.price}`.white);
        console.log(`   Category: ${product.category?.name || 'N/A'}`.white);
        console.log(`   Is Active: ${product.isActive}`.white);
        console.log(`   Created: ${product.createdAt}`.white);

        // Read all products
        const allProducts = await Product.find({}).limit(5);
        console.log(`\n✅ Found ${allProducts.length} products in database`.green);
        
        // Read with filters
        const activeProducts = await Product.find({ isActive: true }).countDocuments();
        console.log(`   Active products: ${activeProducts}`.white);

        return true;
    } catch (error) {
        console.error('❌ READ failed:'.red, error.message);
        return false;
    }
};

// Test UPDATE operation
const testUpdate = async () => {
    console.log('\n✏️  Testing UPDATE Operation...'.cyan);
    try {
        const updateData = {
            name: 'Test Product - CRUD Validation (UPDATED)',
            price: 1199,
            discountPrice: 999,
            stock: 75,
            description: 'This product has been updated to test UPDATE operation.',
            offerText: 'Updated Offer - Buy 3 Get 15% Extra',
            ingredients: [
                {
                    image: 'https://images.unsplash.com/photo-1606787842090-a2f0c43a8b18?w=300',
                    name: 'Updated Ingredient 1',
                    description: 'Updated ingredient description'
                },
                {
                    image: '',
                    name: 'New Ingredient 2',
                    description: 'Newly added ingredient'
                }
            ],
            gender: ['unisex'],
            dosage: '2 capsules twice daily (updated dosage)'
        };

        const updatedProduct = await Product.findByIdAndUpdate(
            testProductId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            console.error('❌ Product not found for update!'.red);
            return false;
        }

        console.log('✅ Product updated successfully!'.green);
        console.log(`   New Name: ${updatedProduct.name}`.white);
        console.log(`   New Price: ₹${updatedProduct.price}`.white);
        console.log(`   New Stock: ${updatedProduct.stock}`.white);
        console.log(`   Updated Ingredients: ${updatedProduct.ingredients?.length || 0}`.white);
        console.log(`   Updated Gender: ${JSON.stringify(updatedProduct.gender)}`.white);
        console.log(`   Updated Dosage: ${updatedProduct.dosage}`.white);

        return true;
    } catch (error) {
        console.error('❌ UPDATE failed:'.red, error.message);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`   ${key}: ${error.errors[key].message}`.red);
            });
        }
        return false;
    }
};

// Test DELETE operation
const testDelete = async () => {
    console.log('\n🗑️  Testing DELETE Operation...'.cyan);
    try {
        const deletedProduct = await Product.findByIdAndDelete(testProductId);
        
        if (!deletedProduct) {
            console.error('❌ Product not found for deletion!'.red);
            return false;
        }

        console.log('✅ Product deleted successfully!'.green);
        console.log(`   Deleted Product: ${deletedProduct.name}`.white);

        // Verify deletion
        const verify = await Product.findById(testProductId);
        if (verify) {
            console.error('❌ Product still exists after deletion!'.red);
            return false;
        }

        console.log('✅ Deletion verified - product no longer exists'.green);
        return true;
    } catch (error) {
        console.error('❌ DELETE failed:'.red, error.message);
        return false;
    }
};

// Test data validation
const testValidation = async () => {
    console.log('\n🔍 Testing Data Validation...'.cyan);
    try {
        // Test invalid price
        try {
            const invalidProduct = new Product({
                name: 'Invalid Product',
                price: -100, // Invalid: negative price
                stock: 10,
                category: testCategoryId
            });
            await invalidProduct.save();
            console.error('❌ Validation failed - negative price was accepted!'.red);
            return false;
        } catch (error) {
            if (error.errors?.price) {
                console.log('✅ Price validation working - negative price rejected'.green);
            }
        }

        // Test missing required fields
        try {
            const invalidProduct = new Product({
                name: 'Invalid Product 2'
                // Missing required: price, stock
            });
            await invalidProduct.save();
            console.error('❌ Validation failed - missing required fields accepted!'.red);
            return false;
        } catch (error) {
            if (error.errors?.price || error.errors?.stock) {
                console.log('✅ Required fields validation working'.green);
            }
        }

        // Test object array structure
        try {
            const validProduct = new Product({
                name: 'Validation Test Product',
                price: 100,
                stock: 10,
                category: testCategoryId,
                ingredients: [
                    { name: 'Test', description: 'Test desc' }
                ],
                gender: ['male', 'female'],
                dosage: 'Test dosage string'
            });
            await validProduct.save();
            console.log('✅ Object array structure validation passed'.green);
            await Product.findByIdAndDelete(validProduct._id); // Cleanup
            return true;
        } catch (error) {
            console.error('❌ Object array validation failed:'.red, error.message);
            return false;
        }
    } catch (error) {
        console.error('❌ Validation test failed:'.red, error.message);
        return false;
    }
};

// Main test function
const runTests = async () => {
    try {
        // Wait for database connection
        await new Promise((resolve) => {
            if (mongoose.connection.readyState === 1) {
                resolve();
            } else {
                mongoose.connection.once('open', resolve);
            }
        });

        console.log('\n🧪 Starting Product CRUD Tests...'.cyan.bold);
        console.log('=' .repeat(60).cyan);

        const results = {
            create: false,
            read: false,
            update: false,
            delete: false,
            validation: false
        };

        // Run tests
        results.create = await testCreate();
        if (!results.create) {
            console.log('\n⚠️  CREATE failed, skipping remaining tests'.yellow);
            process.exit(1);
        }

        results.read = await testRead();
        results.update = await testUpdate();
        results.delete = await testDelete();
        results.validation = await testValidation();

        // Summary
        console.log('\n' + '='.repeat(60).cyan);
        console.log('📊 Test Results Summary:'.cyan.bold);
        console.log('='.repeat(60).cyan);
        console.log(`CREATE:     ${results.create ? '✅ PASS' : '❌ FAIL'}`.white);
        console.log(`READ:       ${results.read ? '✅ PASS' : '❌ FAIL'}`.white);
        console.log(`UPDATE:     ${results.update ? '✅ PASS' : '❌ FAIL'}`.white);
        console.log(`DELETE:     ${results.delete ? '✅ PASS' : '❌ FAIL'}`.white);
        console.log(`VALIDATION: ${results.validation ? '✅ PASS' : '❌ FAIL'}`.white);
        console.log('='.repeat(60).cyan);

        const allPassed = Object.values(results).every(r => r === true);
        if (allPassed) {
            console.log('\n🎉 All CRUD tests passed successfully!'.green.bold);
            process.exit(0);
        } else {
            console.log('\n⚠️  Some tests failed. Please review the errors above.'.yellow.bold);
            process.exit(1);
        }
    } catch (error) {
        console.error('\n❌ Test suite failed:'.red.bold, error.message);
        console.error(error);
        process.exit(1);
    }
};

// Run tests
runTests();

