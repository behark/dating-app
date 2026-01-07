import { useCallback, useEffect, useState } from 'react';
import { OfflineService } from '../../services/OfflineService';

/**
 * Hook for managing offline status and actions
 */
export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Initialize and get current status
    const init = async () => {
      await OfflineService.initialize();
      setIsOnline(OfflineService.getNetworkStatus());
    };
    init();

    // Subscribe to network changes
    const unsubscribe = OfflineService.subscribe((online) => {
      setIsOnline(online);
    });

    return () => unsubscribe();
  }, []);

  const queueAction = useCallback(async (action) => {
    return await OfflineService.queueAction(action);
  }, []);

  const getCachedProfiles = useCallback(async () => {
    return await OfflineService.getCachedProfiles();
  }, []);

  const getCachedMatches = useCallback(async () => {
    return await OfflineService.getCachedMatches();
  }, []);

  const getCachedMessages = useCallback(async (matchId) => {
    return await OfflineService.getCachedMessages(matchId);
  }, []);

  const clearCache = useCallback(async () => {
    return await OfflineService.clearCache();
  }, []);

  return {
    isOnline,
    queueAction,
    getCachedProfiles,
    getCachedMatches,
    getCachedMessages,
    clearCache,
    cacheProfiles: OfflineService.cacheProfiles.bind(OfflineService),
    cacheMatches: OfflineService.cacheMatches.bind(OfflineService),
    cacheMessages: OfflineService.cacheMessages.bind(OfflineService),
  };
};

export default useOffline;
