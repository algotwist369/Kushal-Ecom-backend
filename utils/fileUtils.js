const fs = require('fs');
const path = require('path');

// Create directory if it doesn't exist
const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created directory: ${dirPath}`);
    }
};

// Get file size in human readable format
const getFileSize = (filePath) => {
    try {
        const stats = fs.statSync(filePath);
        const bytes = stats.size;
        
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    } catch (error) {
        return 'Unknown';
    }
};

// Get file extension
const getFileExtension = (filename) => {
    return path.extname(filename).toLowerCase();
};

// Check if file is an image
const isImageFile = (filename) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const ext = getFileExtension(filename);
    return imageExtensions.includes(ext);
};

// Generate unique filename
const generateUniqueFilename = (originalName) => {
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext).replace(/\s+/g, '-');
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    return `${name}-${timestamp}-${random}${ext}`;
};

// Clean filename (remove special characters)
const cleanFilename = (filename) => {
    return filename
        .replace(/[^a-zA-Z0-9.-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
};

// Get all files in directory
const getFilesInDirectory = (dirPath) => {
    try {
        return fs.readdirSync(dirPath).filter(file => {
            const fullPath = path.join(dirPath, file);
            return fs.statSync(fullPath).isFile();
        });
    } catch (error) {
        console.error('Error reading directory:', error);
        return [];
    }
};

// Delete old files (older than specified days)
const deleteOldFiles = (dirPath, daysOld = 30) => {
    try {
        const files = fs.readdirSync(dirPath);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        
        let deletedCount = 0;
        
        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            
            if (stats.isFile() && stats.mtime < cutoffDate) {
                fs.unlinkSync(filePath);
                deletedCount++;
                console.log(`Deleted old file: ${file}`);
            }
        });
        
        return deletedCount;
    } catch (error) {
        console.error('Error deleting old files:', error);
        return 0;
    }
};

// Get directory size
const getDirectorySize = (dirPath) => {
    let totalSize = 0;
    
    try {
        const files = fs.readdirSync(dirPath);
        
        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            
            if (stats.isFile()) {
                totalSize += stats.size;
            } else if (stats.isDirectory()) {
                totalSize += getDirectorySize(filePath);
            }
        });
    } catch (error) {
        console.error('Error calculating directory size:', error);
    }
    
    return totalSize;
};

// Create upload directories structure
const createUploadDirectories = () => {
    const baseDir = path.join(__dirname, '../uploads');
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const dateFolder = `${year}-${month}-${day}`;
    
    const directories = [
        'products',
        'categories', 
        'users',
        'general',
        'temp',
        'invoices',
        'exports',
        'backups'
    ];
    
    // Create main directories
    directories.forEach(dir => {
        ensureDirectoryExists(path.join(baseDir, dir));
    });
    
    // Create date-based subdirectories for better organization
    const dateBasedDirs = ['products', 'categories', 'users', 'general'];
    dateBasedDirs.forEach(dir => {
        ensureDirectoryExists(path.join(baseDir, dir, dateFolder));
    });
    
    // Create additional organized folders
    const additionalFolders = [
        'products/thumbnails',
        'products/gallery',
        'categories/icons',
        'users/avatars',
        'users/documents',
        'general/temp',
        'general/archived'
    ];
    
    additionalFolders.forEach(folder => {
        ensureDirectoryExists(path.join(baseDir, folder));
    });
    
    console.log('Upload directories created successfully with organized structure');
};

module.exports = {
    ensureDirectoryExists,
    getFileSize,
    getFileExtension,
    isImageFile,
    generateUniqueFilename,
    cleanFilename,
    getFilesInDirectory,
    deleteOldFiles,
    getDirectorySize,
    createUploadDirectories
};
