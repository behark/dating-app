import { LinearGradient } from 'expo-linear-gradient';
import { memo, useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../../constants/colors';

const TYPING_ANIMATIONS = {
  dots: 'dots',
  wave: 'wave',
  pulse: 'pulse',
  bounce: 'bounce',
  hearts: 'hearts',
};

const AnimatedTypingIndicator = ({
  userName = 'Someone',
  avatarUrl: _avatarUrl,
  animationType = 'dots',
  showName = true,
  compact = false,
  customColors = null,
}) => {
  // Animation values for dots
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  // Animation values for wave
  const waveAnims = useRef([...Array(5)].map(() => new Animated.Value(0))).current;

  // Animation values for pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.5)).current;

  // Animation values for bounce
  const bounceAnims = useRef([...Array(3)].map(() => new Animated.Value(0))).current;

  // Animation values for hearts
  const heartAnims = useRef(
    [...Array(3)].map(() => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
      y: new Animated.Value(0),
    }))
  ).current;

  // Entrance animation
  const containerAnim = useRef(new Animated.Value(0)).current;

  const colors = customColors || Colors.gradient.primary;

  useEffect(() => {
    const nativeDriver = Platform.OS !== 'web';
    // Entrance animation
    Animated.spring(containerAnim, {
      toValue: 1,
      friction: 6,
      tension: 80,
      useNativeDriver: nativeDriver,
    }).start();

    // Start the appropriate animation
    switch (animationType) {
      case 'dots':
        startDotsAnimation();
        break;
      case 'wave':
        startWaveAnimation();
        break;
      case 'pulse':
        startPulseAnimation();
        break;
      case 'bounce':
        startBounceAnimation();
        break;
      case 'hearts':
        startHeartsAnimation();
        break;
    }

    return () => {
      // Cleanup animations
      dot1Anim.stopAnimation();
      dot2Anim.stopAnimation();
      dot3Anim.stopAnimation();
    };
  }, [animationType]);

  const startDotsAnimation = () => {
    const nativeDriver = Platform.OS !== 'web';
    const animateDot = (anim, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: nativeDriver,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: nativeDriver,
          }),
          Animated.delay(400 - delay),
        ])
      );
    };

    Animated.parallel([
      animateDot(dot1Anim, 0),
      animateDot(dot2Anim, 150),
      animateDot(dot3Anim, 300),
    ]).start();
  };

  const startWaveAnimation = () => {
    waveAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 100),
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 400,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.delay((4 - index) * 100),
        ])
      ).start();
    });
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.5,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  };

  const startBounceAnimation = () => {
    bounceAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 150),
          Animated.timing(anim, {
            toValue: -10,
            duration: 200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.spring(anim, {
            toValue: 0,
            friction: 3,
            useNativeDriver: true,
          }),
          Animated.delay(300),
        ])
      ).start();
    });
  };

  const startHeartsAnimation = () => {
    heartAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 400),
          Animated.parallel([
            Animated.timing(anim.scale, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(anim.opacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(anim.y, {
              toValue: -20,
              duration: 800,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.parallel([
            Animated.timing(anim.scale, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(anim.y, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    });
  };

  const renderDotsAnimation = () => {
    const dotTransform = (anim) => ({
      transform: [
        {
          translateY: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -8],
          }),
        },
      ],
      opacity: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.4, 1],
      }),
    });

    return (
      <View style={styles.dotsContainer}>
        <Animated.View style={[styles.dot, dotTransform(dot1Anim)]} />
        <Animated.View style={[styles.dot, dotTransform(dot2Anim)]} />
        <Animated.View style={[styles.dot, dotTransform(dot3Anim)]} />
      </View>
    );
  };

  const renderWaveAnimation = () => (
    <View style={styles.waveContainer}>
      {waveAnims.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.waveLine,
            {
              transform: [
                {
                  scaleY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.4, 1],
                  }),
                },
              ],
              opacity: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.4, 1],
              }),
            },
          ]}
        />
      ))}
    </View>
  );

  const renderPulseAnimation = () => (
    <Animated.View
      style={[
        styles.pulseContainer,
        {
          transform: [{ scale: pulseAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <LinearGradient colors={colors} style={styles.pulseGradient}>
        <Text style={styles.pulseText}>...</Text>
      </LinearGradient>
    </Animated.View>
  );

  const renderBounceAnimation = () => (
    <View style={styles.bounceContainer}>
      {bounceAnims.map((anim, index) => (
        <Animated.View
          key={index}
          style={[styles.bounceDot, { transform: [{ translateY: anim }] }]}
        />
      ))}
    </View>
  );

  const renderHeartsAnimation = () => (
    <View style={styles.heartsContainer}>
      <Text style={styles.typingText}>typing</Text>
      {heartAnims.map((anim, index) => (
        <Animated.Text
          key={index}
          style={[
            styles.heart,
            {
              opacity: anim.opacity,
              transform: [{ scale: anim.scale }, { translateY: anim.y }],
              left: 50 + index * 12,
            },
          ]}
        >
          ❤️
        </Animated.Text>
      ))}
    </View>
  );

  const renderAnimation = () => {
    switch (animationType) {
      case 'dots':
        return renderDotsAnimation();
      case 'wave':
        return renderWaveAnimation();
      case 'pulse':
        return renderPulseAnimation();
      case 'bounce':
        return renderBounceAnimation();
      case 'hearts':
        return renderHeartsAnimation();
      default:
        return renderDotsAnimation();
    }
  };

  const containerScale = containerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  return (
    <Animated.View
      style={[
        compact ? styles.compactContainer : styles.container,
        {
          transform: [{ scale: containerScale }],
          opacity: containerAnim,
        },
      ]}
    >
      {showName && !compact && <Text style={styles.userName}>{userName} is typing</Text>}

      <View style={styles.indicatorWrapper}>{renderAnimation()}</View>
    </Animated.View>
  );
};

// Typing indicator for chat header
export const HeaderTypingIndicator = memo(({ isTyping, userName }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isTyping ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isTyping]);

  if (!isTyping) return null;

  return (
    <Animated.View style={[styles.headerIndicator, { opacity: fadeAnim }]}>
      <AnimatedTypingIndicator userName={userName} animationType="dots" showName={false} compact />
      <Text style={styles.headerTypingText}>typing...</Text>
    </Animated.View>
  );
});

HeaderTypingIndicator.displayName = 'HeaderTypingIndicator';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.light,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginVertical: 4,
    maxWidth: 150,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontSize: 11,
    color: Colors.text.tertiary,
    marginBottom: 4,
  },
  indicatorWrapper: {
    minHeight: 20,
    justifyContent: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    gap: 3,
  },
  waveLine: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  pulseContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  pulseGradient: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  pulseText: {
    color: Colors.background.white,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 2,
  },
  bounceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 20,
    gap: 6,
  },
  bounceDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  heartsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    minWidth: 80,
  },
  typingText: {
    fontSize: 12,
    color: Colors.accent.red,
    fontStyle: 'italic',
  },
  heart: {
    position: 'absolute',
    fontSize: 10,
    top: 0,
  },
  headerIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTypingText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
  },
});

export { TYPING_ANIMATIONS };
export default AnimatedTypingIndicator;
