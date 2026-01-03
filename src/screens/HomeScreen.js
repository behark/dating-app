import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { startTransition, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Dimensions, InteractionManager, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SwipeCard from '../components/Card/SwipeCard';
import { useAuth } from '../context/AuthContext';
import { getUserRepository } from '../repositories';
import { GamificationService } from '../services/GamificationService';
import { LocationService } from '../services/LocationService';
import { PreferencesService } from '../services/PreferencesService';
import { PremiumService } from '../services/PremiumService';
import { SwipeController } from '../services/SwipeController';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { currentUser, authToken } = useAuth();
  
  // Get the user repository (API or Firebase based on config)
  const userRepository = useMemo(() => getUserRepository(authToken), [authToken]);
  
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
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
  const [showRewardNotification, setShowRewardNotification] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  // Get the user ID (supports both uid and _id)
  const userId = currentUser?.uid || currentUser?._id;

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        loadCards();
        loadPremiumStatus();
        loadGamificationData();
        initializeLocation();
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
      console.error('Error loading gamification data:', error);
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
      }
    } catch (error) {
      console.error('Error initializing location:', error);
    } finally {
      setLocationUpdating(false);
    }
  };

  const loadPremiumStatus = async () => {
    if (!userId) return;
    try {
      const premiumStatus = await PremiumService.checkPremiumStatus(userId);
      setIsPremium(premiumStatus.isPremium);
      setPremiumFeatures(premiumStatus.features);

      const superLikesCount = await PremiumService.getSuperLikesUsedToday(userId);
      setSuperLikesUsed(superLikesCount);

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
      console.error('Error loading premium status:', error);
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
        radius: discoveryRadius * 1000 // Convert km to meters
      });
      
      // If no users found, show empty state (no error alert)
      if (availableUsers.length === 0) {
        setCards([]);
        setCurrentIndex(0);
        setLoading(false);
        return;
      }

      // Apply user preferences filtering
      const filteredUsers = await PreferencesService.filterUsersForDiscovery(userId, availableUsers);

      // Shuffle for variety
      const shuffled = filteredUsers.sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setCurrentIndex(0);
      setLoading(false);
    } catch (error) {
      console.error('Error loading cards:', error);
      // Repository returns empty array on error, so this catch is for other errors
      // Don't show alert - just show empty state
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

  const handleSwipeRight = useCallback(async (card) => {
    // Immediately update UI (non-blocking)
    startTransition(() => {
      setLastSwipedCard({ card, direction: 'right', swipeId: null });
      setCurrentIndex(prev => prev + 1);
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
          setTimeout(() => {
            Alert.alert(
              'Daily Limit Reached',
              `You've reached your daily swipe limit (50). Upgrade to Premium for unlimited swipes!`,
              [
                { text: 'Keep Going', style: 'cancel' },
                { text: 'Upgrade', onPress: () => navigation.navigate('Premium') }
              ]
            );
          }, 0);
          return;
        }
      
        // Use SwipeController to save the swipe and check for matches
        const result = await SwipeController.saveSwipe(userId, card.id, 'like', isPremium);

        if (!result.success) {
          if (result.limitExceeded) {
            setTimeout(() => {
              Alert.alert(
                'Daily Limit Reached',
                `You've reached your daily swipe limit. ${result.remaining} swipes left tomorrow!`
              );
            }, 0);
          } else {
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
            console.error('Error tracking swipe for gamification:', error);
          }
        }, 100);

        // If it's a match, show the match alert (deferred)
        if (result.match && result.matchId) {
          setTimeout(() => {
            Alert.alert(
              '🎉 It\'s a Match!',
              `You and ${card.name} liked each other!`,
              [
                { text: 'Keep Swiping', style: 'cancel' },
                {
                  text: 'View Match',
                  onPress: () => navigation.navigate('Matches')
                }
              ]
            );
          }, 500);
        }
      } catch (error) {
        console.error('Error handling swipe:', error);
        setTimeout(() => {
          Alert.alert('Error', 'Failed to process swipe');
        }, 0);
      }
    });
  }, [userId, isPremium, swipesUsedToday, navigation]);

  const handleSwipeLeft = useCallback(async (card) => {
    // Immediately update UI (non-blocking)
    startTransition(() => {
      setLastSwipedCard({ card, direction: 'left', swipeId: null });
      setCurrentIndex(prev => prev + 1);
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
          setTimeout(() => {
            Alert.alert(
              'Daily Limit Reached',
              `You've reached your daily swipe limit (50). Upgrade to Premium for unlimited swipes!`,
              [
                { text: 'Keep Going', style: 'cancel' },
                { text: 'Upgrade', onPress: () => navigation.navigate('Premium') }
              ]
            );
          }, 0);
          return;
        }
      
        // Use SwipeController to save the dislike
        const result = await SwipeController.saveSwipe(userId, card.id, 'dislike', isPremium);

        if (!result.success) {
          if (result.limitExceeded) {
            setTimeout(() => {
              Alert.alert(
                'Daily Limit Reached',
                `You've reached your daily swipe limit. ${result.remaining} swipes left tomorrow!`
              );
            }, 0);
          } else {
            console.error('Error saving swipe:', result.error);
          }
          // Continue anyway to update UI
        }

        // Update lastSwipedCard with swipeId for undo functionality (non-blocking)
        startTransition(() => {
          setLastSwipedCard({ card, direction: 'left', swipeId: result.swipeId });
        });
      } catch (error) {
        console.error('Error handling swipe:', error);
      }
    });
  }, [userId, isPremium, swipesUsedToday, navigation]);

  const handleSuperLike = useCallback(async (card) => {
    // Immediately update UI
    startTransition(() => {
      setSuperLikesUsed(prev => prev + 1);
    });

    // Defer heavy async work
    InteractionManager.runAfterInteractions(async () => {
      try {
        const result = await PremiumService.useSuperLike(userId, card.id);

        if (!result.success) {
          if (result.error === 'Daily super like limit reached') {
            setTimeout(() => {
              Alert.alert(
                'Super Like Limit Reached',
                `You've used all ${premiumFeatures.superLikesPerDay || 1} super likes for today. Upgrade to premium for more!`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Upgrade', onPress: () => {/* TODO: Navigate to premium screen */} }
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
          Alert.alert(
            '💎 Super Liked!',
            `${card.name} will definitely see your interest!`,
            [{ text: 'Awesome!', style: 'default' }]
          );
        }, 100);
      } catch (error) {
        console.error('Error using super like:', error);
        setTimeout(() => {
          Alert.alert('Error', 'Failed to use super like');
        }, 0);
      }
    });
  }, [userId, premiumFeatures.superLikesPerDay, handleSwipeRight]);

  const handleButtonSwipe = useCallback((direction) => {
    if (cards.length > 0 && currentIndex < cards.length) {
      const card = cards[currentIndex];
      if (direction === 'right') {
        handleSwipeRight(card);
      } else {
        handleSwipeLeft(card);
      }
    }
  }, [cards, currentIndex, handleSwipeRight, handleSwipeLeft]);

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
        console.error('Error undoing swipe:', error);
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

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="heart" size={60} color="#fff" />
          <Text style={styles.loadingText}>Finding your matches...</Text>
        </View>
      </LinearGradient>
    );
  }

  const [needsProfile, setNeedsProfile] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      if (!userId) return;
      try {
        // Use repository to get current user profile
        const userData = await userRepository.getCurrentUser(userId);
        setNeedsProfile(!userData?.name || !userData?.photoURL);
      } catch (error) {
        console.error('Error checking profile:', error);
        setNeedsProfile(false); // Don't block on error
      }
    };
    checkProfile();
  }, [userId, userRepository]);

  if (needsProfile) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
            style={styles.emptyCard}
          >
            <Ionicons name="person-add-outline" size={80} color="#fff" />
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
                colors={['#fff', '#f0f0f0']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="person" size={20} color="#667eea" style={{ marginRight: 8 }} />
                <Text style={styles.actionButtonText}>Go to Profile</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#f5f7fa', '#c3cfe2']} style={styles.container}>
      {/* Premium Status Header */}
      <View style={styles.premiumHeader}>
        <View style={styles.headerLeftSection}>
          {isPremium ? (
            <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.premiumBadge}>
              <Ionicons name="diamond" size={16} color="#fff" />
              <Text style={styles.premiumText}>PREMIUM</Text>
            </LinearGradient>
          ) : (
            <TouchableOpacity
              style={styles.upgradePrompt}
              onPress={() => navigation.navigate('Premium')}
            >
              <Ionicons name="diamond-outline" size={16} color="#FFD700" />
              <Text style={styles.upgradeText}>Upgrade</Text>
            </TouchableOpacity>
          )}

          {!isPremium && (
            <View style={styles.swipeLimitBadge}>
              <Ionicons name="flame" size={14} color="#FF6B6B" />
              <Text style={styles.swipeLimitText}>{swipesRemaining}/50</Text>
            </View>
          )}
        </View>

        <View style={styles.headerRightSection}>
          {userLocation && (
            <View style={styles.locationBadge}>
              <Ionicons name="location" size={14} color="#FF6B6B" />
              <Text style={styles.locationText}>
                {userLocation.latitude.toFixed(2)}°
              </Text>
            </View>
          )}
          <View style={styles.superLikeCounter}>
            <Ionicons name="star" size={16} color="#4ECDC4" />
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
            <Ionicons name="sparkles" size={18} color="#667eea" style={{ marginRight: 8 }} />
            <Text style={styles.aiQuickAccessTitle}>AI Insights</Text>
          </View>
          <View style={styles.aiButtonsGrid}>
            <TouchableOpacity 
              style={styles.aiQuickButton}
              onPress={() => navigation.navigate('ViewProfile', { 
                userId: cards[currentIndex]?.id,
                showCompatibility: true 
              })}
              activeOpacity={0.7}
            >
              <Ionicons name="heart" size={20} color="#FF6B6B" />
              <Text style={styles.aiButtonLabel}>Compatibility</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.aiQuickButton}
              onPress={() => navigation.navigate('Premium', { 
                feature: 'conversationStarters',
                targetUserId: cards[currentIndex]?.id
              })}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubbles" size={20} color="#4ECDC4" />
              <Text style={styles.aiButtonLabel}>Talk Tips</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.aiQuickButton}
              onPress={() => navigation.navigate('EditProfile', { 
                feature: 'bioSuggestions'
              })}
              activeOpacity={0.7}
            >
              <Ionicons name="create" size={20} color="#FFD700" />
              <Text style={styles.aiButtonLabel}>Bio Ideas</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.aiQuickButton}
              onPress={() => navigation.navigate('Premium', { 
                feature: 'smartPhotos'
              })}
              activeOpacity={0.7}
            >
              <Ionicons name="image" size={20} color="#667eea" />
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
        {cards.length > 0 && cards.slice(currentIndex, currentIndex + 3).map((card, index) => (
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
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.emptyCard}
            >
              <Ionicons name="checkmark-circle" size={80} color="#fff" />
              <Text style={styles.emptyTitle}>You're all caught up!</Text>
              <Text style={styles.emptyText}>
                You've seen all available profiles.{'\n'}
                Pull down to refresh and see new matches.
              </Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onRefresh}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#fff', '#f0f0f0']}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="refresh" size={20} color="#667eea" style={{ marginRight: 8 }} />
                  <Text style={styles.actionButtonText}>Refresh</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}
        
        {cards.length === 0 && !loading && (
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.emptyCard}
            >
              <Ionicons name="people-outline" size={80} color="#fff" />
              <Text style={styles.emptyTitle}>No profiles yet</Text>
              <Text style={styles.emptyText}>
                Be the first to create a profile!{'\n'}
                Tell your friends to join too.
              </Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onRefresh}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#fff', '#f0f0f0']}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="refresh" size={20} color="#667eea" style={{ marginRight: 8 }} />
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
              <Ionicons name="arrow-undo" size={24} color="#667eea" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.dislikeButton}
            onPress={() => handleButtonSwipe('left')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF6B6B', '#EE5A6F']}
              style={styles.actionButtonCircle}
            >
              <Ionicons name="close" size={32} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.superLikeButton,
              superLikesUsed >= (premiumFeatures.superLikesPerDay || 1) && styles.disabledButton,
            ]}
            onPress={() => {
              if (superLikesUsed < (premiumFeatures.superLikesPerDay || 1) && cards.length > 0 && currentIndex < cards.length) {
                handleSuperLike(cards[currentIndex]);
              } else if (superLikesUsed >= (premiumFeatures.superLikesPerDay || 1)) {
                Alert.alert(
                  'Super Like Limit',
                  'You\'ve reached your daily limit. Upgrade to premium for unlimited super likes!',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Upgrade', onPress: () => navigation.navigate('Premium') }
                  ]
                );
              }
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                superLikesUsed >= (premiumFeatures.superLikesPerDay || 1)
                  ? ['#ccc', '#bbb']
                  : ['#4ECDC4', '#44A08D']
              }
              style={styles.actionButtonCircle}
            >
              <Ionicons name="star" size={28} color="#fff" />
            </LinearGradient>
            {superLikesUsed >= (premiumFeatures.superLikesPerDay || 1) && (
              <View style={styles.limitBadge}>
                <Ionicons name="lock-closed" size={12} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => handleButtonSwipe('right')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.actionButtonCircle}
            >
              <Ionicons name="heart" size={32} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  premiumText: {
    color: '#fff',
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
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  swipeLimitText: {
    color: '#FF6B6B',
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
    borderColor: '#FFD700',
  },
  upgradeText: {
    color: '#FFD700',
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
    color: '#FF6B6B',
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
    color: '#4ECDC4',
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
    color: '#fff',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginTop: 20,
    marginBottom: 15,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
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
    color: '#667eea',
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
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
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
    shadowColor: '#FF6B6B',
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
    shadowColor: '#4ECDC4',
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
    shadowColor: '#667eea',
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
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  aiQuickAccessContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    color: '#333',
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
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  aiButtonLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#333',
    marginTop: 6,
    textAlign: 'center',
  },
  gamificationSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
});

export default HomeScreen;
