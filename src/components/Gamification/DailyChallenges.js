import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';

const DAILY_CHALLENGES = [
  {
    id: 'swipe_10',
    title: 'Active Swiper',
    description: 'Swipe on 10 profiles today',
    icon: '👆',
    type: 'swipe',
    target: 10,
    xpReward: 20,
    coinReward: 5,
    difficulty: 'easy',
  },
  {
    id: 'send_3_messages',
    title: 'Conversation Starter',
    description: 'Send messages to 3 different matches',
    icon: '💬',
    type: 'message',
    target: 3,
    xpReward: 30,
    coinReward: 10,
    difficulty: 'medium',
  },
  {
    id: 'update_profile',
    title: 'Profile Polish',
    description: 'Add or update one profile photo',
    icon: '📸',
    type: 'profile',
    target: 1,
    xpReward: 25,
    coinReward: 5,
    difficulty: 'easy',
  },
  {
    id: 'super_like',
    title: 'Show Interest',
    description: 'Use a Super Like on someone special',
    icon: '⭐',
    type: 'super_like',
    target: 1,
    xpReward: 15,
    coinReward: 3,
    difficulty: 'easy',
  },
  {
    id: 'match_1',
    title: 'Make a Connection',
    description: 'Get at least 1 new match',
    icon: '💘',
    type: 'match',
    target: 1,
    xpReward: 50,
    coinReward: 15,
    difficulty: 'hard',
  },
  {
    id: 'explore_profiles',
    title: 'Profile Explorer',
    description: 'View 5 complete profiles',
    icon: '🔍',
    type: 'view_profile',
    target: 5,
    xpReward: 15,
    coinReward: 3,
    difficulty: 'easy',
  },
];

const DIFFICULTY_COLORS = {
  easy: { bg: Colors.status.successLight, text: Colors.status.success },
  medium: { bg: Colors.status.warningLight, text: Colors.status.warning },
  hard: { bg: Colors.status.errorLight, text: Colors.status.error },
};

