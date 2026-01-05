import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ACHIEVEMENTS = {
  // Profile achievements
  profile_complete: {
    id: 'profile_complete',
    name: 'Picture Perfect',
    description: 'Complete your profile 100%',
    icon: '🖼️',
    category: 'profile',
    rarity: 'common',
    xpReward: 100,
  },
  photo_verified: {
    id: 'photo_verified',
    name: 'Verified Star',
    description: 'Get your photos verified',
    icon: '⭐',
    category: 'profile',
    rarity: 'uncommon',
    xpReward: 150,
  },
  video_intro: {
    id: 'video_intro',
    name: 'Video Virtuoso',
    description: 'Add a video introduction',
    icon: '🎬',
    category: 'profile',
    rarity: 'uncommon',
    xpReward: 200,
  },

  // Social achievements
  first_match: {
    id: 'first_match',
    name: 'First Spark',
    description: 'Get your first match',
    icon: '💘',
    category: 'social',
    rarity: 'common',
    xpReward: 50,
  },
  matches_10: {
    id: 'matches_10',
    name: 'Popular',
    description: 'Get 10 matches',
    icon: '🔥',
    category: 'social',
    rarity: 'uncommon',
    xpReward: 200,
  },
  matches_50: {
    id: 'matches_50',
    name: 'Heartbreaker',
    description: 'Get 50 matches',
    icon: '💔',
    category: 'social',
    rarity: 'rare',
    xpReward: 500,
  },
  matches_100: {
    id: 'matches_100',
    name: 'Legendary Lover',
    description: 'Get 100 matches',
    icon: '👑',
    category: 'social',
    rarity: 'legendary',
    xpReward: 1000,
  },

  // Activity achievements
  swipes_100: {
    id: 'swipes_100',
    name: 'Getting Started',
    description: 'Swipe on 100 profiles',
    icon: '👆',
    category: 'activity',
    rarity: 'common',
    xpReward: 50,
  },
  swipes_1000: {
    id: 'swipes_1000',
    name: 'Dedicated Dater',
    description: 'Swipe on 1000 profiles',
    icon: '🎯',
    category: 'activity',
    rarity: 'rare',
    xpReward: 300,
  },
  messages_100: {
    id: 'messages_100',
    name: 'Chatty',
    description: 'Send 100 messages',
    icon: '💬',
    category: 'activity',
    rarity: 'uncommon',
    xpReward: 150,
  },

  // Streak achievements
  streak_7: {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '📅',
    category: 'streak',
    rarity: 'uncommon',
    xpReward: 100,
  },
  streak_30: {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    icon: '🏆',
    category: 'streak',
    rarity: 'rare',
    xpReward: 500,
  },
  streak_100: {
    id: 'streak_100',
    name: 'Century Club',
    description: 'Maintain a 100-day streak',
    icon: '💎',
    category: 'streak',
    rarity: 'legendary',
    xpReward: 2000,
  },

  // Special achievements
  super_like_match: {
    id: 'super_like_match',
    name: 'Super Connection',
    description: 'Match with someone you Super Liked',
    icon: '💫',
    category: 'special',
    rarity: 'rare',
    xpReward: 250,
  },
  premium_member: {
    id: 'premium_member',
    name: 'VIP Status',
    description: 'Become a premium member',
    icon: '💳',
    category: 'special',
    rarity: 'uncommon',
    xpReward: 200,
  },
};

const RARITY_COLORS = {
  common: {
    bg: Colors.status.successLight,
    border: Colors.status.success,
    text: Colors.status.successDark,
  },
  uncommon: {
    bg: Colors.status.infoLight,
    border: Colors.status.info,
    text: Colors.status.infoBlue,
  },
  rare: {
    bg: '#F3E5F5',
    border: Colors.gamification.socialButterfly,
    text: Colors.gamification.socialButterfly,
  },
  legendary: {
    bg: Colors.status.warningLight,
    border: Colors.accent.gold,
    text: Colors.status.warningDark,
  },
};

