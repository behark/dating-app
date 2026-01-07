import { useEffect, useState } from 'react';
import { API_URL } from '../config/api';

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
      console.warn('NetInfo not installed. Falling back to health ping.');
    }

    let unsubscribe = null;
    let intervalId = null;

    if (NetInfo) {
      // Subscribe to network state updates
      unsubscribe = NetInfo.addEventListener((state) => {
        setIsConnected(state.isConnected ?? true);
        setIsInternetReachable(state.isInternetReachable ?? true);
      });
    } else {
      // Fallback: periodically ping backend /health endpoint
      const baseUrl = API_URL.replace(/\/api$/, '');
      const healthUrl = `${baseUrl}/health`;

      const pingHealth = async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          const res = await fetch(healthUrl, { method: 'GET', signal: controller.signal });
          clearTimeout(timeoutId);
          const ok = !!res && res.ok;
          setIsConnected(ok);
          setIsInternetReachable(ok);
        } catch (e) {
          setIsConnected(false);
          setIsInternetReachable(false);
        }
      };

      // Initial check and periodic checks
      pingHealth();
      intervalId = setInterval(pingHealth, 15000);
    }

    // Cleanup subscription on unmount
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      if (intervalId) clearInterval(intervalId);
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
