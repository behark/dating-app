import { useEffect, useState } from 'react';
import OfflineService from '../../services/OfflineService';

/**
 * Network Status Hook
 * Provides reactive network connectivity state for React components.
 *
 * Uses OfflineService as the single source of truth for network status
 * to ensure consistency across the app. OfflineService handles the actual
 * NetInfo subscription and web fallback logic.
 *
 * WHY: This hook bridges the imperative OfflineService with React's
 * reactive state model. Components use this hook for UI updates,
 * while services call OfflineService.getNetworkStatus() directly.
 */
export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(() => OfflineService.getNetworkStatus());
  const [isInternetReachable, setIsInternetReachable] = useState(() =>
    OfflineService.getNetworkStatus()
  );

  useEffect(() => {
    // Subscribe to OfflineService for network status changes
    const unsubscribe = OfflineService.subscribe((isOnline) => {
      setIsConnected(isOnline);
      setIsInternetReachable(isOnline);
    });

    // Sync initial state
    const currentStatus = OfflineService.getNetworkStatus();
    setIsConnected(currentStatus);
    setIsInternetReachable(currentStatus);

    return unsubscribe;
  }, []);

  return {
    isConnected,
    isInternetReachable,
    isOnline: isConnected && isInternetReachable,
    isOffline: !isConnected || !isInternetReachable,
  };
};

export default useNetworkStatus;
