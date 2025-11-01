# 📁 Uploads Directory

This directory contains all uploaded files for the Ayurvedic E-commerce application.

## 📂 Directory Structure

```
uploads/
├── products/                    # Product-related files
│   ├── gallery/                 # Product gallery images
│   │   └── 2025-09-28/         # Date-based subfolders
│   └── thumbnails/              # Product thumbnail images
│       └── 2025-09-28/
├── categories/                  # Category-related files
│   └── icons/                   # Category icons
│       └── 2025-09-28/
├── users/                       # User-related files
│   ├── avatars/                 # User profile pictures
│   │   └── 2025-09-28/
│   └── documents/               # User documents
│       └── 2025-09-28/
├── general/                     # General files
│   ├── temp/                    # Temporary files
│   │   └── 2025-09-28/
│   └── archived/                # Archived files
│       └── 2025-09-28/
├── invoices/                    # Invoice files
│   └── 2025-09-28/
├── exports/                     # Export files
│   └── 2025-09-28/
├── temp/                        # System temporary files
└── backups/                     # Backup files
```

## 🎯 Purpose of Each Directory

### Products
- **gallery/**: High-resolution product images for product pages
- **thumbnails/**: Optimized thumbnail images for product listings

### Categories
- **icons/**: Category icons and images for navigation

### Users
- **avatars/**: User profile pictures
- **documents/**: User-uploaded documents (ID proofs, prescriptions, etc.)

### General
- **temp/**: Temporary files during processing
- **archived/**: Old files that are archived but not deleted

### System
- **invoices/**: Generated invoice PDFs
- **exports/**: Data export files (Excel, CSV)
- **temp/**: System temporary files
- **backups/**: Backup files

## 📅 Date-Based Organization

Files are automatically organized by upload date in `YYYY-MM-DD` format. This helps with:
- Easy file management
- Automatic cleanup of old files
- Better performance with large numbers of files
- Organized backup strategies

## 🔒 Security Notes

- Files are validated before upload
- Only allowed file types are accepted
- File size limits are enforced
- Access is controlled through authentication
- Files are served through the API with proper headers

## 🧹 Maintenance

- Old files can be automatically cleaned
- File statistics are available through the API
- Directory sizes can be monitored
- Backup strategies can be implemented per directory

## 📊 Monitoring

Use the file management API endpoints to monitor:
- Total file count and size
- Files per directory
- Directory statistics
- File access patterns

For more details, see the [FOLDER_STRUCTURE.md](../docs/FOLDER_STRUCTURE.md) documentation.
