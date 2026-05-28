const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { requireAuth, getCurrentUser } = require('../middleware/clerk-auth');
const { getAppwriteService } = require('../config/appwrite');
const { captureException, addBreadcrumb } = require('../config/sentry');

const appwrite = getAppwriteService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'text/plain', 'image/png', 'image/jpeg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

/**
 * POST /api/v1/files/upload
 * Upload file to storage
 */
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const user = getCurrentUser(req);
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        message: 'Please provide a file to upload',
      });
    }

    addBreadcrumb({ 
      message: `Uploading file: ${req.file.originalname}`, 
      category: 'files',
      data: { size: req.file.size, mimetype: req.file.mimetype },
    });

    const bucketName = req.body.bucket || 'uploads';
    
    // Upload to Appwrite
    const uploaded = await appwrite.uploadFile({
      bucketName,
      filePath: req.file.path,
      fileId: req.file.filename,
    });

    const downloadUrl = appwrite.getFileDownload({ bucketName, fileId: uploaded.$id });
    const previewUrl = appwrite.getFilePreview({ bucketName, fileId: uploaded.$id });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        id: uploaded.$id,
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        downloadUrl,
        previewUrl,
      },
    });
  } catch (error) {
    captureException(error, { context: 'upload_file' });
    res.status(500).json({
      error: 'File upload failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/files/:id/download
 * Get file download URL
 */
router.get('/:id/download', requireAuth, (req, res) => {
  try {
    const bucketName = req.query.bucket || 'uploads';
    addBreadcrumb({ message: `Downloading file ${req.params.id}`, category: 'files' });

    const downloadUrl = appwrite.getFileDownload({
      bucketName,
      fileId: req.params.id,
    });

    res.json({
      success: true,
      downloadUrl,
    });
  } catch (error) {
    captureException(error, { context: 'download_file', fileId: req.params.id });
    res.status(500).json({
      error: 'Failed to get download link',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/files/:id/preview
 * Get file preview URL
 */
router.get('/:id/preview', requireAuth, (req, res) => {
  try {
    const bucketName = req.query.bucket || 'uploads';
    const width = req.query.width || 400;
    const height = req.query.height || 300;

    addBreadcrumb({ message: `Previewing file ${req.params.id}`, category: 'files' });

    const previewUrl = appwrite.getFilePreview({
      bucketName,
      fileId: req.params.id,
    });

    res.json({
      success: true,
      previewUrl,
    });
  } catch (error) {
    captureException(error, { context: 'preview_file', fileId: req.params.id });
    res.status(500).json({
      error: 'Failed to get preview',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/v1/files/:id
 * Delete file
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const bucketName = req.query.bucket || 'uploads';

    addBreadcrumb({ message: `Deleting file ${req.params.id}`, category: 'files' });

    await appwrite.deleteFile({
      bucketName,
      fileId: req.params.id,
    });

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    captureException(error, { context: 'delete_file', fileId: req.params.id });
    res.status(500).json({
      error: 'Failed to delete file',
      message: error.message,
    });
  }
});

module.exports = router;
