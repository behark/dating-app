const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// Middleware to protect routes
router.use(authenticate);

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

// Get notifications list
router.get('/', notificationController.getNotifications);

// Mark notification as read
router.put('/:id/read', notificationController.markNotificationAsRead);

// Mark all notifications as read
router.put('/read-all', notificationController.markAllAsRead);

module.exports = router;
