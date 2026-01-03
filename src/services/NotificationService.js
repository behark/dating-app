import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
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
          'Accept': 'application/json',
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
      '🎉 It\'s a Match!',
      `You and ${matcherName} liked each other!`,
      { type: 'match', matcherName }
    );
  }

  static async sendMessageNotification(toUserId, fromName, message) {
    await this.sendNotification(
      toUserId,
      `💬 ${fromName}`,
      message.length > 50 ? `${message.substring(0, 50)}...` : message,
      { type: 'message', fromName, message }
    );
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
}