const RARITY_GRADIENTS = {
  common: Colors.gradient.success,
  uncommon: Colors.gradient.info,
  rare: [Colors.gamification.socialButterfly, Colors.gamification.socialButterfly],
  legendary: Colors.gradient.gold,
};

const AchievementBadgeAnimated = ({
  achievementId,
  unlocked = false,
  unlockedAt = null,
  size = 'medium',
  showLabel = true,
  onPress,
  animate = true,
}) => {
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const particleAnims = useRef(
    [...Array(8)].map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  const achievement = ACHIEVEMENTS[achievementId];
  const rarityStyle = RARITY_COLORS[achievement?.rarity || 'common'];
  const rarityGradient = RARITY_GRADIENTS[achievement?.rarity || 'common'];

  const sizes = {
    small: { badge: 48, icon: 24, font: 10 },
    medium: { badge: 72, icon: 36, font: 12 },
    large: { badge: 96, icon: 48, font: 14 },
  };

  const currentSize = sizes[size];

  useEffect(() => {
    if (unlocked && animate) {
      // Entrance animation
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.back(2)),
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Continuous glow for legendary items
      if (achievement?.rarity === 'legendary') {
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }

      // Shimmer effect for rare+ items
      if (['rare', 'legendary'].includes(achievement?.rarity)) {
        Animated.loop(
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 2500,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ).start();
      }

      // Floating animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -5,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(unlocked ? 1 : 0.9);
    }
  }, [unlocked, animate]);

  const triggerUnlockAnimation = () => {
    // Particle burst
    particleAnims.forEach((anim, i) => {
      const angle = i * 45 * (Math.PI / 180);

      Animated.parallel([
        Animated.timing(anim.x, {
          toValue: Math.cos(angle) * 80,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(anim.y, {
          toValue: Math.sin(angle) * 80,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.parallel([
            Animated.timing(anim.opacity, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(anim.scale, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]),
          Animated.delay(400),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        anim.x.setValue(0);
        anim.y.setValue(0);
        anim.scale.setValue(0);
      });
    });
  };

  const handlePress = () => {
    if (unlocked) {
      triggerUnlockAnimation();
      setShowUnlockModal(true);
    }
    onPress?.(achievement);
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-30deg', '0deg'],
  });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-currentSize.badge, currentSize.badge * 2],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  if (!achievement) return null;

  const renderParticles = () => (
    <>
      {particleAnims.map((anim, i) => (
        <Animated.Text
          key={i}
          style={[
            styles.particle,
            {
              opacity: anim.opacity,
              transform: [{ translateX: anim.x }, { translateY: anim.y }, { scale: anim.scale }],
            },
          ]}
        >
          ✨
        </Animated.Text>
      ))}
    </>
  );

  const renderUnlockModal = () => (
    <Modal
      visible={showUnlockModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowUnlockModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowUnlockModal(false)}
      >
        <View style={styles.modalContent}>
          <LinearGradient colors={rarityGradient} style={styles.modalBadgeContainer}>
            <Text style={styles.modalIcon}>{achievement.icon}</Text>
          </LinearGradient>

          <Text style={styles.modalTitle}>{achievement.name}</Text>
          <Text style={styles.modalDescription}>{achievement.description}</Text>

          <View style={[styles.rarityBadge, { backgroundColor: rarityStyle.bg }]}>
            <Text style={[styles.rarityText, { color: rarityStyle.text }]}>
              {achievement.rarity.toUpperCase()}
            </Text>
          </View>

          <View style={styles.modalReward}>
            <Text style={styles.modalRewardLabel}>Reward:</Text>
            <Text style={styles.modalRewardValue}>+{achievement.xpReward} XP</Text>
          </View>

          {unlockedAt && (
            <Text style={styles.modalDate}>
              Unlocked {new Date(unlockedAt).toLocaleDateString()}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <Animated.View
          style={[
            styles.badgeWrapper,
            {
              transform: [{ scale: scaleAnim }, { rotate: rotation }, { translateY: floatAnim }],
            },
          ]}
        >
          {/* Glow effect for legendary */}
          {unlocked && achievement.rarity === 'legendary' && (
            <Animated.View
              style={[
                styles.glowEffect,
                {
                  width: currentSize.badge + 20,
                  height: currentSize.badge + 20,
                  borderRadius: (currentSize.badge + 20) / 2,
                  opacity: glowOpacity,
                  backgroundColor: RARITY_GRADIENTS.legendary[0],
                },
              ]}
            />
          )}

          {/* Badge */}
          <View
            style={[
              styles.badge,
              {
                width: currentSize.badge,
                height: currentSize.badge,
                borderRadius: currentSize.badge / 2,
                borderColor: unlocked ? rarityStyle.border : Colors.border.light,
                backgroundColor: unlocked ? rarityStyle.bg : Colors.background.lighter,
              },
            ]}
          >
            {unlocked ? (
              <LinearGradient
                colors={rarityGradient}
                style={[
                  styles.badgeGradient,
                  {
                    width: currentSize.badge - 8,
                    height: currentSize.badge - 8,
                    borderRadius: (currentSize.badge - 8) / 2,
                  },
                ]}
              >
                <Text style={{ fontSize: currentSize.icon }}>{achievement.icon}</Text>

                {/* Shimmer effect */}
                {['rare', 'legendary'].includes(achievement.rarity) && (
                  <Animated.View
                    style={[
                      styles.shimmer,
                      {
                        transform: [{ translateX: shimmerTranslate }],
                        height: currentSize.badge,
                      },
                    ]}
                  />
                )}
              </LinearGradient>
            ) : (
              <View style={styles.lockedBadge}>
                <Ionicons
                  name="lock-closed"
                  size={currentSize.icon * 0.6}
                  color={Colors.text.light}
                />
              </View>
            )}
          </View>

          {/* Particles */}
          {renderParticles()}
        </Animated.View>
      </TouchableOpacity>

      {/* Label */}
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text
            style={[
              styles.label,
              {
                fontSize: currentSize.font,
                color: unlocked ? Colors.text.dark : Colors.text.tertiary,
              },
            ]}
            numberOfLines={1}
          >
            {achievement.name}
          </Text>
          {unlocked && <View style={[styles.rarityDot, { backgroundColor: rarityStyle.border }]} />}
        </View>
      )}

      {renderUnlockModal()}
    </View>
  );
};

// Achievement showcase grid
export const AchievementShowcase = ({
  achievements = [],
  unlockedIds = [],
  onAchievementPress,
  showLocked = true,
}) => {
  const allAchievements = Object.values(ACHIEVEMENTS);
  const displayAchievements = showLocked
    ? allAchievements
    : allAchievements.filter((a) => unlockedIds.includes(a.id));

  return (
    <View style={styles.showcaseContainer}>
      <View style={styles.showcaseHeader}>
        <Text style={styles.showcaseTitle}>🏆 Achievements</Text>
        <Text style={styles.showcaseCount}>
          {unlockedIds.length}/{allAchievements.length}
        </Text>
      </View>

      <View style={styles.showcaseGrid}>
        {displayAchievements.map((achievement) => (
          <AchievementBadgeAnimated
            key={achievement.id}
            achievementId={achievement.id}
            unlocked={unlockedIds.includes(achievement.id)}
            size="small"
            showLabel={true}
            onPress={onAchievementPress}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    margin: 8,
  },
  badgeWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowEffect: {
    position: 'absolute',
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeGradient: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  lockedBadge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    width: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transform: [{ skewX: '-20deg' }],
  },
  particle: {
    position: 'absolute',
    fontSize: 14,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  label: {
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 80,
  },
  rarityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
  },
  modalBadgeContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIcon: {
    fontSize: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.dark,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  rarityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 16,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  modalReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  modalRewardLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  modalRewardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  modalDate: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 8,
  },
  showcaseContainer: {
    backgroundColor: Colors.background.white,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  },
  showcaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  showcaseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.dark,
  },
  showcaseCount: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  showcaseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
});

export { ACHIEVEMENTS };
export default AchievementBadgeAnimated;
