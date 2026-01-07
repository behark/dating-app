const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendRateLimit,
  asyncHandler,
} = require('../utils/responseHelpers');
const User = require('../models/User');
const { logger } = require('../services/LoggingService');
const Notification = require('../models/Notification');
const Swipe = require('../models/Swipe');

// @route   PUT /api/notifications/preferences
// @desc    Update user notification preferences
// @access  Private
exports.updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      matchNotifications,
      messageNotifications,
      likeNotifications,
      systemNotifications,
      notificationFrequency,
      quietHours,
    } = req.body;

    // Validate frequency
    if (notificationFrequency && !['instant', 'daily', 'weekly'].includes(notificationFrequency)) {
      return sendError(res, 400, { message: 'Invalid notification frequency' });
    }

    // Build update object
    const updateData = {
      notificationPreferences: {
        matchNotifications: matchNotifications !== false,
        messageNotifications: messageNotifications !== false,
        likeNotifications: likeNotifications !== false,
        systemNotifications: systemNotifications !== false,
        notificationFrequency: notificationFrequency || 'instant',
        quietHours: quietHours || { enabled: false, start: '22:00', end: '08:00' },
        updatedAt: new Date(),
      },
    };

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: {
        preferences: user.notificationPreferences,
      },
    });
  } catch (error) {
    logger.error('Update notification preferences error:', {
      error: error.message,
      stack: error.stack,
    });
    sendError(res, 500, { message: 'Error updating notification preferences', error: error instanceof Error ? error.message : String(error), });
  }
};

// @route   GET /api/notifications/preferences
// @desc    Get user notification preferences
// @access  Private
exports.getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('notificationPreferences');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const preferences = user.notificationPreferences || {
      matchNotifications: true,
      messageNotifications: true,
      likeNotifications: true,
      systemNotifications: true,
      notificationFrequency: 'instant',
      quietHours: { enabled: false, start: '22:00', end: '08:00' },
    };

    res.json({
      success: true,
      data: { preferences },
    });
  } catch (error) {
    logger.error('Get notification preferences error:', {
      error: error.message,
      stack: error.stack,
    });
    sendError(res, 500, { message: 'Error fetching notification preferences', error: error instanceof Error ? error.message : String(error), });
  }
};

