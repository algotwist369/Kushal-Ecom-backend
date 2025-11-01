const { handleAsync } = require('../utils/handleAsync');

// Upload review images
const uploadReviewImages = handleAsync(async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
    }

    // Generate URLs for uploaded images
    const imageUrls = req.files.map(file => {
        const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
        return `${baseUrl}/upload/reviewImg/${file.filename}`;
    });

    res.json({
        message: 'Images uploaded successfully',
        images: imageUrls,
        count: imageUrls.length
    });
});

module.exports = {
    uploadReviewImages
};

