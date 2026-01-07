import React, { useEffect, useRef, memo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/colors';

/**
 * SkeletonLoader - Animated skeleton placeholder for loading states
 *
 * Provides smooth pulsing animation for better perceived performance
 */
const SkeletonLoader = memo(({
  width,
  height,
  borderRadius = 8,
  style,
  ...props
}) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: false,
        }),
      ])
    );

    pulse.start();

    return () => pulse.stop();
  }, [pulseAnim]);

  const animatedStyle = {
    opacity: pulseAnim,
    backgroundColor: pulseAnim.interpolate({
      inputRange: [0.3, 1],
      outputRange: [Colors.background.lightest, Colors.border.gray],
    }),
  };

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        animatedStyle,
        style,
      ]}
      {...props}
    />
  );
});

/**
 * ProfileCardSkeleton - Skeleton for profile cards
 */
export const ProfileCardSkeleton = ({ style }) => (
  <View style={[styles.profileCard, style]}>
    <SkeletonLoader
      width={120}
      height={120}
      borderRadius={60}
      style={styles.avatar}
    />
    <View style={styles.profileInfo}>
      <SkeletonLoader width={100} height={20} style={styles.name} />
      <SkeletonLoader width={60} height={16} style={styles.age} />
      <SkeletonLoader width={80} height={14} style={styles.location} />
    </View>
  </View>
);

/**
 * TextSkeleton - Skeleton for text blocks
 */
export const TextSkeleton = ({ lines = 3, lineHeight = 20, style }) => (
  <View style={style}>
    {Array.from({ length: lines }).map((_, index) => (
      <SkeletonLoader
        key={index}
        width={index === lines - 1 ? '60%' : '100%'}
        height={lineHeight}
        style={{ marginBottom: index < lines - 1 ? 8 : 0 }}
      />
    ))}
  </View>
);

/**
 * ButtonSkeleton - Skeleton for buttons
 */
export const ButtonSkeleton = ({ width = 120, height = 44, style }) => (
  <SkeletonLoader
    width={width}
    height={height}
    borderRadius={8}
    style={style}
  />
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.border.gray,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.background.white,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    marginBottom: 8,
  },
  age: {
    marginBottom: 4,
  },
  location: {},
});

export default SkeletonLoader;