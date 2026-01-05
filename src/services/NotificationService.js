import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

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
        console.log('Push notifications only work on physical devices');
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push notification permissions');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync();
      const tokenData = token.data;

      // Save token to user's profile
      await updateDoc(doc(db, 'users', userId), {
        pushToken: tokenData,
        notificationsEnabled: true,
      });

      console.log('Push notification token saved:', tokenData);
      return tokenData;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  static async sendNotification(toUserId, title, body, data = {}) {
    try {
      const userDoc = await getDoc(doc(db, 'users', toUserId));

      if (!userDoc.exists()) {
        console.log('User not found for notification');
        return;
      }

      const userData = userDoc.data();

      if (!userData.pushToken || !userData.notificationsEnabled) {
        console.log('User has no push token or notifications disabled');
        return;
      }

      const message = {
        to: userData.pushToken,
        sound: 'default',
        title,
        body,
        data,
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        console.error('Failed to send push notification:', response.status);
      }
    } catch (error) {
      console.error('Error sending push notification:', error);
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
      console.log(`Bulk notification sent to ${userIds.length} users`);
    } catch (error) {
      console.error('Error sending bulk notification:', error);
    }
  }

  static async disableNotifications(userId) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        notificationsEnabled: false,
      });
    } catch (error) {
      console.error('Error disabling notifications:', error);
    }
  }

  static async enableNotifications(userId) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        notificationsEnabled: true,
      });
    } catch (error) {
      console.error('Error enabling notifications:', error);
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
      console.log('Notification preferences updated');
    } catch (error) {
      console.error('Error updating notification preferences:', error);
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
      console.error('Error getting notification preferences:', error);
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
