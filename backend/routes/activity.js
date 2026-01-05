const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  updateOnlineStatus,
  getOnlineStatus,
  viewProfile,
  getProfileViews,
  getMultipleStatus,
  heartbeat,
} = require('../controllers/activityController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Helper middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({ field: err.param, message: err.msg })),
    });
  }
  next();
};

// Update online status
router.post(
  '/update-online-status',
  authenticate,
  [body('isOnline').isBoolean().withMessage('isOnline must be a boolean')],
  handleValidationErrors,
  updateOnlineStatus
);

// Get online status of a user
router.get('/online-status/:userId', getOnlineStatus);

// View a profile
router.post('/view-profile/:userId', authenticate, viewProfile);

// Get profile views (own profile)
router.get('/profile-views', authenticate, getProfileViews);

// Get status for multiple users
router.post(
  '/status',
  [body('userIds').isArray().withMessage('userIds must be an array')],
  handleValidationErrors,
  getMultipleStatus
);

// Heartbeat to keep user active
router.post('/heartbeat', authenticate, heartbeat);

module.exports = router;
