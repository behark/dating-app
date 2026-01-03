/**
 * File Upload Middleware
 * Handles multipart form data using multer
 */

const multer = require('multer');
const path = require('path');

// File type validation
const fileFilter = (allowedTypes) => (req, file, cb) => {
  const isAllowed = allowedTypes.some(type => {
    if (type.includes('*')) {
      const [mainType] = type.split('/');
      return file.mimetype.startsWith(mainType);
    }
    return file.mimetype === type;
  });

  if (isAllowed) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

// Image upload configuration
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 6, // Max 6 images
  },
  fileFilter: fileFilter([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
  ]),
});

// Video upload configuration
const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 3, // Max 3 videos
  },
  fileFilter: fileFilter([
    'video/mp4',
    'video/quicktime',
    'video/webm',
  ]),
});

// Document upload configuration
const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
  fileFilter: fileFilter([
    'application/pdf',
    'image/jpeg',
    'image/png',
  ]),
});

// Generic file upload
const genericUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
    files: 10,
  },
});

// Middleware for single image upload
const uploadSingleImage = imageUpload.single('image');

// Middleware for multiple image uploads
const uploadMultipleImages = imageUpload.array('images', 6);

// Middleware for profile photos (specific field name)
const uploadProfilePhotos = imageUpload.array('photos', 6);

// Middleware for single video upload
const uploadSingleVideo = videoUpload.single('video');

// Middleware for multiple video uploads
const uploadMultipleVideos = videoUpload.array('videos', 3);

// Middleware for verification document
const uploadVerificationDoc = documentUpload.single('document');

// Middleware for chat media (images or videos)
const uploadChatMedia = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
    files: 5,
  },
  fileFilter: fileFilter([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
  ]),
}).array('media', 5);

// Error handler middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large',
        error: err.code,
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files',
        error: err.code,
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name',
        error: err.code,
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
      error: err.code,
    });
  }
  
  if (err.message && err.message.includes('File type')) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  
  next(err);
};

module.exports = {
  imageUpload,
  videoUpload,
  documentUpload,
  genericUpload,
  uploadSingleImage,
  uploadMultipleImages,
  uploadProfilePhotos,
  uploadSingleVideo,
  uploadMultipleVideos,
  uploadVerificationDoc,
  uploadChatMedia,
  handleUploadError,
};
