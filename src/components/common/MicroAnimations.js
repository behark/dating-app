import { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../../constants/colors';
import { useTheme } from '../../context/ThemeContext';

const HeartAnimation = ({ visible, onComplete }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const { theme } = useTheme();

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      rotateAnim.setValue(0);

      // Start animation sequence
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.5,
          friction: 3,
          tension: 40,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();

      // Fade out after delay
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]).start(() => {
          onComplete?.();
        });
      }, 800);
    }
  }, [visible, onComplete, opacityAnim, rotateAnim, scaleAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const heartTransformStyle = {
    transform: [{ scale: scaleAnim }, { rotate }],
    opacity: opacityAnim,
  };

  if (!visible) return null;

  return (
    <View style={styles.heartContainer}>
      <Animated.View style={heartTransformStyle}>
        <Ionicons
          name="heart"
          size={60}
          color={theme.interactive.danger}
          style={styles.heartIconShadow}
        />
      </Animated.View>
    </View>
  );
};

const SuccessAnimation = ({ visible, message, onComplete }) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const { theme } = useTheme();

  useEffect(() => {
    if (visible) {
      // Reset animations
      slideAnim.setValue(-100);
      opacityAnim.setValue(0);

      // Slide in from top
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 5,
          tension: 40,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();

      // Auto hide after delay
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: -100,
            duration: 300,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]).start(() => {
          onComplete?.();
        });
      }, 2000);
    }
  }, [visible, onComplete, opacityAnim, slideAnim]);
  const successBannerAnimationStyle = {
    transform: [{ translateY: slideAnim }],
    opacity: opacityAnim,
  };
  const successBannerColorStyle = {
    backgroundColor: theme.status.success,
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.successAnimationContainer, successBannerAnimationStyle]}>
      <View style={[styles.successBanner, successBannerColorStyle]}>
        <Ionicons
          name="checkmark-circle"
          size={24}
          color={Colors.background.white}
          style={styles.successIcon}
        />
        <Animated.Text style={styles.successText}>{message || 'Success!'}</Animated.Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  heartContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -30,
    marginTop: -30,
    zIndex: 1000,
  },
  heartIconShadow: Platform.select({
    web: {
      textShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
    },
    default: {
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
  }),
  successAnimationContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  successBanner: {
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  successIcon: {
    marginRight: 12,
  },
  successText: {
    color: Colors.background.white,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
});

const MicroAnimations = {
  HeartAnimation,
  SuccessAnimation,
};

export default MicroAnimations;
