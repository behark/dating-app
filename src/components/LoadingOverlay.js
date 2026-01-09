import PropTypes from 'prop-types';
import { memo, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const useNativeDriver = Platform.OS !== 'web';

/**
 * LoadingOverlay Component
 *
 * A reusable loading component with multiple styles:
 * - fullscreen: Full screen overlay with backdrop
 * - inline: Inline loading indicator
 * - skeleton: Skeleton loading placeholders
 * - transparent: Overlay without blocking interaction
 */
const LoadingOverlay = memo(
  ({
    visible = true,
    message = 'Loading...',
    type = 'fullscreen',
    progress = null, // 0-100 for progress bar
    transparent = false,
    onTimeout = null,
    timeout = 30000, // 30 second timeout
  }) => {
    const { theme } = useTheme();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (visible) {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver,
        }).start();

        // Start pulse animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 800,
              useNativeDriver,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver,
            }),
          ])
        ).start();

        // Handle timeout
        if (onTimeout && timeout > 0) {
          const timeoutId = setTimeout(() => {
            onTimeout();
          }, timeout);
          return () => clearTimeout(timeoutId);
        }
      } else {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver,
        }).start();
      }
    }, [visible, fadeAnim, pulseAnim, onTimeout, timeout]);

    // Animate progress bar
    useEffect(() => {
      if (progress !== null) {
        Animated.timing(progressAnim, {
          toValue: progress / 100,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
    }, [progress, progressAnim]);

    if (!visible) return null;

    // Inline loading indicator
    if (type === 'inline') {
      return (
        <View style={styles.inlineContainer}>
          <ActivityIndicator size="small" color={theme.interactive.primary} />
          {message && (
            <Text style={[styles.inlineText, { color: theme.text.secondary }]}>{message}</Text>
          )}
        </View>
      );
    }

    // Skeleton loading
    if (type === 'skeleton') {
      return <SkeletonLoader theme={theme} />;
    }

    // Full screen or transparent overlay
    const backgroundColor = transparent
      ? 'transparent'
      : theme.isDark
        ? 'rgba(0, 0, 0, 0.85)'
        : 'rgba(255, 255, 255, 0.95)';

    return (
      <Animated.View
        style={[
          styles.container,
          { opacity: fadeAnim, backgroundColor },
          type === 'transparent' && styles.transparentContainer,
        ]}
        pointerEvents={transparent ? 'none' : 'auto'}
      >
        <Animated.View style={[styles.content, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.spinnerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>

          {message && (
            <Text style={[styles.message, { color: theme.text.primary }]}>{message}</Text>
          )}

          {progress !== null && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressTrack, { backgroundColor: theme.background.tertiary }]}>
                <Animated.View
                  style={[
                    styles.progressBar,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              </View>
              <Text style={[styles.progressText, { color: theme.text.secondary }]}>
                {Math.round(progress)}%
              </Text>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    );
  }
);

LoadingOverlay.displayName = 'LoadingOverlay';

LoadingOverlay.propTypes = {
  visible: PropTypes.bool,
  message: PropTypes.string,
  type: PropTypes.oneOf(['fullscreen', 'inline', 'skeleton', 'transparent']),
  progress: PropTypes.number,
  transparent: PropTypes.bool,
  onTimeout: PropTypes.func,
  timeout: PropTypes.number,
};

/**
 * Skeleton loader for content placeholders
 */
const SkeletonLoader = memo(({ theme }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      })
    ).start();
  }, [shimmerAnim]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  const SkeletonItem = ({ width, height, style }) => (
    <View
      style={[
        styles.skeletonItem,
        {
          width,
          height,
          backgroundColor: theme.background.tertiary,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX: shimmerTranslate }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            'transparent',
            theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );

  return (
    <View style={styles.skeletonContainer}>
      {/* Profile card skeleton */}
      <SkeletonItem width="100%" height={300} style={styles.skeletonCard} />

      {/* Text content skeleton */}
      <View style={styles.skeletonTextContainer}>
        <SkeletonItem width="60%" height={24} style={styles.skeletonText} />
        <SkeletonItem width="40%" height={16} style={styles.skeletonText} />
        <SkeletonItem width="80%" height={16} style={styles.skeletonText} />
      </View>

      {/* Button skeleton */}
      <View style={styles.skeletonButtonContainer}>
        <SkeletonItem width={60} height={60} style={styles.skeletonButton} />
        <SkeletonItem width={80} height={80} style={styles.skeletonButtonLarge} />
        <SkeletonItem width={60} height={60} style={styles.skeletonButton} />
      </View>
    </View>
  );
});

SkeletonLoader.displayName = 'SkeletonLoader';

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  transparentContainer: {
    backgroundColor: 'transparent',
  },
  content: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
  },
  spinnerContainer: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  progressContainer: {
    marginTop: 20,
    alignItems: 'center',
    width: '80%',
    maxWidth: 200,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressText: {
    fontSize: 12,
    marginTop: 8,
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  inlineText: {
    marginLeft: 8,
    fontSize: 14,
  },
  skeletonContainer: {
    padding: 16,
    width: '100%',
  },
  skeletonItem: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
  },
  skeletonCard: {
    borderRadius: 16,
    marginBottom: 16,
  },
  skeletonTextContainer: {
    gap: 8,
  },
  skeletonText: {
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginTop: 24,
  },
  skeletonButton: {
    borderRadius: 30,
  },
  skeletonButtonLarge: {
    borderRadius: 40,
  },
});

export default LoadingOverlay;
