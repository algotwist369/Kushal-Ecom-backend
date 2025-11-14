const express = require('express');
const {
    uploadProductImages,
    uploadProductThumbnails,
    uploadCategoryImage,
    uploadUserAvatar,
    uploadUserDocuments,
    uploadPackOptionImages,
    uploadSingleImage,
    deleteUploadedFile
} = require('../controllers/uploadController');
const { createUploadMiddleware } = require('../middleware/advancedUploadMiddleware');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

router.post(
    '/products/gallery',
    protect,
    authorize('admin'),
    createUploadMiddleware({
        fieldName: 'images',
        maxCount: 10,
        subdirectories: ['products', 'gallery'],
        allowedMimeTypes: IMAGE_MIME_TYPES
    }),
    uploadProductImages
);

router.post(
    '/products/thumbnails',
    protect,
    authorize('admin'),
    createUploadMiddleware({
        fieldName: 'images',
        maxCount: 5,
        subdirectories: ['products', 'thumbnails'],
        allowedMimeTypes: IMAGE_MIME_TYPES
    }),
    uploadProductThumbnails
);

router.post(
    '/products/pack-options',
    protect,
    authorize('admin'),
    createUploadMiddleware({
        fieldName: 'images',
        maxCount: 5,
        subdirectories: ['products', 'pack-options'],
        allowedMimeTypes: IMAGE_MIME_TYPES
    }),
    uploadPackOptionImages
);

router.post(
    '/categories/icon',
    protect,
    authorize('admin'),
    createUploadMiddleware({
        fieldName: 'image',
        maxCount: 1,
        subdirectories: ['categories', 'icons'],
        allowedMimeTypes: IMAGE_MIME_TYPES
    }),
    uploadCategoryImage
);

router.post(
    '/users/avatar',
    protect,
    createUploadMiddleware({
        fieldName: 'avatar',
        maxCount: 1,
        subdirectories: ['users', 'avatars'],
        allowedMimeTypes: IMAGE_MIME_TYPES
    }),
    uploadUserAvatar
);

router.post(
    '/users/documents',
    protect,
    createUploadMiddleware({
        fieldName: 'documents',
        maxCount: 5,
        subdirectories: ['users', 'documents'],
        allowedMimeTypes: [...IMAGE_MIME_TYPES, 'application/pdf']
    }),
    uploadUserDocuments
);

router.post(
    '/reviews',
    protect,
    createUploadMiddleware({
        fieldName: 'images',
        maxCount: 6,
        subdirectories: ['reviewImg'],
        allowedMimeTypes: IMAGE_MIME_TYPES
    }),
    uploadSingleImage
);

router.post(
    '/single',
    protect,
    createUploadMiddleware({
        fieldName: 'file',
        maxCount: 1,
        subdirectories: ['general'],
        allowedMimeTypes: [...IMAGE_MIME_TYPES, 'application/pdf']
    }),
    uploadSingleImage
);

router.post('/delete', protect, authorize('admin'), deleteUploadedFile);

module.exports = router;
