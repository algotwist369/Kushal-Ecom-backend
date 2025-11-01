const Category = require('../models/Category');
const { handleAsync } = require('../utils/handleAsync');
const validateObjectId = require('../utils/validateObjectId');

// Create new category (Admin)
const createCategory = handleAsync(async (req, res) => {
    const { name, description, image, isActive } = req.body;
    
    // Validate required fields
    if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Category name is required' });
    }
    
    const exists = await Category.findOne({ name: name.trim() });
    if (exists) return res.status(400).json({ message: 'Category already exists' });

    const categoryData = {
        name: name.trim(),
        description: description || '',
        image: image || '',
        isActive: isActive !== undefined ? isActive : true
    };

    const category = await Category.create(categoryData);
    res.status(201).json(category);
});

// Get all categories (public - active only)
const getCategories = handleAsync(async (req, res) => {
    const categories = await Category.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(categories);
});

// Get all categories with pagination and filtering (Admin)
const getAllCategoriesAdmin = handleAsync(async (req, res) => {
    let { page, limit, search, status, sortBy } = req.query;

    page = Number(page) || 1;
    limit = Number(limit) || 10;
    const skip = (page - 1) * limit;

    let filter = {};
    
    // Status filter (active/inactive)
    if (status === 'active') filter.isActive = true;
    else if (status === 'inactive') filter.isActive = false;
    // If status is empty or 'all', don't filter by isActive
    
    // Search filter
    if (search && search.trim() !== '') {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    // Sorting
    let sort = {};
    switch (sortBy) {
        case 'name':
            sort.name = 1;
            break;
        case 'nameDesc':
            sort.name = -1;
            break;
        case 'oldest':
            sort.createdAt = 1;
            break;
        case 'newest':
        default:
            sort.createdAt = -1;
    }

    const categories = await Category.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit);

    const count = await Category.countDocuments(filter);

    res.json({ 
        categories, 
        total: count, 
        page, 
        pages: Math.ceil(count / limit),
        limit 
    });
});

// Get category by ID
const getCategoryById = handleAsync(async (req, res) => {
    if (!validateObjectId(req.params.id)) {
        return res.status(400).json({ message: 'Invalid category ID' });
    }
    
    const category = await Category.findById(req.params.id);
    if (!category) {
        return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json(category);
});

// Update category (Admin)
const updateCategory = handleAsync(async (req, res) => {
    const { name, description, image, isActive } = req.body;
    
    if (!validateObjectId(req.params.id)) {
        return res.status(400).json({ message: 'Invalid category ID' });
    }
    
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    // Check if name is being changed and if it already exists
    if (name && name.trim() !== category.name) {
        const exists = await Category.findOne({ 
            name: name.trim(), 
            _id: { $ne: req.params.id } 
        });
        if (exists) {
            return res.status(400).json({ message: 'Category name already exists' });
        }
        category.name = name.trim();
    }

    // Update other fields
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (isActive !== undefined) category.isActive = isActive;

    const updatedCategory = await category.save();
    res.json(updatedCategory);
});

// Delete category (Admin)
const deleteCategory = handleAsync(async (req, res) => {
    if (!validateObjectId(req.params.id)) {
        return res.status(400).json({ message: 'Invalid category ID' });
    }
    
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category removed' });
});

module.exports = {
    createCategory,
    getCategories,
    getAllCategoriesAdmin,
    getCategoryById,
    updateCategory,
    deleteCategory,
};