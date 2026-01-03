import React, { useRef } from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.75;

const SwipeCard = ({ card, onSwipeLeft, onSwipeRight, index }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      translateX.value = ctx.startX + event.translationX;
      translateY.value = ctx.startY + event.translationY;
      
      const rotation = translateX.value / 20;
      scale.value = 1 - Math.abs(translateX.value) / 1000;
    },
    onEnd: (event) => {
      const shouldSwipeLeft = translateX.value < -SWIPE_THRESHOLD;
      const shouldSwipeRight = translateX.value > SWIPE_THRESHOLD;

      if (shouldSwipeLeft) {
        translateX.value = withSpring(-SCREEN_WIDTH * 1.5);
        opacity.value = withSpring(0);
        runOnJS(onSwipeLeft)(card);
      } else if (shouldSwipeRight) {
        translateX.value = withSpring(SCREEN_WIDTH * 1.5);
        opacity.value = withSpring(0);
        runOnJS(onSwipeRight)(card);
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        scale.value = withSpring(1);
      }
    },
  });

  const cardStyle = useAnimatedStyle(() => {
    const rotation = translateX.value / 20;
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}deg` },
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
    const opacity = translateX.value < 0 ? Math.min(Math.abs(translateX.value) / SWIPE_THRESHOLD, 1) : 0;
    return { opacity };
  });

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.card, cardStyle]}>
        <Image 
          source={{ uri: card.photoURL || 'https://via.placeholder.com/400' }} 
          style={styles.image}
          defaultSource={require('../../../assets/icon.png')}
        />
        
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
          locations={[0.4, 0.7, 1]}
          style={styles.gradientOverlay}
        >
          <View style={styles.infoContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{card.name || 'Unknown'}</Text>
              {card.age && <Text style={styles.age}>, {card.age}</Text>}
            </View>
            {card.bio && (
              <Text style={styles.bio} numberOfLines={3}>
                {card.bio}
              </Text>
            )}
            {!card.bio && (
              <Text style={styles.bioPlaceholder}>No bio yet</Text>
            )}
          </View>
        </LinearGradient>
        
        {/* Like Label */}
        <Animated.View style={[styles.likeLabel, likeOpacity]}>
          <LinearGradient
            colors={['#4ECDC4', '#44A08D']}
            style={styles.labelGradient}
          >
            <Text style={styles.likeText}>LIKE</Text>
          </LinearGradient>
        </Animated.View>
        
        {/* Nope Label */}
        <Animated.View style={[styles.nopeLabel, nopeOpacity]}>
          <LinearGradient
            colors={['#FF6B6B', '#EE5A6F']}
            style={styles.labelGradient}
          >
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
    alignItems: 'baseline',
    marginBottom: 8,
  },
  name: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  age: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  bio: {
    fontSize: 17,
    color: '#fff',
    lineHeight: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    opacity: 0.95,
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
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
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
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});

export default SwipeCard;
