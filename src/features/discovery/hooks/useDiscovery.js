import { useState, useCallback, useMemo, useEffect, startTransition } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserRepository } from '../../../services/repositories';
import { LocationService } from '../../../services/LocationService';
import { PreferencesService } from '../../../services/PreferencesService';
import { PremiumService } from '../../../services/PremiumService';
import AnalyticsService from '../../../services/AnalyticsService';
import logger from '../../../utils/logger';
import Toast from '../../../utils/toast';
import { GUEST_DEMO_PROFILES } from '../data/demoProfiles';

export const useDiscovery = ({ userId, authToken, isGuest, isPremium }) => {
  const userRepository = useMemo(() => getUserRepository(authToken), [authToken]);
  const queryClient = useQueryClient();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [discoveryRadius, setDiscoveryRadius] = useState(50);
  const [locationUpdating, setLocationUpdating] = useState(false);
  const [swipesUsedToday, setSwipesUsedToday] = useState(0);
  const [swipesRemaining, setSwipesRemaining] = useState(50);
  const [superLikesUsed, setSuperLikesUsed] = useState(0);

  const initializeLocation = useCallback(async () => {
    try {
      setLocationUpdating(true);
      const hasPermission = await LocationService.requestLocationPermission();
      if (!hasPermission) {
        logger.info('Location permission denied, using default');
        return null;
      }
      const location = await LocationService.getCurrentLocation();
      if (location) {
        setUserLocation(location);
        return location;
      }
    } catch (error) {
      logger.error('Location error:', error);
    } finally {
      setLocationUpdating(false);
    }
    return null;
  }, []);

  // Use React Query for fetching discovery profiles
  const {
    data: cards = [],
    isLoading: loading,
    isRefetching: refreshing,
    refetch: loadCardsQuery,
    error,
  } = useQuery({
    queryKey: ['discoveryProfiles', userId, userLocation?.coords, discoveryRadius, isGuest],
    queryFn: async () => {
      if (isGuest) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return GUEST_DEMO_PROFILES;
      }

      const preferences = await PreferencesService.getUserPreferences(userId);
      const profiles = await userRepository.getDiscoveryProfiles({
        location: userLocation?.coords,
        radius: discoveryRadius,
        preferences,
      });

      AnalyticsService.logEvent('profiles_loaded', { count: profiles?.length || 0 });
      return profiles || [];
    },
    enabled: !!userId || isGuest, // Only run query if userId is present or isGuest
    staleTime: 5 * 60 * 1000,     // Cache for 5 minutes
    retry: 2,                     // Retry twice on failure
  });

  // Handle errors
  useEffect(() => {
    if (error) {
      logger.error('Error loading cards:', error);
      Toast.show({
        type: 'info',
        text1: 'Network issue',
        text2: 'Cannot reach server. Will fallback to demo data.',
        actionLabel: 'Dismiss',
      });
      // Fallback to demo profiles
      queryClient.setQueryData(
        ['discoveryProfiles', userId, userLocation?.coords, discoveryRadius, isGuest],
        GUEST_DEMO_PROFILES
      );
    }
  }, [error, queryClient, userId, userLocation, discoveryRadius, isGuest]);

  // Reset index when cards change
  useEffect(() => {
    setCurrentIndex(0);
  }, [cards]);

  // Use React Query for Premium Status
  const { data: premiumFeatures = {}, refetch: loadPremiumStatus } = useQuery({
    queryKey: ['premiumStatus', userId],
    queryFn: async () => {
      if (!userId) return {};
      const status = await PremiumService.checkPremiumStatus(userId);
      return status?.features || {};
    },
    enabled: !!userId && !isGuest,
    staleTime: 10 * 60 * 1000, 
  });

  const refresh = useCallback(async () => {
    await loadCardsQuery();
  }, [loadCardsQuery]);

  const advanceCard = useCallback(() => {
    startTransition(() => {
      setCurrentIndex((prev) => prev + 1);
      setSwipesUsedToday((prev) => {
        const newCount = prev + 1;
        if (!isPremium) {
          setSwipesRemaining(Math.max(0, 50 - newCount));
        }
        return newCount;
      });
    });
  }, [isPremium]);

  const currentCard = cards[currentIndex] || null;
  const hasMoreCards = currentIndex < cards.length;
  const isOutOfCards = !loading && cards.length > 0 && currentIndex >= cards.length;

  const setCards = useCallback((newCards) => {
     queryClient.setQueryData(
       ['discoveryProfiles', userId, userLocation?.coords, discoveryRadius, isGuest], 
       newCards
     );
  }, [queryClient, userId, userLocation, discoveryRadius, isGuest]);

  return {
    cards,
    currentCard,
    currentIndex,
    loading,
    refreshing,
    userLocation,
    discoveryRadius,
    locationUpdating,
    swipesUsedToday,
    swipesRemaining,
    superLikesUsed,
    premiumFeatures,
    hasMoreCards,
    isOutOfCards,
    setCards,
    setCurrentIndex,
    setSwipesUsedToday,
    setSuperLikesUsed,
    initializeLocation,
    loadCards: refresh, // map old function signature
    loadPremiumStatus,
    refresh,
    advanceCard,
  };
};

export default useDiscovery;
