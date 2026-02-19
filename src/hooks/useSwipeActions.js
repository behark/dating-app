import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { SwipeController } from '../services/SwipeController';
import { GamificationService } from '../services/GamificationService';
import AnalyticsService from '../services/AnalyticsService';
import HapticFeedback from '../utils/haptics';
import logger from '../utils/logger';

// Constants for swipe handling
const SWIPE_DEBOUNCE_MS = 500;
const DAILY_LIMIT_TITLE = 'Daily Limit Reached';

/**
 * Custom hook for managing swipe actions and state
 *
 * Handles:
 * - Swipe debouncing to prevent race conditions
 * - Optimistic UI updates
 * - Error handling and recovery
 * - Analytics tracking
 * - Haptic feedback
 * - Gamification integration
 * - Premium feature checks
 */
export const useSwipeActions = ({
  userId,
  isPremium,
  navigation,
  isGuest,
  promptLogin,
  onOptimisticUpdate,
  onMatchFound,
}) => {
  // Race condition prevention
  const swipeTimestampsRef = useRef(new Map());
  const isSwipingRef = useRef(false);

  // State
  const [lastSwipedCard, setLastSwipedCard] = useState(null);
  const [superLikesUsed, setSuperLikesUsed] = useState(0);
  const [swipesUsedToday, setSwipesUsedToday] = useState(0);
  const [premiumFeatures, setPremiumFeatures] = useState({});

  /**
   * Check if swipe is allowed (debouncing and rate limiting)
   */
  const canSwipe = useCallback((cardId) => {
    const now = Date.now();
    const lastSwipeTime = swipeTimestampsRef.current.get(cardId) || 0;

    if (now - lastSwipeTime < SWIPE_DEBOUNCE_MS) {
      logger.info('Swipe debounced - too rapid');
      return false;
    }

    if (isSwipingRef.current) {
      logger.info('Swipe ignored - another swipe in progress');
      return false;
    }

    return true;
  }, []);

  /**
   * Mark swipe as in progress
   */
  const startSwipe = useCallback((cardId) => {
    const now = Date.now();
    swipeTimestampsRef.current.set(cardId, now);
    isSwipingRef.current = true;
  }, []);

  /**
   * Complete swipe operation
   */
  const endSwipe = useCallback(() => {
    isSwipingRef.current = false;
  }, []);

  /**
   * Handle swipe right (like)
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSwipeRight = useCallback(
    async (card) => {
      // Guest mode handling
      if (isGuest) {
        promptLogin('like');
        return;
      }

      const cardId = card.id || card._id;

      if (!canSwipe(cardId)) return;
      startSwipe(cardId);

      // Optimistic UI update
      onOptimisticUpdate?.('right', card);
      HapticFeedback.swipeFeedback('right');

      try {
        // Check swipe limit
        const limitCheck = await SwipeController.checkSwipeLimit(userId, isPremium);
        if (!limitCheck.canSwipe) {
          Alert.alert(
            DAILY_LIMIT_TITLE,
            `You've reached your daily swipe limit. Upgrade to Premium for unlimited swipes!`,
            [
              { text: 'Keep Going', style: 'cancel' },
              { text: 'Upgrade', onPress: () => navigation.navigate('Premium') },
            ]
          );
          return;
        }

        // Save the swipe
        const result = await SwipeController.saveSwipe(userId, cardId, 'like', isPremium);
        AnalyticsService.logSwipe('like', cardId);

        if (!result.success) {
          if (result.limitExceeded) {
            Alert.alert(
              DAILY_LIMIT_TITLE,
              `You've reached your daily swipe limit. ${result.remaining} swipes left tomorrow!`
            );
          } else if (!result.alreadyProcessed) {
            Alert.alert('Error', result.error || 'Failed to save swipe');
          }
          return;
        }

        // Update last swiped card
        setLastSwipedCard({ card, direction: 'right', swipeId: result.swipeId });

        // Handle match
        if (result.match && result.matchId) {
          HapticFeedback.matchCelebration();
          onMatchFound?.(card.name, result.matchId);
        }

        // Track for gamification
        trackGamificationSwipe('like');

        // Update counters
        setSwipesUsedToday((prev) => prev + 1);
      } catch (error) {
        logger.error('Error handling swipe right:', error);
        Alert.alert('Error', 'Failed to process swipe');
      } finally {
        endSwipe();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      userId,
      isPremium,
      navigation,
      isGuest,
      promptLogin,
      canSwipe,
      startSwipe,
      endSwipe,
      onOptimisticUpdate,
      onMatchFound,
    ]
  );

  /**
   * Handle swipe left (pass)
   */
  const handleSwipeLeft = useCallback(
    async (card) => {
      // Guest mode allows pass but tracks views
      if (isGuest) {
        onOptimisticUpdate?.('left', card);
        return;
      }

      const cardId = card.id || card._id;

      if (!canSwipe(cardId)) return;
      startSwipe(cardId);

      // Optimistic UI update
      onOptimisticUpdate?.('left', card);
      HapticFeedback.swipeFeedback('left');

      try {
        // Check swipe limit
        const limitCheck = await SwipeController.checkSwipeLimit(userId, isPremium);
        if (!limitCheck.canSwipe) {
          Alert.alert(
            DAILY_LIMIT_TITLE,
            `You've reached your daily swipe limit. Upgrade to Premium for unlimited swipes!`,
            [
              { text: 'Keep Going', style: 'cancel' },
              { text: 'Upgrade', onPress: () => navigation.navigate('Premium') },
            ]
          );
          return;
        }

        // Save the dislike
        const result = await SwipeController.saveSwipe(userId, cardId, 'dislike', isPremium);
        AnalyticsService.logSwipe('pass', cardId);

        if (!result.success) {
          if (result.limitExceeded) {
            Alert.alert(
              DAILY_LIMIT_TITLE,
              `You've reached your daily swipe limit. ${result.remaining} swipes left tomorrow!`
            );
          }
          return;
        }

        setLastSwipedCard({ card, direction: 'left', swipeId: result.swipeId });
        setSwipesUsedToday((prev) => prev + 1);
      } catch (error) {
        logger.error('Error handling swipe left:', error);
      } finally {
        endSwipe();
      }
    },
    [userId, isPremium, navigation, isGuest, canSwipe, startSwipe, endSwipe, onOptimisticUpdate]
  );

  /**
   * Handle super like
   */
  const handleSuperLike = useCallback(
    async (card) => {
      if (isGuest) {
        promptLogin('superlike');
        return;
      }

      const targetId = card.id || card._id;

      if (!canSwipe(targetId)) return;
      startSwipe(targetId);

      HapticFeedback.heavyImpact();
      onOptimisticUpdate?.('right', card);

      try {
        const result = await SwipeController.saveSwipe(userId, targetId, 'superlike', isPremium);

        if (!result.success) {
          if (result.limitExceeded) {
            Alert.alert(
              'Super Like Limit',
              `You've used all ${premiumFeatures.superLikesPerDay || 1} super likes for today. Upgrade to premium for more!`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Upgrade', onPress: () => navigation.navigate('Premium') },
              ]
            );
          } else {
            Alert.alert('Error', result.error || 'Failed to send super like');
          }
          return;
        }

        setSuperLikesUsed((prev) => prev + 1);
        AnalyticsService.logSwipe('superlike', targetId);

        if (result.match && result.matchId) {
          HapticFeedback.matchCelebration();
          onMatchFound?.(card.name, result.matchId);
        } else {
          Alert.alert('Super Liked!', `${card.name} will definitely see your interest!`, [
            { text: 'Awesome!', style: 'default' },
          ]);
        }

        setLastSwipedCard({ card, direction: 'right', swipeId: result.swipeId || null });
      } catch (error) {
        logger.error('Error using super like:', error);
        Alert.alert('Error', 'Failed to use super like');
      } finally {
        endSwipe();
      }
    },
    [
      isGuest,
      promptLogin,
      userId,
      isPremium,
      canSwipe,
      startSwipe,
      endSwipe,
      premiumFeatures.superLikesPerDay,
      navigation,
      onOptimisticUpdate,
      onMatchFound,
    ]
  );

  /**
   * Undo last swipe
   */
  const undoLastSwipe = useCallback(async () => {
    if (!lastSwipedCard) {
      Alert.alert('No Swipe to Undo', 'Undo the current card first');
      return;
    }

    try {
      if (lastSwipedCard.swipeId) {
        const result = await SwipeController.undoSwipe(userId, lastSwipedCard.swipeId);
        if (!result.success) {
          Alert.alert('Error', result.error || 'Failed to undo swipe');
          return;
        }
      }

      setLastSwipedCard(null);
      Alert.alert('Success', 'Last swipe has been undone');
      return true; // Indicate success for UI updates
    } catch (error) {
      logger.error('Error undoing swipe:', error);
      Alert.alert('Error', 'Failed to undo swipe');
      return false;
    }
  }, [lastSwipedCard, userId]);

  /**
   * Track gamification swipe
   */
  const trackGamificationSwipe = useCallback(
    async (swipeType) => {
      try {
        await GamificationService.trackSwipe(userId, swipeType);
      } catch (error) {
        logger.error('Error tracking swipe for gamification:', error);
      }
    },
    [userId]
  );

  /**
   * Reconcile swipe counters
   */
  const reconcileSwipeCounters = useCallback(async () => {
    if (!userId) return;
    try {
      const count = await SwipeController.getSwipesCountToday(userId);
      setSwipesUsedToday(count);
    } catch (e) {
      logger.error('Error reconciling swipe counters', e);
    }
  }, [userId]);

  return {
    // State
    lastSwipedCard,
    superLikesUsed,
    swipesUsedToday,
    premiumFeatures,

    // Actions
    handleSwipeRight,
    handleSwipeLeft,
    handleSuperLike,
    undoLastSwipe,
    reconcileSwipeCounters,

    // Setters for external updates
    setSuperLikesUsed,
    setSwipesUsedToday,
    setPremiumFeatures,
  };
};

export default useSwipeActions;