// @route   POST /api/notifications/send
// @desc    Send a notification to a user
// @access  Private (Admin or System)
exports.sendNotification = async (req, res) => {
  try {
    const { toUserId, type, title, message, data } = req.body;

    // Validate required fields
    if (!toUserId || !type || !title || !message) {
      return sendError(res, 400, { message: 'Missing required fields: toUserId, type, title, message' });
    }

    // Validate notification type
    const validTypes = ['match', 'message', 'like', 'system'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid notification type. Must be one of: ${validTypes.join(', ')}`,
      });
    }

    const user = await User.findById(toUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check notification preferences
    const prefs = user.notificationPreferences || {};
    let shouldSend = true;

    switch (type) {
      case 'match':
        shouldSend = prefs.matchNotifications !== false;
        break;
      case 'message':
        shouldSend = prefs.messageNotifications !== false;
        break;
      case 'like':
        shouldSend = prefs.likeNotifications !== false;
        break;
      case 'system':
        shouldSend = prefs.systemNotifications !== false;
        break;
    }

    if (!shouldSend) {
      return res.json({
        success: true,
        message: 'Notification not sent - user has this notification type disabled',
        data: { sent: false, reason: 'User disabled this notification type' },
      });
    }

    // Check quiet hours
    if (prefs.quietHours?.enabled && prefs.quietHours.start && prefs.quietHours.end) {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const [startHour, startMin] = prefs.quietHours.start.split(':').map(Number);
      const [endHour, endMin] = prefs.quietHours.end.split(':').map(Number);
      const [currentHour, currentMin] = currentTime.split(':').map(Number);

      const startTotalMin = startHour * 60 + startMin;
      const endTotalMin = endHour * 60 + endMin;
      const currentTotalMin = currentHour * 60 + currentMin;

      let withinQuietHours = false;
      if (startTotalMin <= endTotalMin) {
        withinQuietHours = currentTotalMin >= startTotalMin && currentTotalMin < endTotalMin;
      } else {
        withinQuietHours = currentTotalMin >= startTotalMin || currentTotalMin < endTotalMin;
      }

      if (withinQuietHours) {
        return res.json({
          success: true,
          message: 'Notification queued - within quiet hours',
          data: { sent: false, reason: 'User is in quiet hours', queued: true },
        });
      }
    }

    // In a real implementation, you would send the notification via Expo's push notification service
    // For now, we'll just log and return success
    console.log(
      `[NOTIFICATION] To: ${toUserId}, Type: ${type}, Title: ${title}, Message: ${message}`
    );

    // Store notification in database
    const notification = await Notification.create({
      userId: toUserId,
      type,
      title,
      message,
      data: data || {},
      isRead: false,
      priority: data?.priority || 'normal',
      actionUrl: data?.actionUrl || null,
      imageUrl: data?.imageUrl || null,
    });

    res.json({
      success: true,
      message: 'Notification sent successfully',
      data: { sent: true },
    });
  } catch (error) {
    logger.error('Send notification error:', { error: error.message, stack: error.stack });
    sendError(res, 500, { message: 'Error sending notification', error: error instanceof Error ? error.message : String(error), });
  }
};

// @route   POST /api/notifications/send-bulk
// @desc    Send notifications to multiple users
// @access  Private (Admin only)
exports.sendBulkNotification = async (req, res) => {
  try {
    const { userIds, type, title, message, data } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return sendError(res, 400, { message: 'Invalid userIds array' });
    }

    if (!type || !title || !message) {
      return sendError(res, 400, { message: 'Missing required fields: type, title, message' });
    }

    let successCount = 0;
    let failureCount = 0;
    const results = [];

    for (const userId of userIds) {
      try {
        const user = await User.findById(userId);
        if (!user) {
          failureCount++;
          results.push({ userId, success: false, reason: 'User not found' });
          continue;
        }

        // Check notification preferences
        const prefs = user.notificationPreferences || {};
        let shouldSend = true;

        switch (type) {
          case 'match':
            shouldSend = prefs.matchNotifications !== false;
            break;
          case 'message':
            shouldSend = prefs.messageNotifications !== false;
            break;
          case 'like':
            shouldSend = prefs.likeNotifications !== false;
            break;
          case 'system':
            shouldSend = prefs.systemNotifications !== false;
            break;
        }

        if (!shouldSend) {
          failureCount++;
          results.push({ userId, success: false, reason: 'User disabled this notification type' });
          continue;
        }

        successCount++;
        results.push({ userId, success: true });
      } catch (err) {
        failureCount++;
        results.push({
          userId,
          success: false,
          reason: err instanceof Error ? err.message : String(err),
        });
      }
    }

    res.json({
      success: true,
      message: `Bulk notification sent. Success: ${successCount}, Failures: ${failureCount}`,
      data: {
        successCount,
        failureCount,
        results,
      },
    });
  } catch (error) {
    logger.error('Send bulk notification error:', { error: error.message, stack: error.stack });
    sendError(res, 500, { message: 'Error sending bulk notification', error: error instanceof Error ? error.message : String(error), });
  }
};

// @route   PUT /api/notifications/enable
// @desc    Enable all notifications for user
// @access  Private
exports.enableNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        notificationPreferences: {
          matchNotifications: true,
          messageNotifications: true,
          likeNotifications: true,
          systemNotifications: true,
          notificationFrequency: 'instant',
          quietHours: { enabled: false, start: '22:00', end: '08:00' },
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'All notifications enabled',
      data: { preferences: user.notificationPreferences },
    });
  } catch (error) {
    logger.error('Enable notifications error:', { error: error.message, stack: error.stack });
    sendError(res, 500, { message: 'Error enabling notifications', error: error instanceof Error ? error.message : String(error), });
  }
};

// @route   PUT /api/notifications/disable
// @desc    Disable all notifications for user
// @access  Private
exports.disableNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        notificationPreferences: {
          matchNotifications: false,
          messageNotifications: false,
          likeNotifications: false,
          systemNotifications: false,
          notificationFrequency: 'instant',
          quietHours: { enabled: false, start: '22:00', end: '08:00' },
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'All notifications disabled',
      data: { preferences: user.notificationPreferences },
    });
  } catch (error) {
    logger.error('Disable notifications error:', { error: error.message, stack: error.stack });
    sendError(res, 500, { message: 'Error disabling notifications', error: error instanceof Error ? error.message : String(error), });
  }
};

// @route   GET /api/notifications
// @desc    Get user's notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, isRead, limit = 50, skip = 0 } = req.query;

    // Build query
    const query = {
      userId,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }], // Only non-expired
    };

    if (type) {
      query.type = type;
    }

    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    // Get notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    // Get total count for pagination
    const total = await Notification.countDocuments(query);

    // Get unread count
    // @ts-ignore - Static method exists on schema but TypeScript doesn't recognize it
    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: skip + notifications.length < total,
        },
        unreadCount,
      },
    });
  } catch (error) {
    logger.error('Get notifications error:', { error: error.message, stack: error.stack });
    sendError(res, 500, { message: 'Error fetching notifications', error: error instanceof Error ? error.message : String(error), });
  }
};

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
exports.markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      userId, // Ensure user owns this notification
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: { notification },
    });
  } catch (error) {
    logger.error('Mark notification as read error:', { error: error.message, stack: error.stack });
    sendError(res, 500, { message: 'Error marking notification as read', error: error instanceof Error ? error.message : String(error), });
  }
};

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    // @ts-ignore - Static method exists on schema but TypeScript doesn't recognize it
    const result = await Notification.markAllAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read',
      data: {
        updatedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    logger.error('Mark all notifications as read error:', {
      error: error.message,
      stack: error.stack,
    });
    sendError(res, 500, { message: 'Error marking all notifications as read', error: error instanceof Error ? error.message : String(error), });
  }
};
