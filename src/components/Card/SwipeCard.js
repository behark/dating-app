import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ProgressiveImage from '../Common/ProgressiveImage';
import { LocationService } from '../../services/LocationService';
import { VerificationService } from '../../services/VerificationService';

// Only import gesture handlers on native platforms
const PanGestureHandler =
  Platform.OS !== 'web' ? require('react-native-gesture-handler').PanGestureHandler : View;

const Animated =
  Platform.OS !== 'web'
    ? require('react-native-reanimated').default
    : require('react-native').Animated;

const {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} =
  Platform.OS !== 'web'
    ? require('react-native-reanimated')
    : {
        useAnimatedGestureHandler: () => ({}),
        useAnimatedStyle: () => ({}),
        useSharedValue: (val) => ({ value: val }),
        withSpring: (val) => val,
        withTiming: (val) => val,
        runOnJS: (fn) => fn,
        Easing: { inOut: () => ({}) },
      };

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.75;
// CARD_SPACING removed - unused

const SwipeCard = ({ card, onSwipeLeft, onSwipeRight, onViewProfile }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const rotation = useSharedValue(0);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      translateX.value = ctx.startX + event.translationX;
      translateY.value = ctx.startY + event.translationY;

      rotation.value = translateX.value / 20;
      // Smoother scale effect
      const absTranslateX = Math.abs(translateX.value);
      scale.value = Math.max(0.8, 1 - absTranslateX / 2000);
    },
    onEnd: () => {
      const shouldSwipeLeft = translateX.value < -SWIPE_THRESHOLD;
      const shouldSwipeRight = translateX.value > SWIPE_THRESHOLD;

      if (shouldSwipeLeft) {
        // Smooth exit animation to the left
        translateX.value = withSpring(-SCREEN_WIDTH * 1.5, {
          damping: 10,
          mass: 1,
          overshootClamping: true,
        });
        rotation.value = withTiming(-45, {
          duration: 400,
          easing: Easing.inOut(Easing.ease),
        });
        opacity.value = withTiming(0, {
          duration: 300,
          easing: Easing.inOut(Easing.ease),
        });
        runOnJS(onSwipeLeft)(card);
      } else if (shouldSwipeRight) {
        // Smooth exit animation to the right
        translateX.value = withSpring(SCREEN_WIDTH * 1.5, {
          damping: 10,
          mass: 1,
          overshootClamping: true,
        });
        rotation.value = withTiming(45, {
          duration: 400,
          easing: Easing.inOut(Easing.ease),
        });
        opacity.value = withTiming(0, {
          duration: 300,
          easing: Easing.inOut(Easing.ease),
        });
        runOnJS(onSwipeRight)(card);
      } else {
        // Spring back to center
        translateX.value = withSpring(0, { damping: 15, mass: 1 });
        translateY.value = withSpring(0, { damping: 15, mass: 1 });
        rotation.value = withSpring(0, { damping: 15, mass: 1 });
        scale.value = withSpring(1, { damping: 15, mass: 1 });
      }
    },
  });

  const cardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation.value}deg` },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  const likeOpacity = useAnimatedStyle(() => {
    const opacity = translateX.value > 0 ? Math.min(translateX.value / SWIPE_THRESHOLD, 1) : 0;
    return { opacity };
  });

  const nopeOpacity = useAnimatedStyle(() => {
    const opacity =
      translateX.value < 0 ? Math.min(Math.abs(translateX.value) / SWIPE_THRESHOLD, 1) : 0;
    return { opacity };
  });

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.card, cardStyle]} testID="swipe-card">
        <ProgressiveImage
          source={{ uri: card.photoURL || 'https://via.placeholder.com/400' }}
          style={styles.image}
        />

        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => onViewProfile && onViewProfile()}
          activeOpacity={0.8}
          testID="info-button"
        >
          <LinearGradient
            colors={['rgba(102, 126, 234, 0.9)', 'rgba(118, 75, 162, 0.9)']}
            style={styles.infoButtonGradient}
          >
            <Ionicons name="information-circle" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
          locations={[0.4, 0.7, 1]}
          style={styles.gradientOverlay}
        >
          <View style={styles.infoContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{card.name || 'Unknown'}</Text>
              {card.age && <Text style={styles.age}>, {card.age}</Text>}
              {VerificationService.getVerificationBadgeInfo(card).showBadge && (
                <View
                  style={[
                    styles.verificationBadge,
                    {
                      backgroundColor:
                        VerificationService.getVerificationBadgeInfo(card).badgeColor,
                    },
                  ]}
                >
                  <Ionicons
                    name={VerificationService.getVerificationBadgeInfo(card).iconName}
                    size={12}
                    color="#fff"
                  />
                </View>
              )}
            </View>
            {card.distance && (
              <Text style={styles.distance}>
                {LocationService.getLocationDisplayString(card.distance)}
              </Text>
            )}
            {card.bio && (
              <Text style={styles.bio} numberOfLines={3}>
                {card.bio}
              </Text>
            )}
            {!card.bio && <Text style={styles.bioPlaceholder}>No bio yet</Text>}
          </View>
        </LinearGradient>

        {/* Like Label */}
        <Animated.View style={[styles.likeLabel, likeOpacity]}>
          <LinearGradient colors={['#4ECDC4', '#44A08D']} style={styles.labelGradient}>
            <Text style={styles.likeText}>LIKE</Text>
          </LinearGradient>
        </Animated.View>

        {/* Nope Label */}
        <Animated.View style={[styles.nopeLabel, nopeOpacity]}>
          <LinearGradient colors={['#FF6B6B', '#EE5A6F']} style={styles.labelGradient}>
            <Text style={styles.nopeText}>NOPE</Text>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 40,
    height: CARD_HEIGHT,
    borderRadius: 30,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  infoButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  infoButtonGradient: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
    justifyContent: 'flex-end',
    padding: 25,
    paddingTop: 40,
  },
  infoContainer: {
    paddingBottom: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
    ...Platform.select({
      web: {
        textShadow: '0px 2px 4px rgba(0, 0, 0, 0.5)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
      },
    }),
  },
  age: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
    opacity: 0.9,
    ...Platform.select({
      web: {
        textShadow: '0px 2px 4px rgba(0, 0, 0, 0.5)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
      },
    }),
  },
  verificationBadge: {
    marginLeft: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  distance: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    ...Platform.select({
      web: {
        textShadow: '0px 1px 2px rgba(0, 0, 0, 0.5)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      },
    }),
  },
  bio: {
    fontSize: 17,
    color: '#fff',
    lineHeight: 24,
    opacity: 0.95,
    ...Platform.select({
      web: {
        textShadow: '0px 1px 3px rgba(0, 0, 0, 0.5)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      },
    }),
  },
  bioPlaceholder: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.7,
    fontStyle: 'italic',
  },
  likeLabel: {
    position: 'absolute',
    top: 60,
    right: 25,
    transform: [{ rotate: '15deg' }],
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  labelGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  likeText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
    ...Platform.select({
      web: {
        textShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
      },
    }),
  },
  nopeLabel: {
    position: 'absolute',
    top: 60,
    left: 25,
    transform: [{ rotate: '-15deg' }],
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  nopeText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
    ...Platform.select({
      web: {
        textShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
      },
    }),
  },
});

export default SwipeCard;
