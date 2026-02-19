const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { uploadProfilePhotos, handleUploadError } = require('../middleware/upload');
const StorageService = require('../../infrastructure/storage/StorageService');
const User = require('../../core/domain/User');
const { logger } = require('../../infrastructure/external/LoggingService');

/**
 * @route   POST /api/upload/photo
 * @desc    Upload a single photo to Cloudinary
 * @access  Private
 */
router.post(
  '/photo',
  authenticate,
  uploadProfilePhotos,
  handleUploadError,
  /** @returns {Promise<any>} */ async (/** @type {any} */ req, res) => {
    try {
      const userId = req.user._id;

      // Check if files were uploaded
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded',
        });
      }

      // Upload to Cloudinary
      const uploadResults = [];
      for (const file of req.files) {
        try {
          const result = await StorageService.upload(file, userId.toString(), 'image');
          uploadResults.push({
            success: true,
            url: result.url,
            publicId: result.publicId,
            thumbnailUrl: result.variants?.thumbnail,
          });
        } catch (/** @type {any} */ error) {
          logger.error('File upload error:', error);
          uploadResults.push({
            success: false,
            error: error.message,
            fileName: file.originalname,
          });
        }
      }

      // Filter successful uploads
      const successfulUploads = uploadResults.filter((r) => r.success);

      if (successfulUploads.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'All uploads failed',
          errors: uploadResults.filter((r) => !r.success),
        });
      }

      // Update user's photos
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Add new photos
      const newPhotos = successfulUploads.map((upload, index) => ({
        url: upload.url,
        order: user.photos.length + index,
        isPrimary: user.photos.length === 0 && index === 0,
        uploadedAt: new Date(),
      }));

      user.photos = [...user.photos, ...newPhotos].slice(0, 6); // Max 6 photos

      // If this is the first photo, set it as photoURL
      if (!user.photoURL && newPhotos.length > 0) {
        user.photoURL = newPhotos[0].url;
      }

      await user.save();

      res.status(200).json({
        success: true,
        message: `Successfully uploaded ${successfulUploads.length} photo(s)`,
        data: {
          photos: user.photos,
          photoURL: user.photoURL,
          uploadResults,
        },
      });
    } catch (/** @type {any} */ error) {
      logger.error('Upload endpoint error:', error);
      res.status(500).json({
        success: false,
        message: 'Error uploading photos',
        error: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/upload/signature
 * @desc    Get Cloudinary upload signature for direct client upload
 * @access  Private
 */
router.get('/signature', authenticate, async (/** @type {any} */ req, res) => {
  try {
    const userId = req.user._id;
    const signature = await StorageService.getUploadSignature(userId.toString(), 'image');

    res.json({
      success: true,
      data: signature,
    });
  } catch (/** @type {any} */ error) {
    logger.error('Signature generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating upload signature',
      error: error.message,
    });
  }
});

module.exports = router;
