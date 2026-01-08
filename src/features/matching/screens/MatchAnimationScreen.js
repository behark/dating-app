import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/colors';

const MatchAnimationScreen = ({ navigation, route }) => {
  const { matchedUser } = route.params || {};
  const [showContent, setShowContent] = useState(false);
  const scaleAnim = new Animated.Value(0);
  const opacityAnim = new Animated.Value(0);

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Show content after animation
    setTimeout(() => setShowContent(true), 500);
  }, []);

  const handleContinue = () => {
    navigation.navigate('Chat', {
      matchId: matchedUser?.matchId,
      otherUser: matchedUser,
    });
  };

  const handleKeepSwiping = () => {
    navigation.goBack();
  };

  return (
    <LinearGradient colors={Colors.gradient.primary} style={styles.container}>
      <Animated.View
        style={[
          styles.animationContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <View style={styles.heartContainer}>
          <Ionicons name="heart" size={120} color={Colors.accent.red} />
        </View>

        {showContent && (
          <View style={styles.content}>
            <Text style={styles.title}>It's a Match! 🎉</Text>
            {matchedUser?.name && (
              <Text style={styles.subtitle}>You and {matchedUser.name} liked each other!</Text>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleContinue}>
                <Text style={styles.primaryButtonText}>Send Message</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={handleKeepSwiping}>
                <Text style={styles.secondaryButtonText}>Keep Swiping</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartContainer: {
    marginBottom: 40,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.background.white,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: Colors.background.white,
    opacity: 0.9,
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '80%',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: Colors.background.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background.white,
  },
  secondaryButtonText: {
    color: Colors.background.white,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default MatchAnimationScreen;
