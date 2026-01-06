import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * NotificationService
 * Handles push notifications registration and management
 *
 * Note: This requires installation of expo-notifications:
 * npx expo install expo-notifications expo-device
 */

let Notifications = null;
let Device = null;

// Try to import expo-notifications if available
try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
} catch (error) {
  console.warn('expo-notifications not installed. Push notifications will not work.');
}

// Configure notification handling behavior
if (Notifications) {
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
   * Register for push notifications
   * @returns {Promise<string|null>} Expo push token or null if failed
   */
  static async registerForPushNotifications() {
    if (!Notifications || !Device) {
      console.log('Push notifications not available: libraries not installed');
      return null;
    }

    // Push notifications only work on physical devices
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    try {
      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push notification permissions');
        return null;
      }

      // Get Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId || projectId === 'your-project-id') {
        console.warn('EAS project ID not configured. Set EAS_PROJECT_ID in your environment.');
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      const token = tokenData.data;

      // Configure Android notification channels
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      console.log('Push notification token:', token);
      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Setup Android notification channels
   */
  static async setupAndroidChannels() {
    if (!Notifications || Platform.OS !== 'android') {
      return;
    }

    try {
      // Default channel
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#667eea',
      });

      // Messages channel
      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      // Matches channel
      await Notifications.setNotificationChannelAsync('matches', {
        name: 'New Matches',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500],
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      // Likes channel
      await Notifications.setNotificationChannelAsync('likes', {
        name: 'Likes',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        sound: 'default',
        showBadge: true,
      });

      console.log('Android notification channels configured');
    } catch (error) {
      console.error('Error setting up Android channels:', error);
    }
  }

  /**
   * Setup notification listeners
   * @param {Function} onNotification - Called when notification is received while app is foregrounded
   * @param {Function} onNotificationResponse - Called when user taps on notification
   * @returns {Function} Cleanup function to remove listeners
   */
  static setupNotificationListeners(onNotification, onNotificationResponse) {
    if (!Notifications) {
      return () => {}; // Return no-op cleanup function
    }

    // Notification received while app is in foreground
    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      if (onNotification) {
        onNotification(notification);
      }
    });

    // User tapped on notification
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      if (onNotificationResponse) {
        onNotificationResponse(response);
      }
    });

    // Return cleanup function
    return () => {
      if (notificationListener) {
        Notifications.removeNotificationSubscription(notificationListener);
      }
      if (responseListener) {
        Notifications.removeNotificationSubscription(responseListener);
      }
    };
  }

  /**
   * Get current badge count
   */
  static async getBadgeCount() {
    if (!Notifications) {
      return 0;
    }
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  /**
   * Set badge count
   * @param {number} count - Badge count to set
   */
  static async setBadgeCount(count) {
    if (!Notifications) {
      return;
    }
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  /**
   * Clear all notifications
   */
  static async clearAllNotifications() {
    if (!Notifications) {
      return;
    }
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  /**
   * Schedule a local notification (for testing)
   * @param {Object} notification - Notification configuration
   */
  static async scheduleLocalNotification(notification) {
    if (!Notifications) {
      console.log('Notifications not available');
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title || 'Dating App',
          body: notification.body || '',
          data: notification.data || {},
          sound: true,
          ...notification.content,
        },
        trigger: notification.trigger || null, // null = immediate
      });
    } catch (error) {
      console.error('Error scheduling local notification:', error);
    }
  }
}

export default NotificationService;
