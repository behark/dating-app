/* eslint-disable sonarjs/cognitive-complexity */
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  InteractionManager,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import SkeletonCard from '../components/SkeletonCard';
import SwipeCard from '../components/SwipeCard';
import EmptyState from '../../../components/common/EmptyState';
import MicroAnimations from '../../../components/common/MicroAnimations';
import { Colors } from '../../../constants/colors';
import { UI_MESSAGES } from '../../../constants/constants';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { getUserRepository } from '../../../services/repositories';
import AdvancedInteractionsService from '../../../services/AdvancedInteractionsService';
import AnalyticsService from '../../../services/AnalyticsService';
import { GamificationService } from '../../../services/GamificationService';
import { LocationService } from '../../../services/LocationService';
import { PreferencesService } from '../../../services/PreferencesService';
import { PremiumService } from '../../../services/PremiumService';
import { SwipeController } from '../../../services/SwipeController';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { useSwipeActions } from '../../../hooks/useSwipeActions';
import { GuestModeBanner, PremiumHeader, ActionButtons } from '../components';
import HapticFeedback from '../../../utils/haptics';
import logger from '../../../utils/logger';
import LoginScreen from '../../auth/screens/LoginScreen';
import { GUEST_FREE_VIEWS } from '../data/demoProfiles';
import { getStyles } from './HomeScreen.styles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Minimum time between swipes on the same card (ms) - prevents race conditions
const SWIPE_DEBOUNCE_MS = 500;

