import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useCallback } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useOffline } from '../hooks/useOffline';

/**
 * NetworkStatusBanner - Shows offline/online status notification
 *
 * Features:
 * - Animated slide-in/out
 * - Shows pending actions count
 * - Dismissible
 * - Auto-hides when back online after brief display
 */
const NetworkStatusBanner = ({ style, showWhenOnline = true, autoHideDelay = 3000, onRetry }) => {
  const { isOnline } = useOffline();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const hideTimeoutRef = useRef(null);
  const wasOfflineRef = useRef(false);

  const showBanner = useCallback(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, opacityAnim]);

  const hideBanner = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, opacityAnim]);

  useEffect(() => {
    // Clear any existing timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    if (!isOnline) {
      // Show offline banner
      wasOfflineRef.current = true;
      showBanner();
    } else if (wasOfflineRef.current && showWhenOnline) {
      // Show "back online" message briefly
      showBanner();
      hideTimeoutRef.current = setTimeout(() => {
        hideBanner();
        wasOfflineRef.current = false;
      }, autoHideDelay);
    } else {
      hideBanner();
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [isOnline, showWhenOnline, autoHideDelay, showBanner, hideBanner]);

  const handleDismiss = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideBanner();
  };

  const handleRetry = () => {
    onRetry?.();
  };

  const backgroundColor = isOnline ? '#4caf50' : '#f44336';
  const iconName = isOnline ? 'cloud-done' : 'cloud-offline';
  const message = isOnline
    ? "You're back online!"
    : "You're offline. Some features may be limited.";

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor },
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
        style,
      ]}
      pointerEvents={isOnline && !wasOfflineRef.current ? 'none' : 'auto'}
    >
      <View style={styles.content}>
        <Ionicons name={iconName} size={20} color="#fff" />
        <Text style={styles.message}>{message}</Text>
      </View>

      <View style={styles.actions}>
        {!isOnline && onRetry && (
          <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
            <Ionicons name="refresh" size={18} color="#fff" />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleDismiss} style={styles.dismissButton}>
          <Ionicons name="close" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  message: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 10,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryButton: {
    padding: 8,
    marginRight: 4,
  },
  dismissButton: {
    padding: 8,
  },
});

export default NetworkStatusBanner;
