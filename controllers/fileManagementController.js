const { handleAsync } = require('../utils/handleAsync');
const { 
    getFilesInDirectory, 
    getFileSize, 
    getDirectorySize,
    deleteOldFiles,
    isImageFile 
} = require('../utils/fileUtils');
const { deleteFile: deleteFileUtil } = require('../middleware/advancedUploadMiddleware');
const path = require('path');
const fs = require('fs');

// Get upload statistics
const getUploadStats = handleAsync(async (req, res) => {
    const uploadsDir = path.join(__dirname, '../uploads');
    const mainDirectories = ['products', 'categories', 'users', 'general', 'invoices', 'exports', 'temp', 'backups'];
    
    const stats = {
        totalFiles: 0,
        totalSize: 0,
        directories: {},
        subdirectories: {}
    };
    
    mainDirectories.forEach(dir => {
        const dirPath = path.join(uploadsDir, dir);
        const files = getFilesInDirectory(dirPath);
        const size = getDirectorySize(dirPath);
        
        stats.directories[dir] = {
            fileCount: files.length,
            size: size,
            sizeFormatted: formatBytes(size)
        };
        
        stats.totalFiles += files.length;
        stats.totalSize += size;
        
        // Get subdirectory stats
        try {
            const subdirs = fs.readdirSync(dirPath).filter(item => {
                const itemPath = path.join(dirPath, item);
                return fs.statSync(itemPath).isDirectory();
            });
            
            stats.subdirectories[dir] = subdirs.map(subdir => {
                const subdirPath = path.join(dirPath, subdir);
                const subdirFiles = getFilesInDirectory(subdirPath);
                const subdirSize = getDirectorySize(subdirPath);
                
                return {
                    name: subdir,
                    fileCount: subdirFiles.length,
                    size: subdirSize,
                    sizeFormatted: formatBytes(subdirSize)
                };
            });
        } catch (error) {
            stats.subdirectories[dir] = [];
        }
    });
    
    stats.totalSizeFormatted = formatBytes(stats.totalSize);
    
    res.json(stats);
});

// Get files in directory
const getDirectoryFiles = handleAsync(async (req, res) => {
    const { directory } = req.params;
    const allowedDirs = ['products', 'categories', 'users', 'general'];
    
    if (!allowedDirs.includes(directory)) {
        return res.status(400).json({ message: 'Invalid directory' });
    }
    
    const dirPath = path.join(__dirname, '../uploads', directory);
    const files = getFilesInDirectory(dirPath);
    
    const fileDetails = files.map(file => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        return {
            name: file,
            size: stats.size,
            sizeFormatted: formatBytes(stats.size),
            created: stats.birthtime,
            modified: stats.mtime,
            isImage: isImageFile(file),
            url: `/uploads/${directory}/${file}`
        };
    });
    
    res.json({
        directory,
        files: fileDetails,
        count: files.length
    });
});

// Delete file
const deleteFile = handleAsync(async (req, res) => {
    const { directory, filename } = req.params;
    const allowedDirs = ['products', 'categories', 'users', 'general'];
    
    if (!allowedDirs.includes(directory)) {
        return res.status(400).json({ message: 'Invalid directory' });
    }
    
    const filePath = path.join(__dirname, '../uploads', directory, filename);
    const deleted = deleteFileUtil(filePath);
    
    if (deleted) {
        res.json({ message: 'File deleted successfully' });
    } else {
        res.status(404).json({ message: 'File not found' });
    }
});

// Clean old files
const cleanOldFiles = handleAsync(async (req, res) => {
    const { days = 30 } = req.query;
    const uploadsDir = path.join(__dirname, '../uploads');
    const directories = ['products', 'categories', 'users', 'general'];
    
    let totalDeleted = 0;
    
    directories.forEach(dir => {
        const dirPath = path.join(uploadsDir, dir);
        const deleted = deleteOldFiles(dirPath, parseInt(days));
        totalDeleted += deleted;
    });
    
    res.json({
        message: `Cleaned ${totalDeleted} old files`,
        deletedCount: totalDeleted,
        daysOld: parseInt(days)
    });
});

// Get file info
const getFileInfo = handleAsync(async (req, res) => {
    const { directory, filename } = req.params;
    const allowedDirs = ['products', 'categories', 'users', 'general'];
    
    if (!allowedDirs.includes(directory)) {
        return res.status(400).json({ message: 'Invalid directory' });
    }
    
    const filePath = path.join(__dirname, '../uploads', directory, filename);
    
    try {
        const stats = fs.statSync(filePath);
        
        res.json({
            name: filename,
            directory,
            size: stats.size,
            sizeFormatted: formatBytes(stats.size),
            created: stats.birthtime,
            modified: stats.mtime,
            isImage: isImageFile(filename),
            url: `/uploads/${directory}/${filename}`,
            path: filePath
        });
    } catch (error) {
        res.status(404).json({ message: 'File not found' });
    }
});

// Helper function to format bytes
const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

module.exports = {
    getUploadStats,
    getDirectoryFiles,
    deleteFile,
    cleanOldFiles,
    getFileInfo
};
