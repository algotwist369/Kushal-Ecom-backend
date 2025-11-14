const fs = require('fs');
const path = require('path');

const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff']);

const uploadDirectories = [
    'uploads',
    path.join('uploads', 'products'),
    path.join('uploads', 'products', 'gallery'),
    path.join('uploads', 'products', 'thumbnails'),
    path.join('uploads', 'products', 'pack-options'),
    path.join('uploads', 'categories'),
    path.join('uploads', 'categories', 'icons'),
    path.join('uploads', 'users'),
    path.join('uploads', 'users', 'avatars'),
    path.join('uploads', 'users', 'documents'),
    path.join('uploads', 'general'),
    path.join('uploads', 'invoices'),
    path.join('uploads', 'exports'),
    path.join('uploads', 'temp'),
    path.join('uploads', 'backups')
];

const getBaseUploadsPath = () => path.join(__dirname, '..');

const ensureDirectory = (directoryPath) => {
    try {
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true });
            console.log(`📁 Created directory: ${directoryPath}`);
        }
        return true;
    } catch (error) {
        console.error(`❌ Failed to create directory ${directoryPath}:`, error.message);
        return false;
    }
};

const createUploadDirectories = () => {
    const basePath = getBaseUploadsPath();
    uploadDirectories.forEach((relativePath) => {
        const fullPath = path.join(basePath, relativePath);
        ensureDirectory(fullPath);
    });
};

const getFilesInDirectory = (directoryPath) => {
    try {
        if (!fs.existsSync(directoryPath)) {
            return [];
        }

        return fs.readdirSync(directoryPath).filter((file) => {
            const filePath = path.join(directoryPath, file);
            return fs.statSync(filePath).isFile();
        });
    } catch (error) {
        console.error(`❌ Failed to read directory ${directoryPath}:`, error.message);
        return [];
    }
};

const getFileSize = (filePath) => {
    try {
        const stats = fs.statSync(filePath);
        return stats.isFile() ? stats.size : 0;
    } catch {
        return 0;
    }
};

const getDirectorySize = (directoryPath) => {
    try {
        if (!fs.existsSync(directoryPath)) {
            return 0;
        }

        return fs.readdirSync(directoryPath).reduce((total, entry) => {
            const entryPath = path.join(directoryPath, entry);
            try {
                const stats = fs.statSync(entryPath);
                if (stats.isDirectory()) {
                    return total + getDirectorySize(entryPath);
                }
                if (stats.isFile()) {
                    return total + stats.size;
                }
            } catch {
                // Ignore entries that can't be accessed
            }
            return total;
        }, 0);
    } catch (error) {
        console.error(`❌ Failed to calculate directory size for ${directoryPath}:`, error.message);
        return 0;
    }
};

const deleteOldFiles = (directoryPath, days = 30) => {
    if (!Number.isFinite(days) || days <= 0) {
        return 0;
    }

    try {
        if (!fs.existsSync(directoryPath)) {
            return 0;
        }

        const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
        let deletedCount = 0;

        fs.readdirSync(directoryPath).forEach((entry) => {
            const entryPath = path.join(directoryPath, entry);
            try {
                const stats = fs.statSync(entryPath);

                if (stats.isDirectory()) {
                    deletedCount += deleteOldFiles(entryPath, days);
                    const remainingEntries = fs.readdirSync(entryPath);
                    if (remainingEntries.length === 0) {
                        fs.rmdirSync(entryPath);
                    }
                } else if (stats.isFile() && stats.mtimeMs < cutoffTime) {
                    fs.unlinkSync(entryPath);
                    deletedCount += 1;
                }
            } catch (error) {
                console.error(`❌ Failed to process ${entryPath}:`, error.message);
            }
        });

        return deletedCount;
    } catch (error) {
        console.error(`❌ Failed to delete old files in ${directoryPath}:`, error.message);
        return 0;
    }
};

const isImageFile = (fileName = '') => {
    const extension = path.extname(fileName).toLowerCase();
    return imageExtensions.has(extension);
};

module.exports = {
    createUploadDirectories,
    ensureDirectory,
    getFilesInDirectory,
    getFileSize,
    getDirectorySize,
    deleteOldFiles,
    isImageFile
};

