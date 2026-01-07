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
const { authenticate, authorizeMatchedUsers } = require('../middleware/auth');

const router = express.Router();

// Helper middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // @ts-ignore - express-validator union type handling
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => {
        if ('path' in err) {
          return { field: err.path, message: err.msg };
        }
        return { field: 'unknown', message: err.msg };
      }),
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

// Get online status of a user - SECURITY: Requires auth and can only view matched users' status
router.get('/online-status/:userId', authenticate, authorizeMatchedUsers, getOnlineStatus);

// View a profile
router.post('/view-profile/:userId', authenticate, viewProfile);

// Get profile views (own profile)
router.get('/profile-views', authenticate, getProfileViews);

// Get status for multiple users - SECURITY: Requires authentication
// Note: The controller should filter to only return status for matched users
router.post(
  '/status',
  authenticate,
  [body('userIds').isArray().withMessage('userIds must be an array')],
  handleValidationErrors,
  getMultipleStatus
);

// Heartbeat to keep user active
router.post('/heartbeat', authenticate, heartbeat);

module.exports = router;
