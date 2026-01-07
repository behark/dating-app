/**
 * NotificationService (TypeScript)
 * Handles push notifications registration and management
 *
 * Note: This requires installation of expo-notifications:
 * npx expo install expo-notifications expo-device
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Expo Notifications types (simplified)
 */
interface ExpoNotifications {
  setNotificationHandler: (handler: {
    handleNotification: () => Promise<{
      shouldShowAlert: boolean;
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
    }>;
  }) => void;
  getPermissionsAsync: () => Promise<{ status: string }>;
  requestPermissionsAsync: () => Promise<{ status: string }>;
  getExpoPushTokenAsync: (options: { projectId: string }) => Promise<{ data: string }>;
  setNotificationChannelAsync: (
    channelId: string,
    channel: {
      name: string;
      importance: number;
      vibrationPattern?: number[];
      lightColor?: string;
      sound?: string;
      enableVibrate?: boolean;
      showBadge?: boolean;
    }
  ) => Promise<void>;
  addNotificationReceivedListener: (
    listener: (notification: Notification) => void
  ) => { remove: () => void };
  addNotificationResponseReceivedListener: (
    listener: (response: NotificationResponse) => void
  ) => { remove: () => void };
  removeNotificationSubscription: (subscription: { remove: () => void }) => void;
  getBadgeCountAsync: () => Promise<number>;
  setBadgeCountAsync: (count: number) => Promise<void>;
  dismissAllNotificationsAsync: () => Promise<void>;
  scheduleNotificationAsync: (notification: {
    content: {
      title?: string;
      body?: string;
      data?: Record<string, unknown>;
      sound?: boolean;
      [key: string]: unknown;
    };
    trigger: unknown;
  }) => Promise<string>;
  AndroidImportance: {
    MAX: number;
    HIGH: number;
    DEFAULT: number;
  };
}

interface ExpoDevice {
  isDevice: boolean;
}

/**
 * Notification object
 */
export interface Notification {
  request: {
    content: {
      title?: string;
      body?: string;
      data?: Record<string, unknown>;
      [key: string]: unknown;
    };
    identifier: string;
    trigger: unknown;
  };
  date: Date;
}

/**
 * Notification response (when user taps notification)
 */
export interface NotificationResponse {
  notification: Notification;
  actionIdentifier: string;
}

/**
 * Notification listener callbacks
 */
export interface NotificationListeners {
  onNotification?: (notification: Notification) => void;
  onNotificationResponse?: (response: NotificationResponse) => void;
}

/**
 * Local notification configuration
 */
export interface LocalNotificationConfig {
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  content?: Record<string, unknown>;
  trigger?: unknown;
}

let Notifications: ExpoNotifications | null = null;
let Device: ExpoDevice | null = null;

// Try to import expo-notifications if available
try {
  Notifications = require('expo-notifications') as ExpoNotifications;
  Device = require('expo-device') as ExpoDevice;
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
   */
  static async registerForPushNotifications(): Promise<string | null> {
    // Push notifications don't work on web
    if (Platform.OS === 'web') {
      console.log('Push notifications not supported on web platform');
      return null;
    }

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
      const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;

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
  static async setupAndroidChannels(): Promise<void> {
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
   * @returns Cleanup function to remove listeners
   */
  static setupNotificationListeners(
    onNotification?: (notification: Notification) => void,
    onNotificationResponse?: (response: NotificationResponse) => void
  ): () => void {
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
  static async getBadgeCount(): Promise<number> {
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
   */
  static async setBadgeCount(count: number): Promise<void> {
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
  static async clearAllNotifications(): Promise<void> {
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
   */
  static async scheduleLocalNotification(notification: LocalNotificationConfig): Promise<void> {
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
