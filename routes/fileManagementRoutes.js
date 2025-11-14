const express = require('express');
const {
    getUploadStats,
    getDirectoryFiles,
    deleteFile,
    cleanOldFiles,
    getFileInfo
} = require('../controllers/fileManagementController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/stats', protect, authorize('admin'), getUploadStats);
router.get('/directory/:directory', protect, authorize('admin'), getDirectoryFiles);
router.get('/file/:directory/:filename', protect, authorize('admin'), getFileInfo);
router.delete('/file/:directory/:filename', protect, authorize('admin'), deleteFile);
router.post('/clean', protect, authorize('admin'), cleanOldFiles);

module.exports = router;
