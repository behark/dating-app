import { useEffect, useState } from 'react';

/**
 * Network Status Hook
 * Monitors internet connectivity and provides real-time status
 *
 * Note: This is a basic implementation. For production, install:
 * npx expo install @react-native-community/netinfo
 *
 * And use the NetInfo library for more accurate connectivity detection
 */
export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    // Try to import NetInfo if available
    let NetInfo = null;
    try {
      NetInfo = require('@react-native-community/netinfo').default;
    } catch (error) {
      console.warn('NetInfo not installed. Using basic connectivity detection.');
      // Fallback: assume online
      return;
    }

    if (!NetInfo) {
      return;
    }

    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? true);
      setIsInternetReachable(state.isInternetReachable ?? true);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    isConnected,
    isInternetReachable,
    isOnline: isConnected && isInternetReachable,
    isOffline: !isConnected || !isInternetReachable,
  };
};

export default useNetworkStatus;