const HomeScreen = ({ navigation }) => {
  const { currentUser, authToken, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const { isOnline } = useNetworkStatus();
  const { width: windowWidth } = useWindowDimensions();
  const styles = getStyles(theme);

  // Get the user ID (supports both uid and _id) - moved before useSwipeActions
  const userId = currentUser?.uid || currentUser?._id;

  // Guest mode state - only determine after auth loading is complete - moved before useSwipeActions
  const isGuest = !authLoading && !currentUser;
  const [guestViewCount, setGuestViewCount] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginPromptReason, setLoginPromptReason] = useState(null);

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

  // Success animation state
  const [successMessage, setSuccessMessage] = useState('');
  const [showRewardNotification, setShowRewardNotification] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  // Guest mode: Show login prompt helper
  const lastPromptRef = useRef(0);
  const promptLogin = useCallback(
    (reason) => {
      if (showLoginModal) return;
      const now = Date.now();
      if (now - lastPromptRef.current < 2000) return;
      lastPromptRef.current = now;
      setLoginPromptReason(reason);
      setShowLoginModal(true);
      AnalyticsService.logEvent('guest_login_prompt', {
        reason,
        viewCount: guestViewCount,
        profilesViewed: guestViewCount,
      });
    },
    [guestViewCount, showLoginModal]
  );

  // Optimistic UI update function - must be declared before useSwipeActions
  const applySwipeUIOptimistic = useCallback(
    (direction, card) => {
      startTransition(() => {
        setLastSwipedCard({ card, direction, swipeId: null });
        setCurrentIndex((prev) => prev + 1);
        if (!isGuest) {
          setSwipesUsedToday((prev) => {
            const newCount = prev + 1;
            if (!isPremium) {
              setSwipesRemaining(Math.max(0, 50 - newCount));
            }
            return newCount;
          });
        }
      });
    },
    [isGuest, isPremium]
  );

  // Swipe actions hook - must be after userId, isGuest, isPremium, promptLogin, and applySwipeUIOptimistic are declared
  const swipeActions = useSwipeActions({
    userId,
    isPremium,
    navigation,
    isGuest,
    promptLogin,
    onOptimisticUpdate: applySwipeUIOptimistic,
    onMatchFound: (name, matchId) => {
      setSuccessMessage(`🎉 Match with ${name}!`);
      setShowSuccessAnimation(true);
    },
  });

  // Guest mode: Get prompt message based on action
  const getLoginPromptMessage = () => {
    switch (loginPromptReason) {
      case 'swipe':
        return {
          title: '💕 Ready to Match?',
          subtitle: 'Create a free account to start swiping and find your match!',
        };
      case 'like':
        return {
          title: '❤️ Like This Person?',
          subtitle: "Sign up to let them know you're interested!",
        };
      case 'superlike':
        return {
          title: '⭐ Super Like?',
          subtitle: 'Create an account to send Super Likes and stand out!',
        };
      case 'view':
        return {
          title: '👀 Want to See More?',
          subtitle: 'Sign up to view full profiles and photos!',
        };
      case 'limit':
        return {
          title: "🔥 You're on Fire!",
          subtitle: `You've viewed ${guestViewCount} profiles! Sign up free to see unlimited matches and start connecting.`,
        };
      case 'banner':
        return {
          title: '💕 Ready to Match?',
          subtitle: 'Join thousands of singles and start your dating journey today!',
        };
      default:
        return {
          title: 'Join Our Community!',
          subtitle: 'Create a free account to unlock all features and start matching!',
        };
    }
  };

  // Close modal when user logs in
  useEffect(() => {
    if (currentUser && showLoginModal) {
      setShowLoginModal(false);
    }
  }, [currentUser, showLoginModal]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      // Track screen view for analytics
      AnalyticsService.logScreenView('Home');

      // Don't load anything until auth loading is complete
      if (authLoading) {
        setLoading(true);
        return;
      }

      (async () => {
        if (isGuest) {
          // Guest mode: Load demo profiles from database (100 profiles)
          const loc = await initializeLocation({ allowGuest: true });
          if (!isActive) return;
          await loadCards(loc, true); // true = guest mode
          if (!isActive) return;
          return;
        }
        if (userId) {
          const loc = await initializeLocation();
          if (!isActive) return;
          await loadCards(loc);
          if (!isActive) return;
          loadPremiumStatus();
          loadGamificationData();
        }
      })();

      return () => {
        isActive = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, isGuest, authLoading])
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

  const initializeLocation = async ({ allowGuest = false } = {}) => {
    if (!userId && !allowGuest) return null;
    try {
      setLocationUpdating(true);

      // First, try to get location from user profile (in case GPS isn't available)
      let location = null;
      if (userId) {
        try {
          const userData = await userRepository.getCurrentUser(userId);
          if (userData?.location?.coordinates && userData.location.coordinates.length === 2) {
            // User has saved location in profile
            location = {
              latitude: userData.location.coordinates[1], // MongoDB stores as [lng, lat]
              longitude: userData.location.coordinates[0],
              accuracy: null,
            };
            logger.info('Using saved location from user profile', location);
          }
        } catch (profileError) {
          logger.warn('Could not get location from user profile', profileError);
        }
      }

      // If no saved location, try to get current GPS location
      if (!location) {
        const gpsLocation = await LocationService.getCurrentLocation();
        if (gpsLocation) {
          location = gpsLocation;
          if (userId) {
            // Update user location in database
            await LocationService.updateUserLocation(userId, location);
            // Start periodic location updates (every 5 minutes)
            LocationService.startPeriodicLocationUpdates(userId);
          }
        }
      }

      // If still no location, use a better default (NYC where many demo profiles are)
      if (!location) {
        logger.warn('Location not available, using NYC as default location for discovery');
        const defaultLocation = {
          latitude: 40.7128, // New York City (where many demo profiles are)
          longitude: -74.006,
          accuracy: null,
        };
        location = defaultLocation;
      }

      setUserLocation(location);
      return location;
    } catch (error) {
      logger.error('Error initializing location:', error);
      // Use NYC as default location on error (better than 0,0)
      const defaultLocation = {
        latitude: 40.7128, // New York City
        longitude: -74.006,
        accuracy: null,
      };
      setUserLocation(defaultLocation);
      return defaultLocation;
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
      // Stop periodic location updates to prevent memory leak
      LocationService.stopPeriodicLocationUpdates();
    };
  }, []);

  const loadCards = async (loc, isGuestMode = false) => {
    if (!isGuestMode && !userId) {
      setLoading(false);
      return;
    }

    // Check network status before making API calls
    if (!isOnline) {
      setLoading(false);
      Alert.alert(
        'No Internet Connection',
        'Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setLoading(true);

      let availableUsers = [];
      if (isGuestMode) {
        // For guest users, use DiscoveryService to get demo profiles
        const DiscoveryService = (await import('../../../services/DiscoveryService')).default;
        const result = await DiscoveryService.exploreUsers(
          loc?.latitude ?? userLocation?.latitude ?? 40.7128,
          loc?.longitude ?? userLocation?.longitude ?? -74.006,
          {
            radius: discoveryRadius * 1000,
            limit: 50,
            guest: true,
          }
        );
        availableUsers = result || [];
      } else {
        // For authenticated users, use repository to get discoverable users
        availableUsers = await userRepository.getDiscoverableUsers(userId, {
          limit: 50,
          lat: loc?.latitude ?? userLocation?.latitude,
          lng: loc?.longitude ?? userLocation?.longitude,
          radius: discoveryRadius * 1000, // Convert km to meters
        });
      }

      const normalizedUsers = Array.isArray(availableUsers)
        ? availableUsers
        : Array.isArray(availableUsers?.users)
          ? availableUsers.users
          : [];

      if (!Array.isArray(availableUsers) && !Array.isArray(availableUsers?.users)) {
        logger.warn('Discovery payload not an array', {
          source: isGuestMode ? 'guest' : 'auth',
          type: availableUsers === null ? 'null' : typeof availableUsers,
          keys:
            availableUsers && typeof availableUsers === 'object'
              ? Object.keys(availableUsers)
              : null,
        });
      }

      // If no users found, show empty state (no error alert)
      if (normalizedUsers.length === 0) {
        setCards([]);
        setCurrentIndex(0);
        setLoading(false);
        return;
      }

      // Apply user preferences filtering for signed-in users only
      const filteredUsers =
        isGuestMode || !userId
          ? normalizedUsers
          : await PreferencesService.filterUsersForDiscovery(userId, normalizedUsers);

      // Shuffle for variety
      const usersForShuffle = Array.isArray(filteredUsers)
        ? filteredUsers
        : Array.isArray(filteredUsers?.users)
          ? filteredUsers.users
          : [];
      const shuffled = [...usersForShuffle].sort(() => Math.random() - 0.5);
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
    if (!isGuest) {
      userRepository.clearCache();
    }
    await loadCards(null, isGuest);
    setRefreshing(false);
  };

  const reconcileSwipeCounters = useCallback(async () => {
    if (!userId) return;
    try {
      const count = await SwipeController.getSwipesCountToday(userId);
      startTransition(() => {
        setSwipesUsedToday(count);
        if (!isPremium) {
          setSwipesRemaining(Math.max(0, 50 - count));
        }
      });
    } catch (e) {
      logger.error('Error reconciling swipe counters', e);
    }
  }, [userId, isPremium]);

  const handleGuestSwipe = useCallback(
    (direction, reason, card) => {
      if (guestViewCount >= GUEST_FREE_VIEWS) {
        promptLogin('limit');
        return false;
      }

      const newViewCount = guestViewCount + 1;
      setGuestViewCount(newViewCount);
      applySwipeUIOptimistic(direction, card);

      if (newViewCount >= GUEST_FREE_VIEWS) {
        promptLogin('limit');
      } else if (reason) {
        promptLogin(reason);
      }
      return true;
    },
    [guestViewCount, applySwipeUIOptimistic, promptLogin]
  );

  // Swipe handlers using the swipe actions hook
  const handleSwipeRight = useCallback(
    (card) => {
      if (isGuest) {
        handleGuestSwipe('right', 'like', card);
        return;
      }
      swipeActions.handleSwipeRight(card);
    },
    [isGuest, handleGuestSwipe, swipeActions]
  );

  const handleSwipeLeft = useCallback(
    (card) => {
      if (isGuest) {
        handleGuestSwipe('left', null, card);
        return;
      }
      swipeActions.handleSwipeLeft(card);
    },
    [isGuest, handleGuestSwipe, swipeActions]
  );

  const handleSuperLike = useCallback(
    async (card) => {
      // Guest mode: Prompt login for super like
      if (isGuest) {
        promptLogin('superlike');
        return;
      }

      // Heavy haptic for super like
      HapticFeedback.heavyImpact();

      // Defer heavy async work
      InteractionManager.runAfterInteractions(async () => {
        try {
          const interactionsService = new AdvancedInteractionsService(authToken);
          const targetId = card.id || card._id;
          const result = await interactionsService.sendSuperLike(targetId, null);

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

          // Increment used super likes on success
          startTransition(() => {
            setSuperLikesUsed((prev) => prev + 1);
          });

          // Track super like analytics
          AnalyticsService.logSwipe('superlike', targetId);

          // Apply optimistic like UI without double-calling like
          applySwipeUIOptimistic('right', card);
          startTransition(() => {
            setLastSwipedCard({ card, direction: 'right', swipeId: result.swipeId || null });
          });

          // Feedback
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
        } finally {
          await reconcileSwipeCounters();
        }
      });
    },
    [
      premiumFeatures.superLikesPerDay,
      authToken,
      isGuest,
      promptLogin,
      navigation,
      applySwipeUIOptimistic,
      reconcileSwipeCounters,
    ]
  );

  // Guest mode: Handle view profile
  const handleViewProfile = useCallback(
    (card) => {
      if (isGuest) {
        promptLogin('view');
        return;
      }
      // Navigate to profile view for authenticated users
      navigation.navigate('ViewProfile', { profile: card });
    },
    [isGuest, promptLogin, navigation]
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
      await undoLastSwipe();
      await reconcileSwipeCounters();
    }
  };

  const [needsProfile, setNeedsProfile] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      if (!userId) return;
      try {
        // Use repository to get current user profile
        const userData = await userRepository.getCurrentUser(userId);
        // Require both name and photo for production
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
          <EmptyState
            icon="person-add-outline"
            title="Complete Your Profile ✨"
            description="Add your name, photo, and bio to start matching with amazing people!"
            buttonText="Complete Profile"
            onButtonPress={() => {
              HapticFeedback.lightImpact();
              navigation.navigate('Profile');
            }}
            variant="gradient"
            iconSize={80}
          />
        </ScrollView>
      </LinearGradient>
    );
  }

  // Get login prompt content
  const loginPrompt = getLoginPromptMessage();

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

      {/* Guest Mode Banner */}
      {isGuest && (
        <View style={styles.guestBanner}>
          <View style={styles.guestBannerContent}>
            <Ionicons name="eye-outline" size={18} color={Colors.primary} />
            <Text style={styles.guestBannerText}>
              {guestViewCount >= GUEST_FREE_VIEWS ? '🔥 Last chance!' : 'Browsing as Guest'}
            </Text>
            {guestViewCount < GUEST_FREE_VIEWS && (
              <Text style={styles.guestBannerCount}>
                {Math.max(0, GUEST_FREE_VIEWS - guestViewCount)} free views left
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.guestSignUpButton,
              guestViewCount >= GUEST_FREE_VIEWS && styles.guestSignUpButtonUrgent,
            ]}
            onPress={() => promptLogin('banner')}
          >
            <Text style={styles.guestSignUpButtonText}>
              {guestViewCount >= GUEST_FREE_VIEWS ? '🚀 Sign Up Now' : 'Join Free'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Premium Status Header - Only show for authenticated users */}
      {!isGuest && (
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
            <TouchableOpacity
              style={styles.discoveryButton}
              onPress={() => navigation.navigate('TopPicks')}
            >
              <Ionicons name="trophy" size={18} color={Colors.accent.gold} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.discoveryButton}
              onPress={() => navigation.navigate('Explore')}
            >
              <Ionicons name="compass" size={18} color={Colors.accent.teal} />
            </TouchableOpacity>
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
      )}

      {/* AI Features Quick Access */}
      {isPremium && !isGuest && (
        <View style={styles.aiQuickAccessContainer}>
          <View style={styles.aiHeaderRow}>
            <Ionicons
              name="sparkles"
              size={18}
              color={Colors.primary}
              style={styles.aiHeaderIcon}
            />
            <Text style={styles.aiQuickAccessTitle}>AI Insights</Text>
          </View>
          <View style={styles.aiButtonsGrid}>
            <TouchableOpacity
              style={styles.aiQuickButton}
              onPress={() =>
                navigation.navigate('ViewProfile', {
                  userId: cards[currentIndex]?.id || cards[currentIndex]?._id,
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
                  targetUserId: cards[currentIndex]?.id || cards[currentIndex]?._id,
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
        {loading || authLoading
          ? // Show skeleton cards while loading
            Array.from({ length: 3 }).map((_, index) => (
              <SkeletonCard key={`skeleton-${index}`} style={styles.skeletonCardSpacing} />
            ))
          : cards.length > 0 && (
              <View style={styles.cardsContainer}>
                <View style={styles.cardsWrapper}>
                  {cards.slice(currentIndex, currentIndex + 3).map((card, index) => (
                    <SwipeCard
                      key={card.id || card._id}
                      card={card}
                      index={currentIndex + index}
                      onSwipeLeft={handleSwipeLeft}
                      onSwipeRight={handleSwipeRight}
                      onViewProfile={() =>
                        navigation.navigate('ViewProfile', { userId: card.id || card._id })
                      }
                    />
                  ))}
                </View>
              </View>
            )}

        {currentIndex >= cards.length && cards.length > 0 && (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="checkmark-circle"
              title="You're All Caught Up! ✨"
              description="You've seen all available profiles. Pull down to refresh and discover new matches!"
              buttonText="Refresh"
              onButtonPress={() => {
                HapticFeedback.lightImpact();
                onRefresh();
              }}
              secondaryButtonText="Adjust Filters"
              onSecondaryButtonPress={() => {
                HapticFeedback.lightImpact();
                navigation.navigate('Preferences');
              }}
              variant="gradient"
              iconSize={80}
            />
          </View>
        )}

        {cards.length === 0 && !loading && (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="people-outline"
              title={isGuest ? 'Preview Mode 👋' : 'No Profiles Yet 🌟'}
              description={
                isGuest
                  ? "You're viewing in guest mode. Sign up to see real profiles and start matching!"
                  : 'Check back soon for new profiles, or adjust your preferences to see more matches!'
              }
              buttonText={isGuest ? 'Sign Up Free' : 'Adjust Preferences'}
              onButtonPress={() => {
                HapticFeedback.lightImpact();
                if (isGuest) {
                  promptLogin('view');
                } else {
                  navigation.navigate('Preferences');
                }
              }}
              secondaryButtonText="Refresh"
              onSecondaryButtonPress={() => {
                HapticFeedback.lightImpact();
                onRefresh();
              }}
              variant="gradient"
              iconSize={80}
            />
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

      {/* Guest Login Modal */}
      <Modal
        visible={showLoginModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowLoginModal(false)}
        accessibilityLabel="Sign up or login dialog"
      >
        <View style={styles.loginModalContainer}>
          <View style={styles.loginModalHeader}>
            <TouchableOpacity
              onPress={() => setShowLoginModal(false)}
              style={styles.loginModalCloseButton}
            >
              <Ionicons name="close" size={28} color={Colors.text.dark} />
            </TouchableOpacity>
            <Text style={styles.loginModalTitle}>{loginPrompt.title}</Text>
            <Text style={styles.loginModalSubtitle}>{loginPrompt.subtitle}</Text>
          </View>
          <View style={styles.loginModalContent}>
            <LoginScreen navigation={navigation} onAuthSuccess={() => setShowLoginModal(false)} />
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

export default HomeScreen;
