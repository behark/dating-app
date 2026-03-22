import { useState, useCallback, useMemo, useEffect, useRef, startTransition } from 'react';
import { InteractionManager } from 'react-native';
import { getUserRepository } from '../../../services/repositories';
import { LocationService } from '../../../services/LocationService';
import { PreferencesService } from '../../../services/PreferencesService';
import { PremiumService } from '../../../services/PremiumService';
import { GamificationService } from '../../../services/GamificationService';
import AnalyticsService from '../../../services/AnalyticsService';
import logger from '../../../utils/logger';
import Toast from '../../../utils/toast';
import { GUEST_DEMO_PROFILES, GUEST_FREE_VIEWS } from '../data/demoProfiles';

export const useDiscovery = ({ userId, authToken, isGuest, isPremium }) => {
  const userRepository = useMemo(() => getUserRepository(authToken), [authToken]);

  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [discoveryRadius, setDiscoveryRadius] = useState(50);
  const [locationUpdating, setLocationUpdating] = useState(false);
  const [swipesUsedToday, setSwipesUsedToday] = useState(0);
  const [swipesRemaining, setSwipesRemaining] = useState(50);
  const [superLikesUsed, setSuperLikesUsed] = useState(0);
  const [premiumFeatures, setPremiumFeatures] = useState({});

  const initializeLocation = useCallback(async () => {
    try {
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
    }
    return null;
  }, []);

  const loadCards = useCallback(
    async (location = null, guestMode = false) => {
      setLoading(true);
      try {
        if (guestMode) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          setCards(GUEST_DEMO_PROFILES);
          setCurrentIndex(0);
          return;
        }

        const preferences = await PreferencesService.getUserPreferences(userId);
        const profiles = await userRepository.getDiscoveryProfiles({
          location: location?.coords || userLocation?.coords,
          radius: discoveryRadius,
          preferences,
        });

        setCards(profiles || []);
        setCurrentIndex(0);
        AnalyticsService.logEvent('profiles_loaded', { count: profiles?.length || 0 });
      } catch (error) {
        logger.error('Error loading cards:', error);
        // Fallback to demo data when backend is unreachable
        Toast.show({
          type: 'info',
          text1: 'Network issue',
          text2: 'Cannot reach server. Tap retry.',
          actionLabel: 'Retry',
          onPress: () => {
            loadCards(location || userLocation, guestMode);
          },
        });
        setCards(GUEST_DEMO_PROFILES);
        setCurrentIndex(0);
      } finally {
        setLoading(false);
      }
    },
    [userRepository, userLocation, discoveryRadius]
  );

  const loadPremiumStatus = useCallback(async () => {
    if (!userId) return;
    try {
      const status = await PremiumService.checkPremiumStatus(userId);
      setPremiumFeatures(status?.features || {});
    } catch (error) {
      logger.error('Error loading premium status:', error);
    }
  }, [userId]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadCards(userLocation, isGuest);
    } finally {
      setRefreshing(false);
    }
  }, [loadCards, userLocation, isGuest]);

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
    loadCards,
    loadPremiumStatus,
    refresh,
    advanceCard,
  };
};

export default useDiscovery;
