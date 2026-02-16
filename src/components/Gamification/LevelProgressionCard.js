import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LEVELS = [
  { level: 1, name: 'Newcomer', xpRequired: 0, icon: '🌱', color: '#90BE6D' },
  { level: 2, name: 'Explorer', xpRequired: 100, icon: '🔍', color: Colors.accent.teal },
  { level: 3, name: 'Socializer', xpRequired: 300, icon: '💬', color: Colors.primary },
  { level: 4, name: 'Connector', xpRequired: 600, icon: '🤝', color: '#F48FB1' },
  { level: 5, name: 'Matchmaker', xpRequired: 1000, icon: '💘', color: Colors.accent.red },
  { level: 6, name: 'Dating Pro', xpRequired: 1500, icon: '⭐', color: Colors.accent.gold },
  { level: 7, name: 'Love Expert', xpRequired: 2500, icon: '💎', color: Colors.accent.purple },
  {
    level: 8,
    name: 'Heart Master',
    xpRequired: 4000,
    icon: '👑',
    color: Colors.status.warningOrange,
  },
  { level: 9, name: 'Romance Legend', xpRequired: 6000, icon: '🏆', color: '#EF4444' },
  { level: 10, name: 'Cupid Elite', xpRequired: 10000, icon: '💫', color: '#EC4899' },
];

const XP_ACTIONS = {
  dailyLogin: { xp: 10, label: 'Daily Login' },
  swipe: { xp: 1, label: 'Swipe' },
  match: { xp: 25, label: 'New Match' },
  messageSent: { xp: 5, label: 'Message Sent' },
  conversation: { xp: 15, label: 'Active Conversation' },
  profileComplete: { xp: 50, label: 'Profile Complete' },
  photoVerified: { xp: 30, label: 'Photo Verified' },
  streakBonus: { xp: 20, label: 'Streak Bonus' },
  referral: { xp: 100, label: 'Friend Referral' },
};

