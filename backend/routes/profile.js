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

// Get user profile (public)
router.get('/:userId', getProfile);

// Get my profile (private)
router.get('/me', authenticate, getMyProfile);

// Update profile
router.put('/update', authenticate, [
  body('name').optional().trim().notEmpty(),
  body('age').optional().isInt({ min: 18, max: 100 }),
  body('gender').optional().isIn(['male', 'female', 'other']),
  body('bio').optional().isLength({ max: 500 })
], handleValidationErrors, updateProfile);

// Upload photos
router.post('/photos/upload', authenticate, [
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
