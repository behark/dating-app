import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import OfflineService from '../services/OfflineService';

/**
 * Offline Indicator Component
 * Shows a banner when the app is offline
 */
export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Get initial status
    setIsOnline(OfflineService.getNetworkStatus());

    // Subscribe to network status changes
    const unsubscribe = OfflineService.subscribe((online) => {
      setIsOnline(online);
      
      // Animate in/out
      Animated.timing(fadeAnim, {
        toValue: online ? 0 : 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      unsubscribe();
    };
  }, [fadeAnim]);

  if (isOnline) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Text style={styles.text}>📡 Offline - Some features may be limited</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default OfflineIndicator;
