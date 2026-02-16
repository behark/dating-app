import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Platform, StyleSheet, View } from 'react-native';
import { Colors } from '../../../constants/colors';
import { useTheme } from '../../../context/ThemeContext';

// useNativeDriver is not supported on web
const useNativeDriver = Platform.OS !== 'web';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_HEIGHT = SCREEN_HEIGHT * 0.75;
const CARD_WIDTH = SCREEN_WIDTH - 40; // Match SwipeCard width calculation

const SkeletonCard = ({ style }) => {
  const { theme } = useTheme();
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startShimmer = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver,
          }),
          Animated.timing(shimmerAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver,
          }),
        ])
      ).start();
    };

    startShimmer();
  }, [shimmerAnimation]);

  const shimmerOpacity = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const SkeletonItem = ({ width, height, borderRadius = 4, style: itemStyle }) => (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.background.tertiary,
          opacity: shimmerOpacity,
        },
        itemStyle,
      ]}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background.card }, style]}>
      {/* Profile Image Skeleton */}
      <SkeletonItem
        width={CARD_WIDTH}
        height={CARD_HEIGHT * 0.7}
        borderRadius={20}
        style={styles.imageSkeleton}
      />

      {/* Profile Info Skeleton */}
      <View style={styles.infoContainer}>
        {/* Name and Age */}
        <View style={styles.nameRow}>
          <SkeletonItem width={120} height={24} />
          <SkeletonItem width={40} height={20} />
        </View>

        {/* Bio Lines */}
        <SkeletonItem width={CARD_WIDTH - 40} height={16} style={styles.bioLine} />
        <SkeletonItem width={CARD_WIDTH - 80} height={16} style={styles.bioLine} />
        <SkeletonItem width={CARD_WIDTH - 60} height={16} style={styles.bioLine} />

        {/* Distance */}
        <View style={styles.distanceRow}>
          <SkeletonItem width={80} height={14} />
        </View>
      </View>

      {/* Action Buttons Skeleton */}
      <View style={styles.actionsContainer}>
        <SkeletonItem width={60} height={60} borderRadius={30} />
        <SkeletonItem width={60} height={60} borderRadius={30} />
        <SkeletonItem width={60} height={60} borderRadius={30} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH, // Match SwipeCard width
    height: CARD_HEIGHT,
    borderRadius: 20,
    ...Platform.select({
      web: {
        // On web, use same centering approach as SwipeCard
        left: '50%',
        marginLeft: -(CARD_WIDTH / 2), // Center it (offset by half width)
        marginRight: 0,
        position: 'absolute', // Match SwipeCard positioning
      },
      default: {
        // On native, use margin for centering
        marginHorizontal: 20, // (SCREEN_WIDTH - CARD_WIDTH) / 2 = 20
        alignSelf: 'center',
      },
    }),
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  imageSkeleton: {
    alignSelf: 'center',
  },
  infoContainer: {
    padding: 20,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bioLine: {
    marginBottom: 8,
  },
  distanceRow: {
    marginTop: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  skeleton: {
    // Shimmer animation will be added here
  },
});

export default SkeletonCard;
