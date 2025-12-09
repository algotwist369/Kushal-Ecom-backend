const HeroImage = require('../models/HeroImage');
const { handleAsync } = require('../utils/handleAsync');

// Get all hero images (public endpoint for frontend)
const getHeroImages = handleAsync(async (req, res) => {
    const heroImage = await HeroImage.findOne();
    
    if (!heroImage || !heroImage.data || heroImage.data.length === 0) {
        return res.json({
            success: true,
            data: {
                images: []
            }
        });
    }

    res.json({
        success: true,
        data: {
            images: heroImage.data
        }
    });
});

// Get hero images (admin)
const getHeroImagesAdmin = handleAsync(async (req, res) => {
    const heroImage = await HeroImage.findOne();
    
    if (!heroImage) {
        return res.json({
            success: true,
            data: {
                images: [],
                _id: null
            }
        });
    }

    res.json({
        success: true,
        data: heroImage
    });
});

// Create or update hero images (accepts multiple images at once)
const createOrUpdateHeroImages = handleAsync(async (req, res) => {
    const { images } = req.body;

    // Validate input
    if (!images || !Array.isArray(images)) {
        return res.status(400).json({
            success: false,
            message: 'Images must be an array'
        });
    }

    if (images.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'At least one hero image is required'
        });
    }

    // Validate each image object
    for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (!image.large_image || !image.mobile_image) {
            return res.status(400).json({
                success: false,
                message: `Image at index ${i} is missing required fields (large_image, mobile_image)`
            });
        }
    }

    // Find existing hero image document or create new one
    let heroImage = await HeroImage.findOne();

    if (heroImage) {
        // Update existing document
        heroImage.data = images;
        await heroImage.save();
    } else {
        // Create new document
        heroImage = await HeroImage.create({
            data: images
        });
    }

    res.status(201).json({
        success: true,
        message: `Successfully ${heroImage.isNew ? 'created' : 'updated'} ${images.length} hero image(s)`,
        data: heroImage
    });
});

// Add hero images (append to existing)
const addHeroImages = handleAsync(async (req, res) => {
    const { images } = req.body;

    // Validate input
    if (!images || !Array.isArray(images)) {
        return res.status(400).json({
            success: false,
            message: 'Images must be an array'
        });
    }

    if (images.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'At least one hero image is required'
        });
    }

    // Validate each image object
    for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (!image.large_image || !image.mobile_image) {
            return res.status(400).json({
                success: false,
                message: `Image at index ${i} is missing required fields (large_image, mobile_image)`
            });
        }
    }

    // Find existing hero image document or create new one
    let heroImage = await HeroImage.findOne();

    if (heroImage) {
        // Append to existing images
        heroImage.data.push(...images);
        await heroImage.save();
    } else {
        // Create new document
        heroImage = await HeroImage.create({
            data: images
        });
    }

    res.status(201).json({
        success: true,
        message: `Successfully added ${images.length} hero image(s)`,
        data: heroImage
    });
});

// Delete hero image by index
const deleteHeroImage = handleAsync(async (req, res) => {
    const { index } = req.params;
    const imageIndex = parseInt(index);

    if (isNaN(imageIndex) || imageIndex < 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid image index'
        });
    }

    const heroImage = await HeroImage.findOne();

    if (!heroImage || !heroImage.data || heroImage.data.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'No hero images found'
        });
    }

    if (imageIndex >= heroImage.data.length) {
        return res.status(404).json({
            success: false,
            message: `Image at index ${imageIndex} not found`
        });
    }

    heroImage.data.splice(imageIndex, 1);
    await heroImage.save();

    res.json({
        success: true,
        message: 'Hero image deleted successfully',
        data: heroImage
    });
});

// Delete all hero images
const deleteAllHeroImages = handleAsync(async (req, res) => {
    const heroImage = await HeroImage.findOne();

    if (!heroImage || !heroImage.data || heroImage.data.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'No hero images found'
        });
    }

    heroImage.data = [];
    await heroImage.save();

    res.json({
        success: true,
        message: 'All hero images deleted successfully',
        data: heroImage
    });
});

module.exports = {
    getHeroImages,
    getHeroImagesAdmin,
    createOrUpdateHeroImages,
    addHeroImages,
    deleteHeroImage,
    deleteAllHeroImages
};

