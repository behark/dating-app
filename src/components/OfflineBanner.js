import React from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

/**
 * OfflineBanner Component
 * Displays a banner when the device is offline
 */
export const OfflineBanner = () => {
  const { isOnline } = useNetworkStatus();
  const slideAnim = React.useRef(new Animated.Value(-60)).current;

  React.useEffect(() => {
    if (!isOnline) {
      // Slide down when offline
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      // Slide up when back online
      Animated.timing(slideAnim, {
        toValue: -60,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.content}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.text}>No Internet Connection</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f44336',
    paddingTop: Platform.OS === 'ios' ? 44 : 0, // Account for status bar on iOS
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default OfflineBanner;
