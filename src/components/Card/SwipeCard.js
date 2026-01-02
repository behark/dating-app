import React, { useRef } from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

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
      
      // Add rotation based on swipe direction
      const rotation = translateX.value / 20;
      
      // Scale down slightly when swiping
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
        // Spring back to center
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
    const opacity = translateX.value > 0 ? translateX.value / SWIPE_THRESHOLD : 0;
    return { opacity: Math.min(opacity, 1) };
  });

  const nopeOpacity = useAnimatedStyle(() => {
    const opacity = translateX.value < 0 ? Math.abs(translateX.value) / SWIPE_THRESHOLD : 0;
    return { opacity: Math.min(opacity, 1) };
  });

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.card, cardStyle]}>
        <Image source={{ uri: card.photoURL }} style={styles.image} />
        <View style={styles.overlay}>
          <View style={styles.infoContainer}>
            <Text style={styles.name}>{card.name}, {card.age}</Text>
            <Text style={styles.bio}>{card.bio}</Text>
          </View>
        </View>
        
        {/* Like/Nope Labels */}
        <Animated.View style={[styles.likeLabel, likeOpacity]}>
          <Text style={styles.likeText}>LIKE</Text>
        </Animated.View>
        <Animated.View style={[styles.nopeLabel, nopeOpacity]}>
          <Text style={styles.nopeText}>NOPE</Text>
        </Animated.View>
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 40,
    height: '75%',
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    padding: 20,
  },
  infoContainer: {
    paddingBottom: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  bio: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
  },
  likeLabel: {
    position: 'absolute',
    top: 50,
    right: 20,
    borderWidth: 4,
    borderColor: '#4ECDC4',
    borderRadius: 10,
    padding: 10,
    transform: [{ rotate: '15deg' }],
  },
  likeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  nopeLabel: {
    position: 'absolute',
    top: 50,
    left: 20,
    borderWidth: 4,
    borderColor: '#FF6B6B',
    borderRadius: 10,
    padding: 10,
    transform: [{ rotate: '-15deg' }],
  },
  nopeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
});

export default SwipeCard;
