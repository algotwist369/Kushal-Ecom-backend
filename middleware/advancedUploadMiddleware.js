const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const createUploadsDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Generate folder name based on content type and date
const generateFolderName = (contentType, customFolder = null) => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const dateFolder = `${year}-${month}-${day}`;
    
    if (customFolder) {
        return `${contentType}/${customFolder}/${dateFolder}`;
    }
    
    return `${contentType}/${dateFolder}`;
};

// Advanced storage configuration
const createStorage = (contentType, customFolder = null) => {
    return multer.diskStorage({
        destination: (req, file, cb) => {
            const folderName = generateFolderName(contentType, customFolder);
            const uploadPath = path.join(__dirname, '../uploads', folderName);
            createUploadsDir(uploadPath);
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            // Generate descriptive filename
            const timestamp = Date.now();
            const random = Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            const name = path.basename(file.originalname, ext)
                .replace(/[^a-zA-Z0-9]/g, '-')
                .toLowerCase();
            
            // Add content type prefix
            const prefix = contentType === 'products' ? 'prod' : 
                          contentType === 'categories' ? 'cat' : 
                          contentType === 'users' ? 'user' : 'gen';
            
            cb(null, `${prefix}-${name}-${timestamp}-${random}${ext}`);
        }
    });
};

// File filter for different content types
const createFileFilter = (allowedTypes = /jpeg|jpg|png|gif|webp/) => {
    return (req, file, cb) => {
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error(`Only image files (${allowedTypes.source}) are allowed!`));
        }
    };
};

// Create upload configurations for different content types
const createUploadConfig = (contentType, customFolder = null, maxFiles = 10) => {
    return multer({
        storage: createStorage(contentType, customFolder),
        limits: {
            fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
            files: maxFiles
        },
        fileFilter: createFileFilter()
    });
};

// Predefined upload configurations
const uploadConfigs = {
    // Product images with gallery and thumbnail folders
    productImages: createUploadConfig('products', 'gallery', 10),
    productThumbnails: createUploadConfig('products', 'thumbnails', 5),
    packOptionImages: createUploadConfig('products', 'pack-options', 5),
    
    // Category images
    categoryImages: createUploadConfig('categories', 'icons', 3),
    
    // User files
    userAvatars: createUploadConfig('users', 'avatars', 1),
    userDocuments: createUploadConfig('users', 'documents', 5),
    
    // Review images
    reviewImages: createUploadConfig('reviewImg', null, 5),
    
    // General files
    generalFiles: createUploadConfig('general', 'temp', 10),
    archivedFiles: createUploadConfig('general', 'archived', 20),
    
    // Invoice files
    invoiceFiles: createUploadConfig('invoices', null, 5),
    
    // Export files
    exportFiles: createUploadConfig('exports', null, 10)
};

// Upload middlewares
const uploadProductImages = uploadConfigs.productImages.array('productImages', 10);
const uploadProductThumbnails = uploadConfigs.productThumbnails.array('thumbnails', 5);
const uploadPackOptionImages = uploadConfigs.packOptionImages.array('packOptionImages', 5);
const uploadCategoryImages = uploadConfigs.categoryImages.single('categoryImage');
const uploadUserAvatars = uploadConfigs.userAvatars.single('avatar');
const uploadUserDocuments = uploadConfigs.userDocuments.array('documents', 5);
const uploadReviewImages = uploadConfigs.reviewImages.array('images', 5);
const uploadGeneralFiles = uploadConfigs.generalFiles.array('files', 10);
const uploadInvoiceFiles = uploadConfigs.invoiceFiles.single('invoice');
const uploadExportFiles = uploadConfigs.exportFiles.single('export');

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'File too large. Maximum size allowed is 10MB.'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                message: 'Too many files. Maximum files exceeded.'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                message: 'Unexpected field name for file upload.'
            });
        }
    }
    
    if (error.message.includes('Only image files')) {
        return res.status(400).json({
            message: error.message
        });
    }
    
    next(error);
};

// Helper function to get file URL with proper path
const getFileUrl = (req, filePath, contentType, customFolder = null) => {
    if (!filePath) return null;
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const relativePath = filePath.replace(/\\/g, '/');
    const uploadsIndex = relativePath.indexOf('/uploads/');
    
    if (uploadsIndex !== -1) {
        return `${baseUrl}${relativePath.substring(uploadsIndex)}`;
    }
    
    // Fallback: construct URL from file path
    const fileName = path.basename(filePath);
    const folderName = generateFolderName(contentType, customFolder);
    return `${baseUrl}/uploads/${folderName}/${fileName}`;
};

// Helper function to delete file
const deleteFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
};

module.exports = {
    uploadProductImages,
    uploadProductThumbnails,
    uploadPackOptionImages,
    uploadCategoryImages,
    uploadUserAvatars,
    uploadUserDocuments,
    uploadReviewImages,
    uploadGeneralFiles,
    uploadInvoiceFiles,
    uploadExportFiles,
    handleUploadError,
    getFileUrl,
    deleteFile,
    generateFolderName
};
