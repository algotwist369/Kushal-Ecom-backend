# 📁 File Upload Folder Structure

This document describes the organized folder structure for file uploads in the Ayurvedic E-commerce backend.

## 🗂️ Main Directory Structure

```
uploads/
├── products/                    # Product-related files
│   ├── gallery/                 # Product gallery images
│   │   └── 2024-01-15/         # Date-based subfolders
│   │       ├── prod-product-name-1234567890-123456789.jpg
│   │       └── prod-product-name-1234567890-123456790.jpg
│   └── thumbnails/              # Product thumbnail images
│       └── 2024-01-15/
│           └── prod-thumbnail-1234567890-123456789.jpg
├── categories/                  # Category-related files
│   └── icons/                   # Category icons
│       └── 2024-01-15/
│           └── cat-category-name-1234567890-123456789.jpg
├── users/                       # User-related files
│   ├── avatars/                 # User profile pictures
│   │   └── 2024-01-15/
│   │       └── user-avatar-1234567890-123456789.jpg
│   └── documents/               # User documents
│       └── 2024-01-15/
│           └── user-document-1234567890-123456789.pdf
├── general/                     # General files
│   ├── temp/                    # Temporary files
│   │   └── 2024-01-15/
│   └── archived/                # Archived files
│       └── 2024-01-15/
├── invoices/                    # Invoice files
│   └── 2024-01-15/
│       └── invoice-1234567890-123456789.pdf
├── exports/                     # Export files
│   └── 2024-01-15/
│       └── export-1234567890-123456789.xlsx
├── temp/                        # Temporary files
└── backups/                     # Backup files
```

## 📋 File Naming Convention

### Format: `{prefix}-{name}-{timestamp}-{random}.{extension}`

- **prefix**: Content type identifier
  - `prod-` for products
  - `cat-` for categories
  - `user-` for users
  - `gen-` for general files
  - `inv-` for invoices
  - `exp-` for exports

- **name**: Cleaned original filename (special characters replaced with hyphens)
- **timestamp**: Unix timestamp in milliseconds
- **random**: 9-digit random number
- **extension**: Original file extension

### Examples:
- `prod-ayurvedic-churna-1704067200000-123456789.jpg`
- `cat-herbal-medicines-1704067200000-987654321.png`
- `user-profile-picture-1704067200000-456789123.jpg`

## 🗓️ Date-Based Organization

Files are organized by upload date in `YYYY-MM-DD` format:
- **2024-01-15/**: Files uploaded on January 15, 2024
- **2024-01-16/**: Files uploaded on January 16, 2024
- **2024-02-01/**: Files uploaded on February 1, 2024

## 📊 Content Type Folders

### Products (`/uploads/products/`)
- **gallery/**: High-resolution product images
- **thumbnails/**: Optimized thumbnail images

### Categories (`/uploads/categories/`)
- **icons/**: Category icons and images

### Users (`/uploads/users/`)
- **avatars/**: User profile pictures
- **documents/**: User-uploaded documents

### General (`/uploads/general/`)
- **temp/**: Temporary files
- **archived/**: Archived files

### System (`/uploads/`)
- **invoices/**: Generated invoice PDFs
- **exports/**: Data export files
- **temp/**: System temporary files
- **backups/**: Backup files

## 🔗 URL Structure

Files are accessible via URLs:
```
https://yourdomain.com/uploads/products/gallery/2024-01-15/prod-product-name-1234567890-123456789.jpg
https://yourdomain.com/uploads/categories/icons/2024-01-15/cat-category-name-1234567890-123456789.jpg
https://yourdomain.com/uploads/users/avatars/2024-01-15/user-avatar-1234567890-123456789.jpg
```

## 🛠️ API Endpoints

### Upload Endpoints
- `POST /v1/api/upload/products` - Upload product images
- `POST /v1/api/upload/products/thumbnails` - Upload product thumbnails
- `POST /v1/api/upload/categories` - Upload category images
- `POST /v1/api/upload/users/avatar` - Upload user avatar
- `POST /v1/api/upload/users/documents` - Upload user documents
- `POST /v1/api/upload/general` - Upload general files
- `POST /v1/api/upload/invoices` - Upload invoice files (Admin)
- `POST /v1/api/upload/exports` - Upload export files (Admin)

### File Management Endpoints
- `GET /v1/api/files/stats` - Get upload statistics
- `GET /v1/api/files/directory/:directory` - Get files in directory
- `GET /v1/api/files/file/:directory/:filename` - Get file info
- `DELETE /v1/api/files/file/:directory/:filename` - Delete file
- `POST /v1/api/files/clean` - Clean old files

## 🧹 Maintenance

### Automatic Cleanup
- Old files can be automatically cleaned based on age
- Default cleanup removes files older than 30 days
- Configurable cleanup periods

### File Size Limits
- Maximum file size: 10MB (configurable)
- Maximum files per upload: 10 (configurable)
- Allowed file types: JPEG, JPG, PNG, GIF, WEBP

### Security
- File type validation
- File size limits
- Secure filename generation
- Access control via authentication

## 📈 Benefits

1. **Organization**: Clear separation by content type and date
2. **Scalability**: Date-based folders prevent single directory overload
3. **Maintenance**: Easy to clean old files and manage storage
4. **Performance**: Optimized for file serving and caching
5. **Security**: Controlled access and file validation
6. **Backup**: Easy to backup specific content types
7. **Analytics**: Easy to track file usage by type and date
