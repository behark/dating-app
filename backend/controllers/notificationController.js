const { sendSuccess, sendError, sendValidationError, sendNotFound, sendUnauthorized, sendForbidden, sendRateLimit, asyncHandler } = require("../utils/responseHelpers");
const User = require('../models/User');

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
      return res.status(400).json({
        success: false,
        message: 'Invalid notification frequency',
      });
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
    console.error('Update notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification preferences',
      error: error instanceof Error ? error.message : String(error),
    });
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
    console.error('Get notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notification preferences',
      error: error instanceof Error ? error.message : String(error),
    });
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
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: toUserId, type, title, message',
      });
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
    if (prefs.quietHours?.enabled) {
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

    // Store notification in database if needed
    // await Notification.create({
    //   toUserId,
    //   type,
    //   title,
    //   message,
    //   data,
    //   read: false,
    //   createdAt: new Date()
    // });

    res.json({
      success: true,
      message: 'Notification sent successfully',
      data: { sent: true },
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending notification',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @route   POST /api/notifications/send-bulk
// @desc    Send notifications to multiple users
// @access  Private (Admin only)
exports.sendBulkNotification = async (req, res) => {
  try {
    const { userIds, type, title, message, data } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid userIds array',
      });
    }

    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: type, title, message',
      });
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
        results.push({ userId, success: false, reason: (err instanceof Error ? err.message : String(err)) });
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
    console.error('Send bulk notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending bulk notification',
      error: error instanceof Error ? error.message : String(error),
    });
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
    console.error('Enable notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error enabling notifications',
      error: error instanceof Error ? error.message : String(error),
    });
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
    console.error('Disable notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error disabling notifications',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
