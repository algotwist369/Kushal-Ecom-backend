const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    uploadProductImages: uploadProductImagesMiddleware,
    uploadProductThumbnails: uploadProductThumbnailsMiddleware,
    uploadPackOptionImages: uploadPackOptionImagesMiddleware,
    uploadCategoryImages: uploadCategoryImagesMiddleware,
    uploadUserAvatars: uploadUserAvatarsMiddleware,
    uploadUserDocuments: uploadUserDocumentsMiddleware,
    uploadReviewImages: uploadReviewImagesMiddleware,
    uploadGeneralFiles: uploadGeneralFilesMiddleware,
    uploadInvoiceFiles: uploadInvoiceFilesMiddleware,
    uploadExportFiles: uploadExportFilesMiddleware,
    handleUploadError
} = require('../middleware/advancedUploadMiddleware');
const {
    uploadProductImages: uploadProductImagesController,
    uploadProductThumbnails: uploadProductThumbnailsController,
    uploadPackOptionImages: uploadPackOptionImagesController,
    uploadCategoryImage: uploadCategoryImageController,
    uploadUserAvatar: uploadUserAvatarController,
    uploadUserDocuments: uploadUserDocumentsController,
    uploadSingleImage: uploadSingleImageController,
    deleteUploadedFile,
    getFileInfo
} = require('../controllers/uploadController');

// All upload routes require authentication
router.use(protect);

// Upload product images (Admin only)
router.post('/products', admin, uploadProductImagesMiddleware, uploadProductImagesController, handleUploadError);

// Upload product thumbnails (Admin only)
router.post('/products/thumbnails', admin, uploadProductThumbnailsMiddleware, uploadProductThumbnailsController, handleUploadError);

// Upload pack option images (Admin only)
router.post('/products/pack-options', admin, uploadPackOptionImagesMiddleware, uploadPackOptionImagesController, handleUploadError);

// Upload category image (Admin only)
router.post('/categories', admin, uploadCategoryImagesMiddleware, uploadCategoryImageController, handleUploadError);

// Upload user avatar
router.post('/users/avatar', uploadUserAvatarsMiddleware, uploadUserAvatarController, handleUploadError);

// Upload user documents
router.post('/users/documents', uploadUserDocumentsMiddleware, uploadUserDocumentsController, handleUploadError);

// Upload general files
router.post('/general', uploadGeneralFilesMiddleware, uploadSingleImageController, handleUploadError);

// Upload review images (authenticated users - saved to upload/reviewImg folder)
router.post('/reviews', uploadReviewImagesMiddleware, uploadSingleImageController, handleUploadError);

// Upload invoice files (Admin only)
router.post('/invoices', admin, uploadInvoiceFilesMiddleware, uploadSingleImageController, handleUploadError);

// Upload export files (Admin only)
router.post('/exports', admin, uploadExportFilesMiddleware, uploadSingleImageController, handleUploadError);

// Delete uploaded file
router.delete('/delete', deleteUploadedFile);

// Get file info - Removed due to Express 5 compatibility issues
// Use the file management routes instead: GET /v1/api/files/file/:directory/:filename

module.exports = router;