const LevelProgressionCard = ({
  currentXP = 0,
  onLevelUp,
  onViewRewards,
  showDetails = true,
  compact = false,
}) => {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [nextLevel, setNextLevel] = useState(2);
  const [progressPercent, setProgressPercent] = useState(0);
  const [xpToNext, setXpToNext] = useState(100);
  const [showLevelUp, setShowLevelUp] = useState(false);

  // Animation values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const levelUpAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const starAnims = useRef([...Array(5)].map(() => new Animated.Value(0))).current;

  const calculateLevel = useCallback(() => {
    let level = 1;
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (currentXP >= LEVELS[i].xpRequired) {
        level = LEVELS[i].level;
        break;
      }
    }

    const currentLevelData = LEVELS[level - 1];
    const nextLevelData = LEVELS[level] || LEVELS[LEVELS.length - 1];

    const xpInCurrentLevel = currentXP - currentLevelData.xpRequired;
    const xpNeededForNext = nextLevelData.xpRequired - currentLevelData.xpRequired;
    const progress = Math.min((xpInCurrentLevel / xpNeededForNext) * 100, 100);

    // Check for level up
    if (level > currentLevel) {
      triggerLevelUpAnimation(level);
      onLevelUp?.(level, nextLevelData);
    }

    setCurrentLevel(level);
    setNextLevel(Math.min(level + 1, LEVELS.length));
    setProgressPercent(progress);
    setXpToNext(nextLevelData.xpRequired - currentXP);

    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Glow animation when close to level up
    if (progress >= 80) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentXP]);

  useEffect(() => {
    calculateLevel();
  }, [calculateLevel]);

  const triggerLevelUpAnimation = (newLevel) => {
    setShowLevelUp(true);

    // Level up scale animation
    Animated.sequence([
      Animated.timing(levelUpAnim, {
        toValue: 1.2,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(levelUpAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Shake animation
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();

    // Star burst animation
    starAnims.forEach((anim, index) => {
      Animated.sequence([
        Animated.delay(index * 100),
        Animated.parallel([
          Animated.timing(anim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(anim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });

    setTimeout(() => setShowLevelUp(false), 3000);
  };

  const getLevelData = (level) => {
    if (level > 0 && level <= LEVELS.length) {
      return LEVELS[level - 1];
    }
    return LEVELS[0] || null;
  };
  const currentLevelData = getLevelData(currentLevel);
  const nextLevelData = getLevelData(nextLevel);

  const renderProgressBar = () => {
    const width = progressAnim.interpolate({
      inputRange: [0, 100],
      outputRange: ['0%', '100%'],
    });

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width }]}>
            <LinearGradient
              colors={[currentLevelData.color, nextLevelData.color]}
              style={styles.progressGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressXP}>{currentXP.toLocaleString()} XP</Text>
          <Text style={styles.progressToNext}>
            {xpToNext > 0 ? `${xpToNext.toLocaleString()} to next level` : 'Max Level!'}
          </Text>
        </View>
      </View>
    );
  };

  const renderLevelBadge = (levelData, isNext = false) => (
    <Animated.View
      style={[
        styles.levelBadge,
        isNext && styles.nextLevelBadge,
        !isNext && {
          transform: [{ scale: showLevelUp ? levelUpAnim : 1 }, { translateX: shakeAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={
          isNext
            ? [Colors.background.light, Colors.ui.disabled]
            : [levelData.color, adjustColor(levelData.color, -20)]
        }
        style={styles.levelBadgeGradient}
      >
        <Text style={[styles.levelIcon, isNext && styles.nextLevelIcon]}>{levelData.icon}</Text>
        <Text style={[styles.levelNumber, isNext && styles.nextLevelNumber]}>
          Lv.{levelData.level}
        </Text>
      </LinearGradient>
    </Animated.View>
  );

  const renderStarBurst = () => {
    if (!showLevelUp) return null;

    return starAnims.map((anim, index) => {
      const angle = index * 72 * (Math.PI / 180);
      const translateX = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.cos(angle) * 60],
      });
      const translateY = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.sin(angle) * 60],
      });
      const opacity = anim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 1, 0],
      });

      return (
        <Animated.Text
          key={index}
          style={[
            styles.burstStar,
            {
              opacity,
              transform: [{ translateX }, { translateY }],
            },
          ]}
        >
          ⭐
        </Animated.Text>
      );
    });
  };

  const renderLevelUpModal = () => {
    if (!showLevelUp) return null;

    return (
      <Animated.View style={[styles.levelUpOverlay, { opacity: levelUpAnim }]}>
        <View style={styles.levelUpContent}>
          <Text style={styles.levelUpTitle}>🎉 Level Up!</Text>
          <Text style={styles.levelUpLevel}>You reached Level {currentLevel}</Text>
          <Text style={styles.levelUpName}>{currentLevelData.name}</Text>
        </View>
      </Animated.View>
    );
  };

  const renderXPActions = () => (
    <View style={styles.xpActionsContainer}>
      <Text style={styles.xpActionsTitle}>Earn XP</Text>
      <View style={styles.xpActionsGrid}>
        {Object.entries(XP_ACTIONS)
          .slice(0, 4)
          .map(([key, action]) => (
            <View key={key} style={styles.xpActionItem}>
              <Text style={styles.xpActionPoints}>+{action.xp}</Text>
              <Text style={styles.xpActionLabel}>{action.label}</Text>
            </View>
          ))}
      </View>
    </View>
  );

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactContainer} onPress={onViewRewards} activeOpacity={0.8}>
        <View style={styles.compactBadge}>
          <Text style={styles.compactIcon}>{currentLevelData.icon}</Text>
        </View>
        <View style={styles.compactInfo}>
          <Text style={styles.compactLevel}>Lv.{currentLevel}</Text>
          <View style={styles.compactProgress}>
            <Animated.View
              style={[
                styles.compactProgressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: currentLevelData.color,
                },
              ]}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎮 Level Progression</Text>
        <TouchableOpacity onPress={onViewRewards}>
          <Text style={styles.viewRewards}>View Rewards</Text>
        </TouchableOpacity>
      </View>

      {/* Level display */}
      <View style={styles.levelDisplay}>
        {renderLevelBadge(currentLevelData)}
        {renderStarBurst()}

        <View style={styles.levelInfo}>
          <Text style={styles.levelName}>{currentLevelData.name}</Text>
          {renderProgressBar()}
        </View>

        {nextLevel <= LEVELS.length && renderLevelBadge(nextLevelData, true)}
      </View>

      {/* Level up notification */}
      {renderLevelUpModal()}

      {/* XP actions */}
      {showDetails && renderXPActions()}

      {/* Next rewards preview */}
      {showDetails && nextLevel <= LEVELS.length && (
        <View style={styles.nextRewardContainer}>
          <LinearGradient
            colors={['rgba(255, 215, 0, 0.1)', 'rgba(255, 165, 0, 0.1)']}
            style={styles.nextRewardGradient}
          >
            <Ionicons name="gift" size={24} color={Colors.accent.gold} />
            <View style={styles.nextRewardInfo}>
              <Text style={styles.nextRewardTitle}>Next Level Reward</Text>
              <Text style={styles.nextRewardDesc}>
                Unlock {nextLevelData.name} badge and special perks!
              </Text>
            </View>
          </LinearGradient>
        </View>
      )}
    </View>
  );
};

