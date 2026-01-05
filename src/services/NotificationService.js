import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import logger from '../utils/logger';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  static async registerForPushNotifications(userId) {
    try {
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

      // Save token to user's profile
      await updateDoc(doc(db, 'users', userId), {
        pushToken: tokenData,
        notificationsEnabled: true,
      });

      logger.info('Push notification token saved', { userId, tokenData });
      return tokenData;
    } catch (error) {
      logger.error('Error registering for push notifications', error, { userId });
      return null;
    }
  }

  static async sendNotification(toUserId, title, body, data = {}) {
    try {
      const userDoc = await getDoc(doc(db, 'users', toUserId));

      if (!userDoc.exists()) {
        logger.warn('User not found for notification', { toUserId });
        return;
      }

      const userData = userDoc.data();

      if (!userData.pushToken || !userData.notificationsEnabled) {
        logger.debug('User has no push token or notifications disabled', { toUserId });
        return;
      }

      const message = {
        to: userData.pushToken,
        sound: 'default',
        title,
        body,
        data,
      };

      const expoPushUrl = process.env.EXPO_PUBLIC_EXPO_PUSH_URL || 'https://exp.host/--/api/v2/push/send';
      const response = await fetch(expoPushUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        logger.error('Failed to send push notification', null, { toUserId, status: response.status, title });
      }
    } catch (error) {
      logger.error('Error sending push notification', error, { toUserId, title });
    }
  }

  static async sendMatchNotification(matchedUserId, matcherName) {
    await this.sendNotification(
      matchedUserId,
      "🎉 It's a Match!",
      `You and ${matcherName} liked each other!`,
      { type: 'match', matcherName }
    );
  }

  static async sendLikeNotification(likedUserId, likerName) {
    await this.sendNotification(likedUserId, '💗 New Like!', `${likerName} liked your profile!`, {
      type: 'like',
      likerName,
    });
  }

  static async sendMessageNotification(toUserId, fromName, message) {
    await this.sendNotification(
      toUserId,
      `💬 ${fromName}`,
      message.length > 50 ? `${message.substring(0, 50)}...` : message,
      { type: 'message', fromName, message }
    );
  }

  static async sendSystemNotification(toUserId, title, message, data = {}) {
    await this.sendNotification(toUserId, title, message, { type: 'system', ...data });
  }

  static async sendBulkNotification(userIds, title, body, data = {}) {
    try {
      for (const userId of userIds) {
        await this.sendNotification(userId, title, body, data);
      }
      logger.info('Bulk notification sent', { count: userIds.length, title });
    } catch (error) {
      logger.error('Error sending bulk notification', error, { userIds: userIds.length, title });
    }
  }

  static async disableNotifications(userId) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        notificationsEnabled: false,
      });
    } catch (error) {
      logger.error('Error disabling notifications', error, { userId });
    }
  }

  static async enableNotifications(userId) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        notificationsEnabled: true,
      });
    } catch (error) {
      logger.error('Error enabling notifications', error, { userId });
    }
  }

  static async updateNotificationPreferences(userId, preferences) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        preferences: {
          matchNotifications: preferences.matchNotifications !== false,
          messageNotifications: preferences.messageNotifications !== false,
          likeNotifications: preferences.likeNotifications !== false,
          systemNotifications: preferences.systemNotifications !== false,
          notificationFrequency: preferences.notificationFrequency || 'instant', // 'instant', 'daily', 'weekly'
          quietHours: preferences.quietHours || { enabled: false, start: '22:00', end: '08:00' },
        },
      });
      logger.debug('Notification preferences updated', { userId });
    } catch (error) {
      logger.error('Error updating notification preferences', error, { userId });
    }
  }

  static async getNotificationPreferences(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();

      return {
        matchNotifications: userData?.preferences?.matchNotifications !== false,
        messageNotifications: userData?.preferences?.messageNotifications !== false,
        likeNotifications: userData?.preferences?.likeNotifications !== false,
        systemNotifications: userData?.preferences?.systemNotifications !== false,
        notificationFrequency: userData?.preferences?.notificationFrequency || 'instant',
        quietHours: userData?.preferences?.quietHours || {
          enabled: false,
          start: '22:00',
          end: '08:00',
        },
      };
    } catch (error) {
      logger.error('Error getting notification preferences', error, { userId });
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
