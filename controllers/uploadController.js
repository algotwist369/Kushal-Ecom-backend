const { handleAsync } = require('../utils/handleAsync');
const { getFileUrl, deleteFile } = require('../middleware/advancedUploadMiddleware');
const path = require('path');

// Upload product images
const uploadProductImages = handleAsync(async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
    }

    const imageUrls = req.files.map(file => getFileUrl(req, file.path, 'products', 'gallery'));
    
    res.status(201).json({
        message: 'Product images uploaded successfully',
        images: imageUrls,
        count: req.files.length,
        folder: 'products/gallery'
    });
});

// Upload product thumbnails
const uploadProductThumbnails = handleAsync(async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
    }

    const imageUrls = req.files.map(file => getFileUrl(req, file.path, 'products', 'thumbnails'));
    
    res.status(201).json({
        message: 'Product thumbnails uploaded successfully',
        images: imageUrls,
        count: req.files.length,
        folder: 'products/thumbnails'
    });
});

// Upload category image
const uploadCategoryImage = handleAsync(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const imageUrl = getFileUrl(req, req.file.path, 'categories', 'icons');
    
    res.status(201).json({
        message: 'Category image uploaded successfully',
        image: imageUrl,
        folder: 'categories/icons'
    });
});

// Upload user avatar
const uploadUserAvatar = handleAsync(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const imageUrl = getFileUrl(req, req.file.path, 'users', 'avatars');
    
    res.status(201).json({
        message: 'User avatar uploaded successfully',
        avatar: imageUrl,
        folder: 'users/avatars'
    });
});

// Upload user documents
const uploadUserDocuments = handleAsync(async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
    }

    const documentUrls = req.files.map(file => getFileUrl(req, file.path, 'users', 'documents'));
    
    res.status(201).json({
        message: 'User documents uploaded successfully',
        documents: documentUrls,
        count: req.files.length,
        folder: 'users/documents'
    });
});

// Upload pack option images
const uploadPackOptionImages = handleAsync(async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
    }

    const imageUrls = req.files.map(file => getFileUrl(req, file.path, 'products', 'pack-options'));
    
    res.status(201).json({
        message: 'Pack option images uploaded successfully',
        images: imageUrls,
        count: req.files.length,
        folder: 'products/pack-options'
    });
});

// Upload single image
const uploadSingleImage = handleAsync(async (req, res) => {
    if (!req.file && (!req.files || req.files.length === 0)) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    // Handle single file
    if (req.file) {
        const imageUrl = getFileUrl(req, req.file.path);
        return res.status(201).json({
            message: 'Image uploaded successfully',
            url: imageUrl,
            image: imageUrl
        });
    }

    // Handle multiple files (for review images)
    const imageUrls = req.files.map(file => getFileUrl(req, file.path));
    res.status(201).json({
        message: 'Images uploaded successfully',
        urls: imageUrls,
        count: req.files.length
    });
});

// Delete file
const deleteUploadedFile = handleAsync(async (req, res) => {
    const { filePath } = req.body;
    
    if (!filePath) {
        return res.status(400).json({ message: 'File path is required' });
    }

    // Extract relative path from URL and sanitize to prevent path traversal
    let relativePath = filePath;
    if (filePath.includes('/uploads/')) {
        const uploadsIndex = filePath.indexOf('/uploads/');
        relativePath = filePath.substring(uploadsIndex);
    }

    // Normalize and validate path to prevent directory traversal attacks
    const normalizedPath = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
    if (!normalizedPath.startsWith('uploads/')) {
        return res.status(400).json({ message: 'Invalid file path' });
    }

    const fullPath = path.join(__dirname, '..', normalizedPath);
    
    // Additional security: ensure the resolved path is still within uploads directory
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const resolvedPath = path.resolve(fullPath);
    if (!resolvedPath.startsWith(path.resolve(uploadsDir))) {
        return res.status(400).json({ message: 'Invalid file path - outside uploads directory' });
    }

    const deleted = deleteFile(fullPath);

    if (deleted) {
        res.json({ message: 'File deleted successfully' });
    } else {
        res.status(404).json({ message: 'File not found or could not be deleted' });
    }
});

// Get file info
const getFileInfo = handleAsync(async (req, res) => {
    // Extract the file path from the catch-all parameter
    const filePath = req.params.path;
    
    if (!filePath) {
        return res.status(400).json({ message: 'File path is required' });
    }

    const fullPath = path.join(__dirname, '../uploads', filePath);
    const fs = require('fs');
    const stats = require('fs').statSync;

    try {
        const fileStats = stats(fullPath);
        const imageUrl = getFileUrl(req, fullPath);
        
        res.json({
            path: filePath,
            url: imageUrl,
            size: fileStats.size,
            created: fileStats.birthtime,
            modified: fileStats.mtime,
            isFile: fileStats.isFile(),
            isDirectory: fileStats.isDirectory()
        });
    } catch (error) {
        res.status(404).json({ message: 'File not found' });
    }
});

module.exports = {
    uploadProductImages,
    uploadProductThumbnails,
    uploadCategoryImage,
    uploadUserAvatar,
    uploadUserDocuments,
    uploadPackOptionImages,
    uploadSingleImage,
    deleteUploadedFile
    // getFileInfo removed - use /v1/api/files/file/:directory/:filename instead
};