// Helper function to adjust color brightness
const adjustColor = (color, amount) => {
  const clamp = (num) => Math.min(255, Math.max(0, num));

  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const num = parseInt(hex, 16);
    const r = clamp((num >> 16) + amount);
    const g = clamp(((num >> 8) & 0x00ff) + amount);
    const b = clamp((num & 0x0000ff) + amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }
  return color;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.white,
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.dark,
  },
  viewRewards: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  levelDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  levelBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  nextLevelBadge: {
    opacity: 0.5,
  },
  levelBadgeGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelIcon: {
    fontSize: 24,
  },
  nextLevelIcon: {
    opacity: 0.5,
  },
  levelNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.background.white,
    marginTop: 2,
  },
  nextLevelNumber: {
    color: Colors.text.tertiary,
  },
  levelInfo: {
    flex: 1,
    marginHorizontal: 16,
  },
  levelName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.dark,
    marginBottom: 8,
  },
  progressContainer: {
    width: '100%',
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.background.light,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressGradient: {
    width: '100%',
    height: '100%',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressXP: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.dark,
  },
  progressToNext: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  burstStar: {
    position: 'absolute',
    fontSize: 16,
    left: 24,
    top: 24,
  },
  levelUpOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  levelUpContent: {
    alignItems: 'center',
  },
  levelUpTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.accent.gold,
    marginBottom: 8,
  },
  levelUpLevel: {
    fontSize: 18,
    color: Colors.background.white,
    marginBottom: 4,
  },
  levelUpName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.accent.teal,
  },
  xpActionsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.background.light,
  },
  xpActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 12,
  },
  xpActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  xpActionItem: {
    backgroundColor: Colors.background.lightest,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 70,
  },
  xpActionPoints: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accent.teal,
  },
  xpActionLabel: {
    fontSize: 10,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  nextRewardContainer: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  nextRewardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  nextRewardInfo: {
    flex: 1,
  },
  nextRewardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.status.warningOrange,
  },
  nextRewardDesc: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.white,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  compactBadge: {
    marginRight: 8,
  },
  compactIcon: {
    fontSize: 20,
  },
  compactInfo: {
    alignItems: 'center',
  },
  compactLevel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.dark,
  },
  compactProgress: {
    width: 40,
    height: 3,
    backgroundColor: Colors.background.light,
    borderRadius: 1.5,
    marginTop: 2,
    overflow: 'hidden',
  },
  compactProgressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
});

export default LevelProgressionCard;
