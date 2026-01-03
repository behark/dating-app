const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// Middleware to protect routes
router.use(authenticateToken);

// Get notification preferences
router.get('/preferences', notificationController.getNotificationPreferences);

// Update notification preferences
router.put('/preferences', notificationController.updateNotificationPreferences);

// Send notification to a single user
router.post('/send', notificationController.sendNotification);

// Send bulk notifications to multiple users
router.post('/send-bulk', notificationController.sendBulkNotification);

// Enable all notifications
router.put('/enable', notificationController.enableNotifications);

// Disable all notifications
router.put('/disable', notificationController.disableNotifications);

module.exports = router;
