import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PROFILE_SECTIONS = [
  { id: 'photos', label: 'Photos', icon: 'images', weight: 25, minCount: 3 },
  { id: 'bio', label: 'Bio', icon: 'document-text', weight: 15, minLength: 50 },
  { id: 'basics', label: 'Basic Info', icon: 'person', weight: 15 },
  { id: 'interests', label: 'Interests', icon: 'heart', weight: 15, minCount: 3 },
  { id: 'verification', label: 'Verification', icon: 'shield-checkmark', weight: 15 },
  { id: 'video', label: 'Video Intro', icon: 'videocam', weight: 10 },
  { id: 'prompts', label: 'Prompts', icon: 'chatbubble', weight: 5, minCount: 2 },
];

const ProfileCompletionProgress = ({
  profileData = {},
  onSectionPress,
  showDetails = true,
  compact = false,
}) => {
  const [completedSections, setCompletedSections] = useState([]);
  const [totalProgress, setTotalProgress] = useState(0);

  // Animation values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const circleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const sectionAnims = useRef(PROFILE_SECTIONS.map(() => new Animated.Value(0))).current;

  const calculateProgress = useCallback(() => {
    const completed = [];
    let weightedProgress = 0;

    PROFILE_SECTIONS.forEach((section) => {
      const isComplete = checkSectionComplete(section);
      if (isComplete) {
        completed.push(section.id);
        weightedProgress += section.weight;
      }
    });

    setCompletedSections(completed);
    setTotalProgress(weightedProgress);

    // Animate progress
    Animated.parallel([
      Animated.timing(progressAnim, {
        toValue: weightedProgress,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(circleAnim, {
        toValue: weightedProgress / 100,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();

    // Animate sections
    sectionAnims.forEach((anim, index) => {
      const isComplete = completed.includes(PROFILE_SECTIONS[index].id);
      Animated.spring(anim, {
        toValue: isComplete ? 1 : 0,
        friction: 6,
        tension: 80,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    });

    // Pulse animation if not complete
    if (weightedProgress < 100) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [profileData, progressAnim, circleAnim, pulseAnim, sectionAnims]);

  useEffect(() => {
    calculateProgress();
  }, [calculateProgress]);

  const checkSectionComplete = (section) => {
    switch (section.id) {
      case 'photos':
        return (profileData.photos?.length || 0) >= section.minCount;
      case 'bio':
        return (profileData.bio?.length || 0) >= section.minLength;
      case 'basics':
        return profileData.name && profileData.age && profileData.location;
      case 'interests':
        return (profileData.interests?.length || 0) >= section.minCount;
      case 'verification':
        return profileData.isVerified || profileData.photoVerified;
      case 'video':
        return !!profileData.videoUrl;
      case 'prompts':
        return (profileData.prompts?.length || 0) >= section.minCount;
      default:
        return false;
    }
  };

  const getNextAction = () => {
    for (const section of PROFILE_SECTIONS) {
      if (!completedSections.includes(section.id)) {
        return section;
      }
    }
    return null;
  };

  const renderCircularProgress = () => {
    const size = compact ? 80 : 120;
    const strokeWidth = compact ? 6 : 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    const strokeDashoffset = circleAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [circumference, 0],
    });

    return (
      <Animated.View
        style={[
          styles.circularContainer,
          { width: size, height: size },
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <View style={styles.circularBackground}>
          {/* Background circle */}
          <View
            style={[
              styles.circleTrack,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: strokeWidth,
              },
            ]}
          />

          {/* Progress arc - using a workaround since SVG isn't available */}
          <Animated.View
            style={[
              styles.progressArc,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: strokeWidth,
                borderColor: totalProgress >= 100 ? Colors.accent.teal : Colors.primary,
                borderTopColor: 'transparent',
                borderRightColor: 'transparent',
                transform: [
                  {
                    rotate: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>

        {/* Center content */}
        <View style={styles.circularCenter}>
          <Animated.Text style={[styles.progressText, { fontSize: compact ? 20 : 28 }]}>
            {totalProgress}%
          </Animated.Text>
          <Text style={[styles.progressLabel, { fontSize: compact ? 10 : 12 }]}>Complete</Text>
        </View>
      </Animated.View>
    );
  };

  const renderSectionItem = (section, index) => {
    const isComplete = completedSections.includes(section.id);

    const scale = sectionAnims[index].interpolate({
      inputRange: [0, 1],
      outputRange: [0.9, 1],
    });

    const backgroundColor = sectionAnims[index].interpolate({
      inputRange: [0, 1],
      outputRange: [
        Colors.background.light,
        section.id === 'verification' ? Colors.status.successLight : Colors.status.infoLight,
      ],
    });

    return (
      <TouchableOpacity
        key={section.id}
        onPress={() => onSectionPress?.(section.id)}
        activeOpacity={0.7}
      >
        <Animated.View
          style={[
            styles.sectionItem,
            {
              transform: [{ scale }],
              backgroundColor,
            },
          ]}
        >
          <View style={styles.sectionIconContainer}>
            {isComplete ? (
              <LinearGradient colors={Colors.gradient.teal} style={styles.completedIcon}>
                <Ionicons name="checkmark" size={16} color={Colors.background.white} />
              </LinearGradient>
            ) : (
              <View style={styles.incompleteIcon}>
                <Ionicons name={section.icon} size={16} color={Colors.text.tertiary} />
              </View>
            )}
          </View>

          <View style={styles.sectionContent}>
            <Text style={[styles.sectionLabel, isComplete && styles.sectionLabelComplete]}>
              {section.label}
            </Text>
            <Text style={styles.sectionWeight}>+{section.weight}%</Text>
          </View>

          {!isComplete && (
            <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderNextAction = () => {
    const nextAction = getNextAction();
    if (!nextAction || compact) return null;

    return (
      <TouchableOpacity
        style={styles.nextActionContainer}
        onPress={() => onSectionPress?.(nextAction.id)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={Colors.gradient.primary}
          style={styles.nextActionGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.nextActionContent}>
            <View style={styles.nextActionLeft}>
              <Text style={styles.nextActionLabel}>Next Step</Text>
              <Text style={styles.nextActionTitle}>
                Complete your {nextAction.label.toLowerCase()}
              </Text>
            </View>
            <View style={styles.nextActionIconContainer}>
              <Ionicons name={nextAction.icon} size={24} color={Colors.background.white} />
            </View>
          </View>
          <View style={styles.nextActionBonus}>
            <Ionicons name="sparkles" size={14} color={Colors.accent.gold} />
            <Text style={styles.nextActionBonusText}>+{nextAction.weight}% completion bonus</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderCompactView = () => (
    <TouchableOpacity
      style={styles.compactContainer}
      onPress={() => onSectionPress?.('overview')}
      activeOpacity={0.8}
    >
      <View style={styles.compactLeft}>{renderCircularProgress()}</View>
      <View style={styles.compactRight}>
        <Text style={styles.compactTitle}>Profile Completion</Text>
        <Text style={styles.compactSubtitle}>
          {totalProgress < 100
            ? `${PROFILE_SECTIONS.length - completedSections.length} items left`
            : 'Profile complete! 🎉'}
        </Text>
        {totalProgress < 100 && (
          <View style={styles.compactProgress}>
            <View style={[styles.compactProgressFill, { width: `${totalProgress}%` }]} />
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
    </TouchableOpacity>
  );

  if (compact) {
    return renderCompactView();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Profile Completion</Text>
        {totalProgress >= 100 && (
          <View style={styles.completeBadge}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.accent.teal} />
            <Text style={styles.completeText}>Complete!</Text>
          </View>
        )}
      </View>

      {/* Circular progress */}
      <View style={styles.progressSection}>
        {renderCircularProgress()}
        {totalProgress < 100 && (
          <Text style={styles.encourageText}>Complete your profile to get more matches!</Text>
        )}
      </View>

      {/* Next action */}
      {renderNextAction()}

      {/* Section details */}
      {showDetails && (
        <View style={styles.sectionsContainer}>
          <Text style={styles.sectionsTitle}>Sections</Text>
          {PROFILE_SECTIONS.map((section, index) => renderSectionItem(section, index))}
        </View>
      )}

      {/* Benefits */}
      {totalProgress < 100 && (
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>Benefits of a complete profile:</Text>
          <View style={styles.benefitItem}>
            <Ionicons name="trending-up" size={16} color={Colors.accent.teal} />
            <Text style={styles.benefitText}>Get up to 5x more matches</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="eye" size={16} color={Colors.accent.teal} />
            <Text style={styles.benefitText}>Appear higher in search results</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="shield-checkmark" size={16} color={Colors.accent.teal} />
            <Text style={styles.benefitText}>Build trust with potential matches</Text>
          </View>
        </View>
      )}
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
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.dark,
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.status.successLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  completeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.accent.teal,
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  circularContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularBackground: {
    position: 'absolute',
  },
  circleTrack: {
    position: 'absolute',
    borderColor: Colors.background.light,
  },
  progressArc: {
    position: 'absolute',
  },
  circularCenter: {
    alignItems: 'center',
  },
  progressText: {
    fontWeight: '800',
    color: Colors.text.dark,
  },
  progressLabel: {
    color: Colors.text.tertiary,
    fontWeight: '500',
  },
  encourageText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  nextActionContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  nextActionGradient: {
    padding: 16,
  },
  nextActionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextActionLeft: {
    flex: 1,
  },
  nextActionLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  nextActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.background.white,
    marginTop: 2,
  },
  nextActionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextActionBonus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  nextActionBonusText: {
    fontSize: 12,
    color: Colors.accent.gold,
    fontWeight: '600',
  },
  sectionsContainer: {
    marginTop: 8,
  },
  sectionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 12,
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  sectionIconContainer: {
    marginRight: 12,
  },
  completedIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  incompleteIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.background.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionContent: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.dark,
  },
  sectionLabelComplete: {
    color: Colors.accent.teal,
  },
  sectionWeight: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  benefitsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: Colors.background.lightest,
    borderRadius: 12,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.dark,
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.white,
    borderRadius: 12,
    padding: 12,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  compactLeft: {
    marginRight: 16,
  },
  compactRight: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.dark,
  },
  compactSubtitle: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  compactProgress: {
    height: 4,
    backgroundColor: Colors.background.light,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  compactProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
});

export default ProfileCompletionProgress;
