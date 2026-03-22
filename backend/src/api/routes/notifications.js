const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { authenticate, isAdmin } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// Helper middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
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

// Middleware to protect routes
router.use(authenticate);

// Get notification preferences
router.get('/preferences', notificationController.getNotificationPreferences);

// Update notification preferences
router.put(
  '/preferences',
  [
    body('matchNotifications').optional().isBoolean(),
    body('messageNotifications').optional().isBoolean(),
    body('likeNotifications').optional().isBoolean(),
    body('systemNotifications').optional().isBoolean(),
    body('notificationFrequency').optional().isIn(['instant', 'daily', 'weekly']),
  ],
  handleValidationErrors,
  notificationController.updateNotificationPreferences
);

// Send notification to a single user (admin only)
router.post(
  '/send',
  isAdmin,
  [
    body('toUserId').isMongoId().withMessage('Invalid user ID format'),
    body('type')
      .isIn(['match', 'message', 'like', 'system'])
      .withMessage('Invalid notification type'),
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
    body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 1000 }),
  ],
  handleValidationErrors,
  notificationController.sendNotification
);

// Send bulk notifications to multiple users (admin only)
router.post(
  '/send-bulk',
  isAdmin,
  [
    body('userIds')
      .isArray({ min: 1, max: 1000 })
      .withMessage('userIds must be an array with 1-1000 items'),
    body('userIds.*').isMongoId().withMessage('Invalid user ID format in array'),
    body('type')
      .isIn(['match', 'message', 'like', 'system'])
      .withMessage('Invalid notification type'),
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
    body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 1000 }),
  ],
  handleValidationErrors,
  notificationController.sendBulkNotification
);

// Enable all notifications
router.put('/enable', notificationController.enableNotifications);

// Disable all notifications
router.put('/disable', notificationController.disableNotifications);

// Get notifications list
router.get(
  '/',
  [
    query('type').optional().isIn(['match', 'message', 'like', 'system']),
    query('isRead').optional().isIn(['true', 'false']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('skip').optional().isInt({ min: 0 }),
  ],
  handleValidationErrors,
  notificationController.getNotifications
);

// Mark notification as read
router.put(
  '/:id/read',
  [param('id').isMongoId().withMessage('Invalid notification ID format')],
  handleValidationErrors,
  notificationController.markNotificationAsRead
);

// Mark all notifications as read
router.put('/read-all', notificationController.markAllAsRead);

module.exports = router;