const DailyChallenges = ({
  challenges = [],
  progress = {},
  onChallengePress,
  onClaimReward,
  timeRemaining = 86400, // seconds until reset
}) => {
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimedChallenge, setClaimedChallenge] = useState(null);

  // Animation values
  const progressAnims = useRef(DAILY_CHALLENGES.map(() => new Animated.Value(0))).current;
  const shineAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const confettiAnims = useRef(
    [...Array(20)].map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Animate progress bars
    DAILY_CHALLENGES.forEach((challenge, index) => {
      const currentProgress = progress[challenge.id]?.current || 0;
      const percent = Math.min((currentProgress / challenge.target) * 100, 100);

      Animated.timing(progressAnims[index], {
        toValue: percent,
        duration: 800,
        delay: index * 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    });

    // Shine animation for completed challenges
    Animated.loop(
      Animated.timing(shineAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [progress, progressAnims, shineAnim]);

  const formatTimeRemaining = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const isCompleted = (challengeId) => {
    const challenge = DAILY_CHALLENGES.find((c) => c.id === challengeId);
    const current = progress[challengeId]?.current || 0;
    return current >= challenge.target;
  };

  const isClaimed = (challengeId) => progress[challengeId]?.claimed || false;

  const handleClaimReward = (challenge) => {
    setClaimedChallenge(challenge);
    setShowClaimModal(true);

    // Trigger confetti
    confettiAnims.forEach((anim, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 100;

      Animated.parallel([
        Animated.timing(anim.x, {
          toValue: Math.cos(angle) * distance,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(anim.y, {
          toValue: Math.sin(angle) * distance - 50,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.delay(700),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        anim.x.setValue(0);
        anim.y.setValue(0);
      });
    });

    // Bounce animation
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    onClaimReward?.(challenge);
  };

  const getCompletedCount = () => {
    return DAILY_CHALLENGES.filter((c) => isCompleted(c.id)).length;
  };

  const renderChallengeCard = (challenge, index) => {
    const current = progress[challenge.id]?.current || 0;
    const percent = Math.min((current / challenge.target) * 100, 100);
    const completed = isCompleted(challenge.id);
    const claimed = isClaimed(challenge.id);
    const difficultyStyle = DIFFICULTY_COLORS[challenge.difficulty];

    const progressWidth = progressAnims[index].interpolate({
      inputRange: [0, 100],
      outputRange: ['0%', '100%'],
    });

    const shineTranslate = shineAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-100, 300],
    });

    return (
      <TouchableOpacity
        key={challenge.id}
        style={[
          styles.challengeCard,
          completed && !claimed && styles.completedCard,
          claimed && styles.claimedCard,
        ]}
        onPress={() => {
          if (completed && !claimed) {
            handleClaimReward(challenge);
          } else {
            onChallengePress?.(challenge);
          }
        }}
        activeOpacity={0.8}
      >
        {/* Completion shine effect */}
        {completed && !claimed && (
          <Animated.View
            style={[styles.shineEffect, { transform: [{ translateX: shineTranslate }] }]}
          />
        )}

        <View style={styles.challengeHeader}>
          <View style={styles.challengeIconContainer}>
            <Text style={styles.challengeIcon}>{challenge.icon}</Text>
          </View>

          <View style={styles.challengeInfo}>
            <View style={styles.challengeTitleRow}>
              <Text style={styles.challengeTitle}>{challenge.title}</Text>
              <View style={[styles.difficultyBadge, { backgroundColor: difficultyStyle.bg }]}>
                <Text style={[styles.difficultyText, { color: difficultyStyle.text }]}>
                  {challenge.difficulty}
                </Text>
              </View>
            </View>
            <Text style={styles.challengeDescription}>{challenge.description}</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressWidth,
                  backgroundColor: completed ? Colors.accent.teal : Colors.primary,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {current}/{challenge.target}
          </Text>
        </View>

        {/* Rewards */}
        <View style={styles.rewardsRow}>
          <View style={styles.rewardItem}>
            <Text style={styles.rewardIcon}>⚡</Text>
            <Text style={styles.rewardValue}>+{challenge.xpReward} XP</Text>
          </View>
          <View style={styles.rewardItem}>
            <Text style={styles.rewardIcon}>🪙</Text>
            <Text style={styles.rewardValue}>+{challenge.coinReward}</Text>
          </View>

          {/* Claim button */}
          {completed && !claimed && (
            <LinearGradient colors={Colors.gradient.teal} style={styles.claimButton}>
              <Text style={styles.claimButtonText}>Claim</Text>
            </LinearGradient>
          )}
          {claimed && (
            <View style={styles.claimedBadge}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.accent.teal} />
              <Text style={styles.claimedText}>Claimed</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderClaimModal = () => (
    <Modal
      visible={showClaimModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowClaimModal(false)}
    >
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.claimModalContent, { transform: [{ scale: bounceAnim }] }]}>
          {/* Confetti */}
          {confettiAnims.map((anim, i) => (
            <Animated.Text
              key={i}
              style={[
                styles.confetti,
                {
                  opacity: anim.opacity,
                  transform: [{ translateX: anim.x }, { translateY: anim.y }],
                },
              ]}
            >
              {['🎉', '⭐', '🎊', '✨'][i % 4]}
            </Animated.Text>
          ))}

          <Text style={styles.claimModalTitle}>🎉 Challenge Complete!</Text>
          <Text style={styles.claimModalChallenge}>{claimedChallenge?.title}</Text>

          <View style={styles.claimRewardsContainer}>
            <Text style={styles.claimRewardsTitle}>Rewards Earned:</Text>
            <View style={styles.claimRewardsRow}>
              <View style={styles.claimRewardItem}>
                <Text style={styles.claimRewardEmoji}>⚡</Text>
                <Text style={styles.claimRewardValue}>+{claimedChallenge?.xpReward} XP</Text>
              </View>
              <View style={styles.claimRewardItem}>
                <Text style={styles.claimRewardEmoji}>🪙</Text>
                <Text style={styles.claimRewardValue}>+{claimedChallenge?.coinReward} Coins</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.claimModalButton}
            onPress={() => setShowClaimModal(false)}
          >
            <LinearGradient
              colors={Colors.gradient.primary}
              style={styles.claimModalButtonGradient}
            >
              <Text style={styles.claimModalButtonText}>Awesome!</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>🎯 Daily Challenges</Text>
          <View style={styles.completionBadge}>
            <Text style={styles.completionText}>
              {getCompletedCount()}/{DAILY_CHALLENGES.length}
            </Text>
          </View>
        </View>
        <View style={styles.timerContainer}>
          <Ionicons name="time-outline" size={14} color={Colors.text.tertiary} />
          <Text style={styles.timerText}>{formatTimeRemaining(timeRemaining)}</Text>
        </View>
      </View>

      {/* Challenges list */}
      <ScrollView style={styles.challengesList} showsVerticalScrollIndicator={false}>
        {DAILY_CHALLENGES.map((challenge, index) => renderChallengeCard(challenge, index))}
      </ScrollView>

      {/* Bonus progress */}
      <View style={styles.bonusContainer}>
        <LinearGradient
          colors={['rgba(255, 215, 0, 0.1)', 'rgba(255, 165, 0, 0.1)']}
          style={styles.bonusGradient}
        >
          <View style={styles.bonusInfo}>
            <Ionicons name="gift" size={20} color={Colors.accent.gold} />
            <Text style={styles.bonusText}>Complete all challenges for bonus rewards!</Text>
          </View>
          <View style={styles.bonusProgress}>
            <View
              style={[
                styles.bonusProgressFill,
                {
                  width: `${(getCompletedCount() / DAILY_CHALLENGES.length) * 100}%`,
                },
              ]}
            />
          </View>
        </LinearGradient>
      </View>

      {renderClaimModal()}
    </View>
  );
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
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.dark,
  },
  completionBadge: {
    backgroundColor: Colors.status.infoLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  completionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  challengesList: {
    maxHeight: 400,
  },
  challengeCard: {
    backgroundColor: Colors.background.lightest,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  completedCard: {
    backgroundColor: Colors.status.successLight,
    borderWidth: 1,
    borderColor: Colors.accent.teal,
  },
  claimedCard: {
    opacity: 0.7,
  },
  shineEffect: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ skewX: '-20deg' }],
  },
  challengeHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  challengeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  challengeIcon: {
    fontSize: 24,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  challengeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.dark,
  },
  difficultyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  challengeDescription: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.dark,
    minWidth: 40,
    textAlign: 'right',
  },
  rewardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardIcon: {
    fontSize: 14,
  },
  rewardValue: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  claimButton: {
    marginLeft: 'auto',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  claimButtonText: {
    color: Colors.background.white,
    fontSize: 12,
    fontWeight: '600',
  },
  claimedBadge: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  claimedText: {
    fontSize: 12,
    color: Colors.accent.teal,
    fontWeight: '600',
  },
  bonusContainer: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bonusGradient: {
    padding: 16,
  },
  bonusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  bonusText: {
    fontSize: 12,
    color: Colors.status.warningOrange,
    fontWeight: '500',
  },
  bonusProgress: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  bonusProgressFill: {
    height: '100%',
    backgroundColor: Colors.accent.gold,
    borderRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimModalContent: {
    backgroundColor: Colors.background.white,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '80%',
    maxWidth: 320,
  },
  confetti: {
    position: 'absolute',
    fontSize: 20,
  },
  claimModalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text.dark,
    marginBottom: 8,
  },
  claimModalChallenge: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: 24,
  },
  claimRewardsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  claimRewardsTitle: {
    fontSize: 14,
    color: Colors.text.tertiary,
    marginBottom: 12,
    textAlign: 'center',
  },
  claimRewardsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  claimRewardItem: {
    alignItems: 'center',
  },
  claimRewardEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  claimRewardValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.dark,
  },
  claimModalButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  claimModalButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  claimModalButtonText: {
    color: Colors.background.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default DailyChallenges;
