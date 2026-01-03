const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  updateProfile,
  getProfile,
  getMyProfile,
  uploadPhotos,
  reorderPhotos,
  deletePhoto,
  approvePhoto,
  rejectPhoto,
  getPendingPhotos
} = require('../controllers/profileController');
const { authenticate } = require('../middleware/auth');
const { apiCache, invalidateUserCache } = require('../middleware/apiCache');

const router = express.Router();

// Helper middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({ field: err.param, message: err.msg }))
    });
  }
  next();
};

// Middleware to invalidate cache after profile updates
const invalidateCacheAfterUpdate = async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = async (data) => {
    if (res.statusCode >= 200 && res.statusCode < 300 && data?.success !== false) {
      const userId = req.user?._id || req.user?.id;
      if (userId) {
        await invalidateUserCache(userId);
      }
    }
    return originalJson(data);
  };
  next();
};

// Get user profile (public) - cached for 5 minutes
router.get('/:userId', apiCache('profile', 300), getProfile);

// Get my profile (private) - cached for 5 minutes
router.get('/me', authenticate, apiCache('profile', 300), getMyProfile);

// Update profile - invalidates cache
router.put('/update', authenticate, invalidateCacheAfterUpdate, [
  body('name').optional().trim().notEmpty(),
  body('age').optional().isInt({ min: 18, max: 100 }),
  body('gender').optional().isIn(['male', 'female', 'other']),
  body('bio').optional().isLength({ max: 500 })
], handleValidationErrors, updateProfile);

// Upload photos - invalidates cache
router.post('/photos/upload', authenticate, invalidateCacheAfterUpdate, [
  body('photos').isArray({ min: 1, max: 6 }).withMessage('Photos array must have 1-6 items'),
  body('photos.*.url').isURL().withMessage('Invalid photo URL')
], handleValidationErrors, uploadPhotos);

// Reorder photos
router.put('/photos/reorder', authenticate, [
  body('photoIds').isArray().withMessage('Photo IDs array is required')
], handleValidationErrors, reorderPhotos);

// Delete photo
router.delete('/photos/:photoId', authenticate, deletePhoto);

// Photo moderation (admin only)
router.put('/photos/:photoId/approve', authenticate, approvePhoto);
router.put('/photos/:photoId/reject', authenticate, [
  body('reason').optional().trim()
], handleValidationErrors, rejectPhoto);

// Get pending photos for moderation
router.get('/admin/photos/pending', authenticate, getPendingPhotos);

module.exports = router;
