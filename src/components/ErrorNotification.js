import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/colors';

/**
 * Error notification component with auto-dismiss
 * Displays user-friendly error messages with icons
 */
export const ErrorNotification = ({
  message,
  type = 'error', // 'error', 'warning', 'info', 'success'
  visible,
  onDismiss,
  autoHideDuration = 5000,
  position = 'top', // 'top' or 'bottom'
}) => {
  const slideAnim = useRef(new Animated.Value(position === 'top' ? -100 : 100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const nativeDriver = Platform.OS !== 'web';
    if (visible) {
      // Slide in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: nativeDriver,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: nativeDriver,
        }),
      ]).start();

      // Auto hide
      if (autoHideDuration > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, autoHideDuration);
        return () => clearTimeout(timer);
      }
    } else {
      // Reset position
      slideAnim.setValue(position === 'top' ? -100 : 100);
      opacityAnim.setValue(0);
    }
  }, [visible, autoHideDuration, position]);

  const handleDismiss = () => {
    const nativeDriver = Platform.OS !== 'web';
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: position === 'top' ? -100 : 100,
        duration: 200,
        useNativeDriver: nativeDriver,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: nativeDriver,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  if (!visible && opacityAnim._value === 0) return null;

  const config = getTypeConfig(type);

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'top' ? styles.topPosition : styles.bottomPosition,
        { backgroundColor: config.backgroundColor },
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons name={config.icon} size={24} color={config.iconColor} />
        <Text style={[styles.message, { color: config.textColor }]} numberOfLines={3}>
          {message}
        </Text>
      </View>
      <TouchableOpacity onPress={handleDismiss} style={styles.dismissButton}>
        <Ionicons name="close" size={20} color={config.iconColor} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const getTypeConfig = (type) => {
  switch (type) {
    case 'success':
      return {
        backgroundColor: Colors.status.successLight,
        iconColor: Colors.status.successDark,
        textColor: '#1B5E20',
        icon: 'checkmark-circle',
      };
    case 'warning':
      return {
        backgroundColor: Colors.status.warningLight,
        iconColor: '#F57C00',
        textColor: '#E65100',
        icon: 'warning',
      };
    case 'info':
      return {
        backgroundColor: Colors.status.infoLight,
        iconColor: '#1976D2',
        textColor: '#0D47A1',
        icon: 'information-circle',
      };
    case 'error':
    default:
      return {
        backgroundColor: Colors.status.errorLight,
        iconColor: '#D32F2F',
        textColor: '#B71C1C',
        icon: 'alert-circle',
      };
  }
};

/**
 * Hook for managing error notifications
 */
export const useErrorNotification = () => {
  const [notification, setNotification] = React.useState({
    visible: false,
    message: '',
    type: 'error',
  });

  const showError = (message) => {
    setNotification({ visible: true, message, type: 'error' });
  };

  const showWarning = (message) => {
    setNotification({ visible: true, message, type: 'warning' });
  };

  const showInfo = (message) => {
    setNotification({ visible: true, message, type: 'info' });
  };

  const showSuccess = (message) => {
    setNotification({ visible: true, message, type: 'success' });
  };

  const hideNotification = () => {
    setNotification((prev) => ({ ...prev, visible: false }));
  };

  const NotificationComponent = (props) => (
    <ErrorNotification
      visible={notification.visible}
      message={notification.message}
      type={notification.type}
      onDismiss={hideNotification}
      {...props}
    />
  );

  return {
    showError,
    showWarning,
    showInfo,
    showSuccess,
    hideNotification,
    notification,
    NotificationComponent,
  };
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 9999,
  },
  topPosition: {
    top: 50,
  },
  bottomPosition: {
    bottom: 50,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  message: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default ErrorNotification;
