import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useRef, useMemo } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Colors } from '../../../constants/colors';
import DESIGN_TOKENS from '../../../constants/designTokens';
import { shadowToWebBoxShadow } from '../../../utils/stylePlatform';
import { UniversalImage } from '../../../components/Image';
import { LocationService } from '../../../services/LocationService';
import { VerificationService } from '../../../services/VerificationService';

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
const SWIPE_THRESHOLD = 100; // Lowered from 120 for more responsive swipe feel
// CARD_SPACING removed - unused
const PLACEHOLDER_CARD = require('../../../../assets/feature-graphic.png');

const SwipeCard = memo(
  ({ card, index = 0, onSwipeLeft, onSwipeRight, onViewProfile }) => {
    // Use dynamic dimensions for better web support
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    // On web, use window dimensions; on native use static dimensions
    const screenWidth = Platform.OS === 'web' ? windowWidth || SCREEN_WIDTH : SCREEN_WIDTH;
    const cardHeight =
      (Platform.OS === 'web' ? windowHeight || SCREEN_HEIGHT : SCREEN_HEIGHT) * 0.75;

    // Calculate card dimensions - use actual window width
    const cardWidth = Math.max(320, screenWidth - 48); // Ensure minimum width and padding
    // Calculate center position: parent is 100% width, so center is (100% - cardWidth) / 2
    // Since parent uses 100% width, we calculate based on screenWidth but account for any padding
    // The parent has no horizontal padding, so we can use screenWidth directly
    const cardLeft = (screenWidth - cardWidth) / 2;

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
          translateX.value = withSpring(-screenWidth * 1.5, {
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
          translateX.value = withSpring(screenWidth * 1.5, {
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

    // Card dimensions for styling
    const cardRef = useRef(null);

    // Memoize verification badge info to avoid recalculating 3 times per render
    const verificationBadge = useMemo(
      () => VerificationService.getVerificationBadgeInfo(card),
      [card]
    );

    return (
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View
          ref={cardRef}
          style={[
            styles.card,
            {
              // Apply dimensions
              width: cardWidth,
              height: cardHeight,
              // Ensure proper stacking order (lower index = on top)
              zIndex: 1000 - index,
              // Use auto-centering approach
              ...Platform.select({
                web: {
                  // On web, use CSS centering: left: 50% with negative margin
                  left: '50%',
                  marginLeft: -(cardWidth / 2), // Offset by half width to center perfectly
                  marginRight: 0,
                },
                default: {
                  // On native, calculate left position
                  left: (screenWidth - cardWidth) / 2,
                },
              }),
            },
            // Apply animated transforms
            cardStyle,
          ]}
          testID="swipe-card"
        >
          <UniversalImage
            source={
              card.photoURL
                ? { uri: card.photoURL }
                : process.env.EXPO_PUBLIC_PLACEHOLDER_IMAGE_URL
                  ? { uri: process.env.EXPO_PUBLIC_PLACEHOLDER_IMAGE_URL }
                  : PLACEHOLDER_CARD
            }
            style={styles.image}
            enableLazy={false} // Disable lazy loading for swipe cards
            progressive={true} // Enable progressive loading
          />

          {/* Subtle top gradient for status bar area */}
          <LinearGradient colors={['rgba(0,0,0,0.3)', 'transparent']} style={styles.topGradient} />

          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => {
              if (onViewProfile && typeof onViewProfile === 'function') {
                onViewProfile();
              }
            }}
            activeOpacity={0.7}
            testID="info-button"
          >
            <View style={styles.infoButtonGlass}>
              <Ionicons name="information-circle" size={22} color={Colors.background.white} />
            </View>
          </TouchableOpacity>

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.04)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.88)']}
            locations={[0.25, 0.45, 0.7, 1]}
            style={styles.gradientOverlay}
          >
            <View style={styles.infoContainer}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{card.name || 'Unknown'}</Text>
                {card.age && <Text style={styles.age}> {card.age}</Text>}
                {verificationBadge.showBadge && (
                  <View style={styles.verificationBadgeOuter}>
                    <LinearGradient
                      colors={['#4ECDC4', '#2DB5AA']}
                      style={styles.verificationBadge}
                    >
                      <Ionicons
                        name={verificationBadge.iconName}
                        size={11}
                        color={Colors.background.white}
                      />
                    </LinearGradient>
                  </View>
                )}
              </View>
              {card.distance && (
                <View style={styles.distanceRow}>
                  <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.75)" />
                  <Text style={styles.distance}>
                    {LocationService.getLocationDisplayString(card.distance)}
                  </Text>
                </View>
              )}
              {card.bio && (
                <Text style={styles.bio} numberOfLines={2}>
                  {card.bio}
                </Text>
              )}
              {!card.bio && <Text style={styles.bioPlaceholder}>Tap to learn more</Text>}
            </View>
          </LinearGradient>

          {/* Like Label */}
          <Animated.View style={[styles.likeLabel, likeOpacity]}>
            <LinearGradient colors={Colors.gradient.teal} style={styles.labelGradient}>
              <Text style={styles.likeText}>LIKE</Text>
            </LinearGradient>
          </Animated.View>

          {/* Nope Label */}
          <Animated.View style={[styles.nopeLabel, nopeOpacity]}>
            <LinearGradient colors={Colors.gradient.red} style={styles.labelGradient}>
              <Text style={styles.nopeText}>NOPE</Text>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </PanGestureHandler>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison: only re-render if card data or callbacks change
    return (
      prevProps.card === nextProps.card &&
      prevProps.onSwipeLeft === nextProps.onSwipeLeft &&
      prevProps.onSwipeRight === nextProps.onSwipeRight &&
      prevProps.onViewProfile === nextProps.onViewProfile
    );
  }
);

SwipeCard.displayName = 'SwipeCard';

const styles = StyleSheet.create({
  card: {
    // Use absolute positioning for stacking cards
    position: 'absolute',
    borderRadius: 24,
    backgroundColor: Colors.background.white,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        ...shadowToWebBoxShadow(DESIGN_TOKENS.shadows.cardFloat),
        willChange: 'transform',
      },
      default: {
        ...DESIGN_TOKENS.shadows.cardFloat,
      },
    }),
  },
  image: {
    width: '100%',
    height: '100%',
    aspectRatio: 2 / 3,
    objectFit: 'cover',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 5,
  },
  infoButton: {
    position: 'absolute',
    top: 18,
    right: 18,
    zIndex: 10,
  },
  infoButtonGlass: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      },
      default: {},
    }),
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
    padding: 24,
    paddingTop: 40,
  },
  infoContainer: {
    paddingBottom: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  name: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.background.white,
    letterSpacing: -0.3,
    ...Platform.select({
      web: {
        textShadow: '0px 1px 3px rgba(0,0,0,0.4)',
      },
      default: {
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      },
    }),
  },
  age: {
    fontSize: 28,
    fontWeight: '400',
    color: Colors.background.white,
    opacity: 0.9,
    ...Platform.select({
      web: {
        textShadow: '0px 1px 3px rgba(0,0,0,0.4)',
      },
      default: {
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      },
    }),
  },
  verificationBadgeOuter: {
    marginLeft: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  verificationBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  distance: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  bio: {
    fontSize: 15,
    color: Colors.background.white,
    lineHeight: 21,
    opacity: 0.88,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  bioPlaceholder: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  likeLabel: {
    position: 'absolute',
    top: 70,
    right: 20,
    transform: [{ rotate: '12deg' }],
  },
  labelGradient: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  likeText: {
    fontSize: 38,
    fontWeight: '900',
    color: Colors.background.white,
    letterSpacing: 3,
    ...Platform.select({
      web: {
        textShadow: '0px 2px 6px rgba(0, 0, 0, 0.25)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.25)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
      },
    }),
  },
  nopeLabel: {
    position: 'absolute',
    top: 70,
    left: 20,
    transform: [{ rotate: '-12deg' }],
  },
  nopeText: {
    fontSize: 38,
    fontWeight: '900',
    color: Colors.background.white,
    letterSpacing: 3,
    ...Platform.select({
      web: {
        textShadow: '0px 2px 6px rgba(0, 0, 0, 0.25)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.25)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
      },
    }),
  },
});

export default SwipeCard;
