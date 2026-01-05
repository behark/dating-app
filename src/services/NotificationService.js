import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import api from './api';
import logger from '../utils/logger';

// Only set notification handler on native platforms (not web)
// This prevents the warning: "Listening to push token changes is not yet fully supported on web"
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export class NotificationService {
  /**
   * Register for push notifications and save token to backend
   * @param {string} userId - User ID
   * @returns {Promise<string|null>} Push token or null if failed
   */
  static async registerForPushNotifications(userId) {
    try {
      // On web, push notifications require VAPID key setup
      // Skip registration on web to avoid errors
      if (Platform.OS === 'web') {
        logger.debug('Push notifications on web require VAPID key setup, skipping registration');
        return null;
      }

      if (!Device.isDevice) {
        logger.warn('Push notifications only work on physical devices');
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        logger.warn('Failed to get push notification permissions', { userId, finalStatus });
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync();
      const tokenData = token.data;

      // Save token to backend via API
      try {
        // Use profile update endpoint to save push token
        // Backend handles pushToken field in profile updates
        const response = await api.put('/profile/update', {
          pushToken: tokenData,
          notificationsEnabled: true,
        });

        if (response.data?.success) {
          logger.info('Push notification token saved to backend', { userId, tokenData });
        } else {
          logger.warn('Push token save returned unsuccessful', {
            userId,
            response: response.data,
          });
        }
      } catch (apiError) {
        logger.error('Error saving push token to backend', apiError, { userId });
        // Return token anyway - app can still function, but backend won't have it
        return tokenData;
      }

      return tokenData;
    } catch (error) {
      logger.error('Error registering for push notifications', error, { userId });
      return null;
    }
  }

  /**
   * Send notification through backend API
   * @param {string} toUserId - Target user ID
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {Object} data - Additional notification data
   * @returns {Promise<void>}
   */
  static async sendNotification(toUserId, title, body, data = {}) {
    try {
      // Determine notification type from data or default to 'system'
      const type = data.type || 'system';

      // Send notification through backend API
      const response = await api.post('/notifications/send', {
        toUserId,
        type,
        title,
        message: body,
        data,
      });

      if (response.data?.success) {
        logger.debug('Notification sent via backend', { toUserId, type, title });
      } else {
        logger.warn('Backend notification send returned unsuccessful', {
          toUserId,
          response: response.data,
        });
      }
    } catch (error) {
      logger.error('Error sending notification via backend', error, { toUserId, title });
      // Don't throw - notifications are non-critical
    }
  }

  /**
   * Send match notification
   * @param {string} matchedUserId - User who was matched with
   * @param {string} matcherName - Name of the person who matched
   * @returns {Promise<void>}
   */
  static async sendMatchNotification(matchedUserId, matcherName) {
    await this.sendNotification(
      matchedUserId,
      "🎉 It's a Match!",
      `You and ${matcherName} liked each other!`,
      { type: 'match', matcherName }
    );
  }

  /**
   * Send like notification
   * @param {string} likedUserId - User who was liked
   * @param {string} likerName - Name of the person who liked
   * @returns {Promise<void>}
   */
  static async sendLikeNotification(likedUserId, likerName) {
    await this.sendNotification(likedUserId, '💗 New Like!', `${likerName} liked your profile!`, {
      type: 'like',
      likerName,
    });
  }

  /**
   * Send message notification
   * @param {string} toUserId - Recipient user ID
   * @param {string} fromName - Sender name
   * @param {string} message - Message content
   * @returns {Promise<void>}
   */
  static async sendMessageNotification(toUserId, fromName, message) {
    await this.sendNotification(
      toUserId,
      `💬 ${fromName}`,
      message.length > 50 ? `${message.substring(0, 50)}...` : message,
      { type: 'message', fromName, message }
    );
  }

  /**
   * Send system notification
   * @param {string} toUserId - Target user ID
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} data - Additional data
   * @returns {Promise<void>}
   */
  static async sendSystemNotification(toUserId, title, message, data = {}) {
    await this.sendNotification(toUserId, title, message, { type: 'system', ...data });
  }

  /**
   * Send bulk notifications (admin/system use)
   * @param {string[]} userIds - Array of user IDs
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {Object} data - Additional data
   * @returns {Promise<void>}
   */
  static async sendBulkNotification(userIds, title, body, data = {}) {
    try {
      const response = await api.post('/notifications/send-bulk', {
        userIds,
        type: data.type || 'system',
        title,
        message: body,
        data,
      });

      if (response.data?.success) {
        logger.info('Bulk notification sent via backend', {
          count: userIds.length,
          title,
          successCount: response.data.data?.successCount,
          failureCount: response.data.data?.failureCount,
        });
      }
    } catch (error) {
      logger.error('Error sending bulk notification via backend', error, {
        userIds: userIds.length,
        title,
      });
    }
  }

  /**
   * Disable all notifications via backend API
   * @param {string} userId - User ID (optional, uses authenticated user from API)
   * @returns {Promise<void>}
   */
  static async disableNotifications(userId) {
    try {
      await api.put('/notifications/disable');
      logger.debug('Notifications disabled via backend', { userId });
    } catch (error) {
      logger.error('Error disabling notifications via backend', error, { userId });
      throw error;
    }
  }

  /**
   * Enable all notifications via backend API
   * @param {string} userId - User ID (optional, uses authenticated user from API)
   * @returns {Promise<void>}
   */
  static async enableNotifications(userId) {
    try {
      await api.put('/notifications/enable');
      logger.debug('Notifications enabled via backend', { userId });
    } catch (error) {
      logger.error('Error enabling notifications via backend', error, { userId });
      throw error;
    }
  }

  /**
   * Update notification preferences via backend API
   * @param {string} userId - User ID (optional, uses authenticated user from API)
   * @param {Object} preferences - Notification preferences
   * @returns {Promise<Object>} Updated preferences
   */
  static async updateNotificationPreferences(userId, preferences) {
    try {
      const response = await api.put('/notifications/preferences', preferences);

      if (response.data?.success) {
        logger.debug('Notification preferences updated via backend', {
          userId,
          preferences: response.data.data?.preferences,
        });
        return response.data.data?.preferences || preferences;
      }

      throw new Error(response.data?.message || 'Failed to update preferences');
    } catch (error) {
      logger.error('Error updating notification preferences via backend', error, { userId });
      throw error;
    }
  }

  /**
   * Get notification preferences from backend API
   * @param {string} userId - User ID (optional, uses authenticated user from API)
   * @returns {Promise<Object>} Notification preferences
   */
  static async getNotificationPreferences(userId) {
    try {
      const response = await api.get('/notifications/preferences');

      if (response.data?.success && response.data.data?.preferences) {
        const prefs = response.data.data.preferences;
        return {
          matchNotifications: prefs.matchNotifications !== false,
          messageNotifications: prefs.messageNotifications !== false,
          likeNotifications: prefs.likeNotifications !== false,
          systemNotifications: prefs.systemNotifications !== false,
          notificationFrequency: prefs.notificationFrequency || 'instant',
          quietHours: prefs.quietHours || {
            enabled: false,
            start: '22:00',
            end: '08:00',
          },
        };
      }

      // Return defaults if backend doesn't have preferences
      return {
        matchNotifications: true,
        messageNotifications: true,
        likeNotifications: true,
        systemNotifications: true,
        notificationFrequency: 'instant',
        quietHours: { enabled: false, start: '22:00', end: '08:00' },
      };
    } catch (error) {
      logger.error('Error getting notification preferences from backend', error, { userId });
      // Return defaults on error
      return {
        matchNotifications: true,
        messageNotifications: true,
        likeNotifications: true,
        systemNotifications: true,
        notificationFrequency: 'instant',
        quietHours: { enabled: false, start: '22:00', end: '08:00' },
      };
    }
  }

  /**
   * Check if current time is within quiet hours
   * @param {Object} quietHours - Quiet hours configuration
   * @returns {boolean} True if within quiet hours
   */
  static isWithinQuietHours(quietHours) {
    if (!quietHours?.enabled) return false;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const [startHour, startMin] = quietHours.start.split(':').map(Number);
    const [endHour, endMin] = quietHours.end.split(':').map(Number);
    const [currentHour, currentMin] = currentTime.split(':').map(Number);

    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;
    const currentTotalMin = currentHour * 60 + currentMin;

    if (startTotalMin <= endTotalMin) {
      return currentTotalMin >= startTotalMin && currentTotalMin < endTotalMin;
    } else {
      return currentTotalMin >= startTotalMin || currentTotalMin < endTotalMin;
    }
  }
}
