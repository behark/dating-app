import { Alert, Platform, ToastAndroid } from 'react-native';

/**
 * Lightweight toast wrapper that works across native and web without extra deps.
 * Supports optional action handler (shown as an Alert button on platforms that allow it).
 */
const Toast = {
  show({ text1, text2, type = 'info', actionLabel = 'Retry', onPress } = {}) {
    const message = [text1, text2].filter(Boolean).join(' — ');

    // Android: quick toast if no action, otherwise fall back to alert for a button
    if (Platform.OS === 'android' && !onPress) {
      ToastAndroid.show(message || 'Notification', ToastAndroid.SHORT);
      return;
    }

    // iOS/web or when action needed: use Alert to allow a button
    const buttons = onPress
      ? [
          { text: 'Dismiss', style: 'cancel' },
          { text: actionLabel, onPress },
        ]
      : [{ text: 'OK' }];

    Alert.alert(type === 'error' ? 'Error' : 'Notice', message || 'Notification', buttons, {
      cancelable: true,
    });
  },
};

export default Toast;
