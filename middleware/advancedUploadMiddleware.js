const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { ensureDirectory } = require('../utils/fileUtils');

const baseUploadsDir = path.join(__dirname, '..', 'uploads');

const createStorage = (subdirectories = []) => {
    const destinationPath = path.join(baseUploadsDir, ...subdirectories);
    ensureDirectory(destinationPath);

    return multer.diskStorage({
        destination: (_req, _file, cb) => {
            cb(null, destinationPath);
        },
        filename: (_req, file, cb) => {
            const ext = path.extname(file.originalname);
            const safeName = path
                .basename(file.originalname, ext)
                .toLowerCase()
                .replace(/[^a-z0-9]+/gi, '-')
                .replace(/^-+|-+$/g, '');
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            cb(null, `${safeName || 'file'}-${uniqueSuffix}${ext.toLowerCase()}`);
        }
    });
};

const getFileFilter = (allowedMimeTypes = []) => {
    if (!allowedMimeTypes.length) {
        // Default: allow only images if no specific types specified
        const defaultImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const allowed = new Set(defaultImageTypes);
        return (_req, file, cb) => {
            if (allowed.has(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error(`Unsupported file type: ${file.mimetype}. Only images are allowed.`));
            }
        };
    }

    const allowed = new Set(allowedMimeTypes);
    return (_req, file, cb) => {
        if (allowed.has(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported file type: ${file.mimetype}`));
        }
    };
};

const createUploadMiddleware = ({
    fieldName,
    maxCount = 1,
    subdirectories = [],
    limits = {},
    allowedMimeTypes = []
}) => {
    if (!fieldName) {
        throw new Error('fieldName is required to configure upload middleware');
    }

    const storage = createStorage(subdirectories);
    const fileFilter = getFileFilter(allowedMimeTypes);

    const uploader = multer({
        storage,
        limits: {
            fileSize:
                limits.fileSize ||
                parseInt(process.env.UPLOAD_MAX_FILE_SIZE || `${5 * 1024 * 1024}`, 10),
            files: maxCount
        },
        fileFilter: fileFilter || undefined
    });

    return maxCount > 1
        ? uploader.array(fieldName, maxCount)
        : uploader.single(fieldName);
};

const buildPublicPath = (absolutePath, overrideSegments = []) => {
    const fileName = path.basename(absolutePath);
    if (overrideSegments.length) {
        return path.join('uploads', ...overrideSegments, fileName);
    }

    const relative = path.relative(path.join(__dirname, '..'), absolutePath);
    return relative.startsWith('uploads')
        ? relative
        : path.join('uploads', path.basename(absolutePath));
};

const getFileUrl = (req, absolutePath, ...overrideSegments) => {
    const publicPath = buildPublicPath(absolutePath, overrideSegments);
    const normalized = publicPath.split(path.sep).join('/');
    const host = req.get('host');
    const protocol = req.protocol || 'http';

    return `${protocol}://${host}/${normalized.replace(/^\/+/, '')}`;
};

const deleteFile = (absolutePath) => {
    try {
        if (absolutePath && fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
            return true;
        }
    } catch (error) {
        console.error(`Failed to delete file ${absolutePath}:`, error.message);
    }
    return false;
};

module.exports = {
    createUploadMiddleware,
    getFileUrl,
    deleteFile
};

