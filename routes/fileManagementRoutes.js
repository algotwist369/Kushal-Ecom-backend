const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getUploadStats,
    getDirectoryFiles,
    deleteFile,
    cleanOldFiles,
    getFileInfo
} = require('../controllers/fileManagementController');

// All file management routes require admin access
router.use(protect);
router.use(admin);

// Get upload statistics
router.get('/stats', getUploadStats);

// Get files in specific directory
router.get('/directory/:directory', getDirectoryFiles);

// Get file info
router.get('/file/:directory/:filename', getFileInfo);

// Delete file
router.delete('/file/:directory/:filename', deleteFile);

// Clean old files
router.post('/clean', cleanOldFiles);

module.exports = router;
