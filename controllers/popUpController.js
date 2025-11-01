const PopUp = require('../models/PopUP');
const { handleAsync } = require('../utils/handleAsync');

// Get all popups (admin)
const getAllPopUps = handleAsync(async (req, res) => {
    const { page = 1, limit = 10, isActive } = req.query;
    
    const filter = {};
    if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
    }

    const popups = await PopUp.find(filter)
        .populate('product', 'name slug price discountPrice images')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await PopUp.countDocuments(filter);

    res.json({
        success: true,
        data: {
            popups,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit))
        }
    });
});

// Get active popup for users (only one active popup at a time)
const getActivePopUp = handleAsync(async (req, res) => {
    const popup = await PopUp.findOne({ isActive: true })
        .populate('product', 'name slug price discountPrice images stock')
        .sort({ createdAt: -1 });

    // Increment view count
    if (popup) {
        popup.viewCount += 1;
        await popup.save();
    }

    res.json({
        success: true,
        data: popup
    });
});

// Track popup click
const trackPopUpClick = handleAsync(async (req, res) => {
    const { id } = req.params;

    const popup = await PopUp.findById(id);

    if (!popup) {
        return res.status(404).json({
            success: false,
            message: 'Popup not found'
        });
    }

    popup.clickCount += 1;
    await popup.save();

    res.json({
        success: true,
        message: 'Click tracked'
    });
});

// Get popup by ID
const getPopUpById = handleAsync(async (req, res) => {
    const { id } = req.params;

    const popup = await PopUp.findById(id)
        .populate('product', 'name slug price discountPrice images stock');

    if (!popup) {
        return res.status(404).json({
            success: false,
            message: 'Popup not found'
        });
    }

    res.json({
        success: true,
        data: popup
    });
});

// Create popup
const createPopUp = handleAsync(async (req, res) => {
    const { 
        product, 
        image, 
        title, 
        description, 
        delaySeconds,
        displayFrequency,
        showOnPages,
        closeableAfter,
        autoCloseAfter,
        buttonText,
        buttonColor,
        isActive 
    } = req.body;

    const willBeActive = isActive !== undefined ? isActive : true;

    // If this popup will be active, deactivate all other popups FIRST
    if (willBeActive === true) {
        console.log('🔄 Deactivating all existing popups...');
        const result = await PopUp.updateMany({}, { $set: { isActive: false } });
        console.log(`✅ Deactivated ${result.modifiedCount} popups`);
    }

    const popup = await PopUp.create({
        product,
        image,
        title,
        description,
        delaySeconds: delaySeconds !== undefined ? delaySeconds : 2,
        displayFrequency: displayFrequency || 'once_per_session',
        showOnPages: showOnPages || ['home'],
        closeableAfter: closeableAfter !== undefined ? closeableAfter : 0,
        autoCloseAfter: autoCloseAfter !== undefined ? autoCloseAfter : 0,
        buttonText: buttonText || 'Shop Now',
        buttonColor: buttonColor || '#111827',
        isActive: willBeActive
    });

    const populatedPopup = await PopUp.findById(popup._id)
        .populate('product', 'name slug price discountPrice images stock');

    res.status(201).json({
        success: true,
        message: 'Popup created successfully',
        data: populatedPopup
    });
});

// Update popup
const updatePopUp = handleAsync(async (req, res) => {
    const { id } = req.params;
    const { 
        product, 
        image, 
        title, 
        description, 
        delaySeconds,
        displayFrequency,
        showOnPages,
        closeableAfter,
        autoCloseAfter,
        buttonText,
        buttonColor,
        isActive 
    } = req.body;

    const popup = await PopUp.findById(id);

    if (!popup) {
        return res.status(404).json({
            success: false,
            message: 'Popup not found'
        });
    }

    // If setting as active, deactivate all other popups
    if (isActive === true) {
        await PopUp.updateMany({ _id: { $ne: id } }, { isActive: false });
    }

    // Update all fields
    if (product !== undefined) popup.product = product;
    if (image !== undefined) popup.image = image;
    if (title !== undefined) popup.title = title;
    if (description !== undefined) popup.description = description;
    if (delaySeconds !== undefined) popup.delaySeconds = delaySeconds;
    if (displayFrequency !== undefined) popup.displayFrequency = displayFrequency;
    if (showOnPages !== undefined) popup.showOnPages = showOnPages;
    if (closeableAfter !== undefined) popup.closeableAfter = closeableAfter;
    if (autoCloseAfter !== undefined) popup.autoCloseAfter = autoCloseAfter;
    if (buttonText !== undefined) popup.buttonText = buttonText;
    if (buttonColor !== undefined) popup.buttonColor = buttonColor;
    if (isActive !== undefined) popup.isActive = isActive;

    await popup.save();

    const updatedPopup = await PopUp.findById(id)
        .populate('product', 'name slug price discountPrice images stock');

    res.json({
        success: true,
        message: 'Popup updated successfully',
        data: updatedPopup
    });
});

// Delete popup
const deletePopUp = handleAsync(async (req, res) => {
    const { id } = req.params;

    const popup = await PopUp.findById(id);

    if (!popup) {
        return res.status(404).json({
            success: false,
            message: 'Popup not found'
        });
    }

    await popup.deleteOne();

    res.json({
        success: true,
        message: 'Popup deleted successfully'
    });
});

module.exports = {
    getAllPopUps,
    getActivePopUp,
    getPopUpById,
    createPopUp,
    updatePopUp,
    deletePopUp,
    trackPopUpClick
};

