import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  InteractionManager,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { UI_MESSAGES } from '../constants/constants';
import { Colors } from '../constants/colors';
import SkeletonCard from '../components/Card/SkeletonCard';
import SwipeCard from '../components/Card/SwipeCard';
import MicroAnimations from '../components/Common/MicroAnimations';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getUserRepository } from '../repositories';
import AdvancedInteractionsService from '../services/AdvancedInteractionsService';
import { GamificationService } from '../services/GamificationService';
import { LocationService } from '../services/LocationService';
import { PreferencesService } from '../services/PreferencesService';
import { PremiumService } from '../services/PremiumService';
import { SwipeController } from '../services/SwipeController';
import logger from '../utils/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Minimum time between swipes on the same card (ms) - prevents race conditions
const SWIPE_DEBOUNCE_MS = 500;

const HomeScreen = ({ navigation }) => {
  const { currentUser, authToken } = useAuth();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  // Get the user repository (API or Firebase based on config)
  const userRepository = useMemo(() => getUserRepository(authToken), [authToken]);

  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  // Using real backend data now
  const [refreshing, setRefreshing] = useState(false);
  const [lastSwipedCard, setLastSwipedCard] = useState(null);
  const [superLikesUsed, setSuperLikesUsed] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumFeatures, setPremiumFeatures] = useState({});
  const [swipesUsedToday, setSwipesUsedToday] = useState(0);
  const [swipesRemaining, setSwipesRemaining] = useState(50);
  const [userLocation, setUserLocation] = useState(null);
  const [discoveryRadius, setDiscoveryRadius] = useState(50); // km
  const [locationUpdating, setLocationUpdating] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // RACE CONDITION FIX: Track swipe timestamps to prevent rapid double-swipes
  const swipeTimestampsRef = useRef(new Map());
  const isSwipingRef = useRef(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showRewardNotification, setShowRewardNotification] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  // Get the user ID (supports both uid and _id)
  const userId = currentUser?.uid || currentUser?._id;

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        // Initialize location first, then load cards after location is available
        initializeLocation().then(() => {
          loadCards();
        });
        loadPremiumStatus();
        loadGamificationData();
      }
    }, [userId])
  );

  const loadGamificationData = async () => {
    if (!userId) return;
    try {
      const streakData = await GamificationService.getSwipeStreak(userId);
      if (streakData) {
        setCurrentStreak(streakData.currentStreak || 0);
        setLongestStreak(streakData.longestStreak || 0);
      }
      setShowRewardNotification(true);
    } catch (error) {
      logger.error('Error loading gamification data:', error);
    }
  };

  const initializeLocation = async () => {
    if (!userId) return;
    try {
      setLocationUpdating(true);

      // Get current location
      const location = await LocationService.getCurrentLocation();
      if (location) {
        setUserLocation(location);

        // Update user location in database
        await LocationService.updateUserLocation(userId, location);

        // Start periodic location updates (every 5 minutes)
        LocationService.startPeriodicLocationUpdates(userId);
      } else {
        // If location permission denied or unavailable, use a default location
        // This allows discovery to work even without location permission
        logger.warn('Location not available, using default location for discovery');
        const defaultLocation = {
          latitude: 0, // Center of world as fallback
          longitude: 0,
          accuracy: null,
        };
        setUserLocation(defaultLocation);
      }
    } catch (error) {
      logger.error('Error initializing location:', error);
      // Set default location on error to allow discovery to work
      const defaultLocation = {
        latitude: 0,
        longitude: 0,
        accuracy: null,
      };
      setUserLocation(defaultLocation);
    } finally {
      setLocationUpdating(false);
    }
  };

  const loadPremiumStatus = async () => {
    if (!userId || !authToken) return;
    try {
      const premiumStatus = await PremiumService.checkPremiumStatus(userId, authToken);
      setIsPremium(premiumStatus.isPremium);
      setPremiumFeatures(premiumStatus.features);

      // Get super likes count - using AdvancedInteractionsService
      try {
        const interactionsService = new AdvancedInteractionsService(authToken);
        const quota = await interactionsService.getSuperLikeQuota();
        const superLikesCount = quota?.used || 0;
        setSuperLikesUsed(superLikesCount);
      } catch (error) {
        logger.error('Error loading super likes count:', error);
        setSuperLikesUsed(0);
      }

      // Load swipe count for the day
      const swipesCount = await SwipeController.getSwipesCountToday(userId);
      setSwipesUsedToday(swipesCount);

      // Calculate remaining swipes (50 for free, unlimited for premium)
      if (premiumStatus.isPremium) {
        setSwipesRemaining(-1); // -1 indicates unlimited
      } else {
        setSwipesRemaining(Math.max(0, 50 - swipesCount));
      }
    } catch (error) {
      logger.error('Error loading premium status:', error);
    }
  };

  // Cleanup repository cache on unmount
  useEffect(() => {
    return () => {
      // Repository handles its own cache cleanup
    };
  }, []);

  const loadCards = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Use repository to get discoverable users - returns empty array on error
      const availableUsers = await userRepository.getDiscoverableUsers(userId, {
        limit: 50,
        lat: userLocation?.latitude,
        lng: userLocation?.longitude,
        radius: discoveryRadius * 1000, // Convert km to meters
      });

      // If no users found, show empty state (no error alert)
      if (availableUsers.length === 0) {
        setCards([]);
        setCurrentIndex(0);
        setLoading(false);
        return;
      }

      // Apply user preferences filtering
      const filteredUsers = await PreferencesService.filterUsersForDiscovery(
        userId,
        availableUsers
      );

      // Shuffle for variety
      const shuffled = filteredUsers.sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setCurrentIndex(0);
      setLoading(false);
    } catch (error) {
      logger.error('Error loading cards:', error);
      // Show empty state when backend is not available
      setCards([]);
      setCurrentIndex(0);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Clear repository cache on refresh to get fresh data
    userRepository.clearCache();
    await loadCards();
    setRefreshing(false);
  };

  const handleSwipeRight = useCallback(
    async (card) => {
      // RACE CONDITION FIX: Prevent rapid double-swipes on the same card
      const cardId = card.id || card._id;
      const now = Date.now();
      const lastSwipeTime = swipeTimestampsRef.current.get(cardId) || 0;

      if (now - lastSwipeTime < SWIPE_DEBOUNCE_MS) {
        logger.info('Swipe debounced - too rapid');
        return; // Ignore rapid duplicate swipe
      }

      // Also check if any swipe is in progress
      if (isSwipingRef.current) {
        logger.info('Swipe ignored - another swipe in progress');
        return;
      }

      // Mark this card as being swiped
      swipeTimestampsRef.current.set(cardId, now);
      isSwipingRef.current = true;

      // Immediately update UI (non-blocking)
      startTransition(() => {
        setLastSwipedCard({ card, direction: 'right', swipeId: null });
        setCurrentIndex((prev) => prev + 1);
        const newCount = swipesUsedToday + 1;
        setSwipesUsedToday(newCount);
        if (!isPremium) {
          setSwipesRemaining(Math.max(0, 50 - newCount));
        }
      });

      // Show heart animation immediately
      setShowHeartAnimation(true);

      // Defer heavy async work to avoid blocking UI
      InteractionManager.runAfterInteractions(async () => {
        try {
          // Check swipe limit
          const limitCheck = await SwipeController.checkSwipeLimit(userId, isPremium);
          if (!limitCheck.canSwipe) {
            isSwipingRef.current = false;
            setTimeout(() => {
              Alert.alert(
                UI_MESSAGES.DAILY_LIMIT_REACHED,
                `You've reached your daily swipe limit (50). Upgrade to Premium for unlimited swipes!`,
                [
                  { text: 'Keep Going', style: 'cancel' },
                  { text: 'Upgrade', onPress: () => navigation.navigate('Premium') },
                ]
              );
            }, 0);
            return;
          }

          // Use SwipeController to save the swipe and check for matches
          const result = await SwipeController.saveSwipe(userId, card.id, 'like', isPremium);

          // Reset swiping flag
          isSwipingRef.current = false;

          if (!result.success) {
            if (result.limitExceeded) {
              setTimeout(() => {
                Alert.alert(
                  UI_MESSAGES.DAILY_LIMIT_REACHED,
                  `You've reached your daily swipe limit. ${result.remaining} swipes left tomorrow!`
                );
              }, 0);
            } else if (!result.alreadyProcessed) {
              // Only show error if it's not a duplicate (already processed is OK)
              setTimeout(() => {
                Alert.alert('Error', result.error || 'Failed to save swipe');
              }, 0);
            }
            return;
          }

          // Update lastSwipedCard with swipeId for undo functionality (non-blocking)
          startTransition(() => {
            setLastSwipedCard({ card, direction: 'right', swipeId: result.swipeId });
          });

          // Show heart animation for successful like
          setShowHeartAnimation(true);

          // Track swipe for gamification (deferred, non-critical)
          setTimeout(async () => {
            try {
              const streakResult = await GamificationService.trackSwipe(userId, 'like');
              if (streakResult) {
                startTransition(() => {
                  setCurrentStreak(streakResult.currentStreak || 0);
                  setLongestStreak(streakResult.longestStreak || 0);
                });
              }
            } catch (error) {
              logger.error('Error tracking swipe for gamification:', error);
            }
          }, 100);

          // If it's a match, show the success animation (deferred)
          if (result.match && result.matchId) {
            setTimeout(() => {
              setSuccessMessage(`🎉 Match with ${card.name}!`);
              setShowSuccessAnimation(true);
            }, 500);
          }
        } catch (error) {
          logger.error('Error handling swipe:', error);
          setTimeout(() => {
            Alert.alert('Error', 'Failed to process swipe');
          }, 0);
        }
      });
    },
    [userId, isPremium, swipesUsedToday, navigation]
  );

  const handleSwipeLeft = useCallback(
    async (card) => {
      // RACE CONDITION FIX: Prevent rapid double-swipes on the same card
      const cardId = card.id || card._id;
      const now = Date.now();
      const lastSwipeTime = swipeTimestampsRef.current.get(cardId) || 0;

      if (now - lastSwipeTime < SWIPE_DEBOUNCE_MS) {
        logger.info('Swipe debounced - too rapid');
        return;
      }

      if (isSwipingRef.current) {
        logger.info('Swipe ignored - another swipe in progress');
        return;
      }

      swipeTimestampsRef.current.set(cardId, now);
      isSwipingRef.current = true;

      // Immediately update UI (non-blocking)
      startTransition(() => {
        setLastSwipedCard({ card, direction: 'left', swipeId: null });
        setCurrentIndex((prev) => prev + 1);
        const newCount = swipesUsedToday + 1;
        setSwipesUsedToday(newCount);
        if (!isPremium) {
          setSwipesRemaining(Math.max(0, 50 - newCount));
        }
      });

      // Defer heavy async work to avoid blocking UI
      InteractionManager.runAfterInteractions(async () => {
        try {
          // Check swipe limit
          const limitCheck = await SwipeController.checkSwipeLimit(userId, isPremium);
          if (!limitCheck.canSwipe) {
            isSwipingRef.current = false;
            setTimeout(() => {
              Alert.alert(
                UI_MESSAGES.DAILY_LIMIT_REACHED,
                `You've reached your daily swipe limit (50). Upgrade to Premium for unlimited swipes!`,
                [
                  { text: 'Keep Going', style: 'cancel' },
                  { text: 'Upgrade', onPress: () => navigation.navigate('Premium') },
                ]
              );
            }, 0);
            return;
          }

          // Use SwipeController to save the dislike
          const result = await SwipeController.saveSwipe(userId, card.id, 'dislike', isPremium);

          // Reset swiping flag
          isSwipingRef.current = false;

          if (!result.success) {
            if (result.limitExceeded) {
              setTimeout(() => {
                Alert.alert(
                  UI_MESSAGES.DAILY_LIMIT_REACHED,
                  `You've reached your daily swipe limit. ${result.remaining} swipes left tomorrow!`
                );
              }, 0);
            } else if (!result.alreadyProcessed) {
              logger.error('Error saving swipe:', result.error);
            }
            // Continue anyway to update UI
          }

          // Update lastSwipedCard with swipeId for undo functionality (non-blocking)
          startTransition(() => {
            setLastSwipedCard({ card, direction: 'left', swipeId: result.swipeId });
          });
        } catch (error) {
          isSwipingRef.current = false;
          logger.error('Error handling swipe:', error);
        }
      });
    },
    [userId, isPremium, swipesUsedToday, navigation]
  );

  const handleSuperLike = useCallback(
    async (card) => {
      // Immediately update UI
      startTransition(() => {
        setSuperLikesUsed((prev) => prev + 1);
      });

      // Defer heavy async work
      InteractionManager.runAfterInteractions(async () => {
        try {
          const interactionsService = new AdvancedInteractionsService(authToken);
          const result = await interactionsService.sendSuperLike(card.id, null);

          if (!result.success) {
            if (result.error === 'Daily super like limit reached') {
              setTimeout(() => {
                Alert.alert(
                  'Super Like Limit Reached',
                  `You've used all ${premiumFeatures.superLikesPerDay || 1} super likes for today. Upgrade to premium for more!`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Upgrade', onPress: () => navigation.navigate('Premium') },
                  ]
                );
              }, 0);
            } else {
              setTimeout(() => {
                Alert.alert('Error', result.error);
              }, 0);
            }
            return;
          }

          // It's automatically a like, so handle as a right swipe
          await handleSwipeRight(card);

          // Show super like feedback (deferred)
          setTimeout(() => {
            Alert.alert('💎 Super Liked!', `${card.name} will definitely see your interest!`, [
              { text: 'Awesome!', style: 'default' },
            ]);
          }, 100);
        } catch (error) {
          logger.error('Error using super like:', error);
          setTimeout(() => {
            Alert.alert('Error', 'Failed to use super like');
          }, 0);
        }
      });
    },
    [userId, premiumFeatures.superLikesPerDay, handleSwipeRight]
  );

  const handleButtonSwipe = useCallback(
    (direction) => {
      if (cards.length > 0 && currentIndex < cards.length) {
        const card = cards[currentIndex];
        if (direction === 'right') {
          handleSwipeRight(card);
        } else {
          handleSwipeLeft(card);
        }
      }
    },
    [cards, currentIndex, handleSwipeRight, handleSwipeLeft]
  );

  const undoLastSwipe = async () => {
    if (lastSwipedCard) {
      try {
        // If we have a swipeId, use the undo method
        if (lastSwipedCard.swipeId) {
          const result = await SwipeController.undoSwipe(userId, lastSwipedCard.swipeId);

          if (!result.success) {
            Alert.alert('Error', result.error || 'Failed to undo swipe');
            return;
          }
        }

        // Restore the card by going back one index
        if (currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
        }

        setLastSwipedCard(null);
        Alert.alert('Success', 'Last swipe has been undone');
      } catch (error) {
        logger.error('Error undoing swipe:', error);
        Alert.alert('Error', 'Failed to undo swipe');
      }
    } else {
      Alert.alert('No Swipe to Undo', 'Undo the current card first');
    }
  };

  // Update swipe counter when undoing
  const undoLastSwipeWithCounter = async () => {
    if (lastSwipedCard) {
      const prevCount = swipesUsedToday > 0 ? swipesUsedToday - 1 : 0;
      await undoLastSwipe();
      setSwipesUsedToday(prevCount);
      if (!isPremium) {
        setSwipesRemaining(Math.max(0, 50 - prevCount));
      }
    }
  };

  const [needsProfile, setNeedsProfile] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      if (!userId) return;
      try {
        // Use repository to get current user profile
        const userData = await userRepository.getCurrentUser(userId);
        setNeedsProfile(!userData?.name || !userData?.photoURL);
      } catch (error) {
        logger.error('Error checking profile:', error);
        setNeedsProfile(false); // Don't block on error
      }
    };
    checkProfile();
  }, [userId, userRepository]);

  if (needsProfile) {
    return (
      <LinearGradient colors={Colors.gradient.primary} style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
            style={styles.emptyCard}
          >
            <Ionicons name="person-add-outline" size={80} color={Colors.background.white} />
            <Text style={styles.emptyTitle}>Complete Your Profile</Text>
            <Text style={styles.emptyText}>
              Add your name, photo, and bio to start matching with others!
            </Text>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.background.white, Colors.background.light]}
                style={styles.actionButtonGradient}
              >
                <Ionicons
                  name="person"
                  size={20}
                  color={Colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.actionButtonText}>Go to Profile</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={theme.gradient.primary} style={styles.container}>
      {/* Animations */}
      <MicroAnimations.HeartAnimation
        visible={showHeartAnimation}
        onComplete={() => setShowHeartAnimation(false)}
      />
      <MicroAnimations.SuccessAnimation
        visible={showSuccessAnimation}
        message={successMessage}
        onComplete={() => setShowSuccessAnimation(false)}
      />

      {/* Premium Status Header */}
      <View style={styles.premiumHeader}>
        <View style={styles.headerLeftSection}>
          {isPremium ? (
            <LinearGradient colors={Colors.gradient.gold} style={styles.premiumBadge}>
              <Ionicons name="diamond" size={16} color={Colors.background.white} />
              <Text style={styles.premiumText}>PREMIUM</Text>
            </LinearGradient>
          ) : (
            <TouchableOpacity
              style={styles.upgradePrompt}
              onPress={() => navigation.navigate('Premium')}
            >
              <Ionicons name="diamond-outline" size={16} color={Colors.accent.gold} />
              <Text style={styles.upgradeText}>Upgrade</Text>
            </TouchableOpacity>
          )}

          {!isPremium && (
            <View style={styles.swipeLimitBadge}>
              <Ionicons name="flame" size={14} color={Colors.accent.red} />
              <Text style={styles.swipeLimitText}>{swipesRemaining}/50</Text>
            </View>
          )}
        </View>

        <View style={styles.headerRightSection}>
          {userLocation && (
            <View style={styles.locationBadge}>
              <Ionicons name="location" size={14} color={Colors.accent.red} />
              <Text style={styles.locationText}>{userLocation.latitude.toFixed(2)}°</Text>
            </View>
          )}
          <View style={styles.superLikeCounter}>
            <Ionicons name="star" size={16} color={Colors.accent.teal} />
            <Text style={styles.counterText}>
              {Math.max(0, (premiumFeatures.superLikesPerDay || 1) - superLikesUsed)} left
            </Text>
          </View>
        </View>
      </View>

      {/* AI Features Quick Access */}
      {isPremium && (
        <View style={styles.aiQuickAccessContainer}>
          <View style={styles.aiHeaderRow}>
            <Ionicons name="sparkles" size={18} color={Colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.aiQuickAccessTitle}>AI Insights</Text>
          </View>
          <View style={styles.aiButtonsGrid}>
            <TouchableOpacity
              style={styles.aiQuickButton}
              onPress={() =>
                navigation.navigate('ViewProfile', {
                  userId: cards[currentIndex]?.id,
                  showCompatibility: true,
                })
              }
              activeOpacity={0.7}
            >
              <Ionicons name="heart" size={20} color={Colors.accent.red} />
              <Text style={styles.aiButtonLabel}>Compatibility</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.aiQuickButton}
              onPress={() =>
                navigation.navigate('Premium', {
                  feature: 'conversationStarters',
                  targetUserId: cards[currentIndex]?.id,
                })
              }
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubbles" size={20} color={Colors.accent.teal} />
              <Text style={styles.aiButtonLabel}>Talk Tips</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.aiQuickButton}
              onPress={() =>
                navigation.navigate('EditProfile', {
                  feature: 'bioSuggestions',
                })
              }
              activeOpacity={0.7}
            >
              <Ionicons name="create" size={20} color={Colors.accent.gold} />
              <Text style={styles.aiButtonLabel}>Bio Ideas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.aiQuickButton}
              onPress={() =>
                navigation.navigate('Premium', {
                  feature: 'smartPhotos',
                })
              }
              activeOpacity={0.7}
            >
              <Ionicons name="image" size={20} color={Colors.primary} />
              <Text style={styles.aiButtonLabel}>Photo Tips</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {loading
          ? // Show skeleton cards while loading
            Array.from({ length: 3 }).map((_, index) => (
              <SkeletonCard key={`skeleton-${index}`} style={{ marginBottom: 15 }} />
            ))
          : cards.length > 0 &&
            cards
              .slice(currentIndex, currentIndex + 3)
              .map((card, index) => (
                <SwipeCard
                  key={card.id}
                  card={card}
                  index={currentIndex + index}
                  onSwipeLeft={handleSwipeLeft}
                  onSwipeRight={handleSwipeRight}
                  onViewProfile={() => navigation.navigate('ViewProfile', { userId: card.id })}
                />
              ))}

        {currentIndex >= cards.length && cards.length > 0 && (
          <View style={styles.emptyContainer}>
            <LinearGradient colors={Colors.gradient.primary} style={styles.emptyCard}>
              <Ionicons name="checkmark-circle" size={80} color={Colors.background.white} />
              <Text style={styles.emptyTitle}>You&apos;re all caught up!</Text>
              <Text style={styles.emptyText}>
                You&apos;ve seen all available profiles.{'\n'}
                Pull down to refresh and see new matches.
              </Text>
              <TouchableOpacity style={styles.actionButton} onPress={onRefresh} activeOpacity={0.8}>
                <LinearGradient
                  colors={[Colors.background.white, Colors.background.light]}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons
                    name="refresh"
                    size={20}
                    color={Colors.primary}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.actionButtonText}>Refresh</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {cards.length === 0 && !loading && (
          <View style={styles.emptyContainer}>
            <LinearGradient colors={Colors.gradient.primary} style={styles.emptyCard}>
              <Ionicons name="people-outline" size={80} color={Colors.background.white} />
              <Text style={styles.emptyTitle}>No profiles yet</Text>
              <Text style={styles.emptyText}>
                Be the first to create a profile!{'\n'}
                Tell your friends to join too.
              </Text>
              <TouchableOpacity style={styles.actionButton} onPress={onRefresh} activeOpacity={0.8}>
                <LinearGradient
                  colors={[Colors.background.white, Colors.background.light]}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons
                    name="refresh"
                    size={20}
                    color={Colors.primary}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.actionButtonText}>Refresh</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {cards.length > 0 && currentIndex < cards.length && (
        <View style={styles.actionButtonsContainer}>
          {lastSwipedCard && (
            <TouchableOpacity
              style={styles.undoButton}
              onPress={undoLastSwipeWithCounter}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-undo" size={24} color={Colors.primary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.dislikeButton}
            onPress={() => handleButtonSwipe('left')}
            activeOpacity={0.8}
          >
            <LinearGradient colors={Colors.gradient.red} style={styles.actionButtonCircle}>
              <Ionicons name="close" size={32} color={Colors.background.white} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.superLikeButton,
              superLikesUsed >= (premiumFeatures.superLikesPerDay || 1) && styles.disabledButton,
            ]}
            onPress={() => {
              if (
                superLikesUsed < (premiumFeatures.superLikesPerDay || 1) &&
                cards.length > 0 &&
                currentIndex < cards.length
              ) {
                handleSuperLike(cards[currentIndex]);
              } else if (superLikesUsed >= (premiumFeatures.superLikesPerDay || 1)) {
                Alert.alert(
                  'Super Like Limit',
                  "You've reached your daily limit. Upgrade to premium for unlimited super likes!",
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Upgrade', onPress: () => navigation.navigate('Premium') },
                  ]
                );
              }
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                superLikesUsed >= (premiumFeatures.superLikesPerDay || 1)
                  ? Colors.gradient.disabled
                  : Colors.gradient.teal
              }
              style={styles.actionButtonCircle}
            >
              <Ionicons name="star" size={28} color={Colors.background.white} />
            </LinearGradient>
            {superLikesUsed >= (premiumFeatures.superLikesPerDay || 1) && (
              <View style={styles.limitBadge}>
                <Ionicons name="lock-closed" size={12} color={Colors.background.white} />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => handleButtonSwipe('right')}
            activeOpacity={0.8}
          >
            <LinearGradient colors={Colors.gradient.primary} style={styles.actionButtonCircle}>
              <Ionicons name="heart" size={32} color={Colors.background.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.primary,
    },
    premiumHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 10,
    },
    premiumBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 15,
      shadowColor: Colors.accent.gold,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    premiumText: {
      color: theme.text.inverse,
      fontSize: 12,
      fontWeight: '800',
      marginLeft: 4,
    },
    headerLeftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    swipeLimitBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.isDark ? 'rgba(242, 139, 130, 0.1)' : 'rgba(255, 107, 107, 0.1)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.interactive.danger,
    },
    swipeLimitText: {
      color: theme.interactive.danger,
      fontSize: 12,
      fontWeight: '700',
      marginLeft: 4,
    },
    upgradePrompt: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 215, 0, 0.1)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: Colors.accent.gold,
    },
    upgradeText: {
      color: Colors.accent.gold,
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    locationBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 107, 107, 0.1)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginRight: 8,
    },
    locationText: {
      color: Colors.accent.red,
      fontSize: 11,
      fontWeight: '600',
      marginLeft: 4,
    },
    headerRightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    superLikeCounter: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(78, 205, 196, 0.1)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    counterText: {
      color: Colors.accent.teal,
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    scrollContent: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 20,
      paddingBottom: 100,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 20,
      fontSize: 18,
      color: Colors.background.white,
      fontWeight: '600',
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      minHeight: 400,
    },
    emptyCard: {
      width: SCREEN_WIDTH - 40,
      borderRadius: 30,
      padding: 40,
      alignItems: 'center',
      shadowColor: Colors.text.primary,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 15,
    },
    emptyTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: Colors.background.white,
      marginTop: 20,
      marginBottom: 15,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: Colors.text.white90,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 20,
    },
    actionButton: {
      borderRadius: 25,
      overflow: 'hidden',
      marginTop: 10,
    },
    actionButtonGradient: {
      flexDirection: 'row',
      paddingVertical: 12,
      paddingHorizontal: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionButtonText: {
      color: Colors.primary,
      fontSize: 16,
      fontWeight: '700',
    },
    actionButtonsContainer: {
      position: 'absolute',
      bottom: 30,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      gap: 15,
    },
    undoButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: Colors.background.white,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: Colors.text.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 5,
      marginRight: 10,
    },
    dislikeButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      overflow: 'hidden',
      shadowColor: Colors.accent.red,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    superLikeButton: {
      width: 55,
      height: 55,
      borderRadius: 27.5,
      overflow: 'hidden',
      shadowColor: Colors.accent.teal,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    likeButton: {
      width: 70,
      height: 70,
      borderRadius: 35,
      overflow: 'hidden',
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    actionButtonCircle: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    disabledButton: {
      opacity: 0.6,
    },
    limitBadge: {
      position: 'absolute',
      top: -5,
      right: -5,
      backgroundColor: Colors.accent.red,
      borderRadius: 10,
      width: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: Colors.background.white,
    },
    aiQuickAccessContainer: {
      backgroundColor: Colors.background.white,
      borderBottomWidth: 1,
      borderBottomColor: Colors.background.light,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    aiHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    aiQuickAccessTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors.text.dark,
    },
    aiButtonsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
    },
    aiQuickButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 10,
      backgroundColor: Colors.background.lightest,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: Colors.border.gray,
    },
    aiButtonLabel: {
      fontSize: 11,
      fontWeight: '500',
      color: Colors.text.dark,
      marginTop: 6,
      textAlign: 'center',
    },
    gamificationSection: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.background.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border.light,
    },
  });

export default HomeScreen;
