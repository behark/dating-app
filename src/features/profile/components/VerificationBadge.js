import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/colors';

const VERIFICATION_TYPES = {
  PHOTO: {
    icon: 'camera',
    color: Colors.accent.teal,
    gradient: Colors.gradient.teal,
    label: 'Photo Verified',
    shortLabel: 'Photo',
  },
  ID: {
    icon: 'card',
    color: Colors.primary,
    gradient: Colors.gradient.primary,
    label: 'ID Verified',
    shortLabel: 'ID',
  },
  PHONE: {
    icon: 'call',
    color: Colors.accent.red,
    gradient: Colors.gradient.redOrange,
    label: 'Phone Verified',
    shortLabel: 'Phone',
  },
  EMAIL: {
    icon: 'mail',
    color: Colors.accent.blue,
    gradient: Colors.gradient.blue,
    label: 'Email Verified',
    shortLabel: 'Email',
  },
  SOCIAL: {
    icon: 'share-social',
    color: Colors.accent.purple,
    gradient: Colors.gradient.purple,
    label: 'Social Verified',
    shortLabel: 'Social',
  },
  PREMIUM: {
    icon: 'diamond',
    color: Colors.accent.gold,
    gradient: Colors.gradient.gold,
    label: 'Premium Member',
    shortLabel: 'Premium',
  },
  TRUSTED: {
    icon: 'shield-checkmark',
    color: Colors.accent.green,
    gradient: Colors.gradient.green,
    label: 'Trusted User',
    shortLabel: 'Trusted',
  },
};

const VerificationBadge = ({
  type = 'PHOTO',
  size = 'medium',
  animated = true,
  showLabel = false,
  showTooltip = true,
  onPress,
  verified = true,
  style,
}) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  const verification = VERIFICATION_TYPES[type] || VERIFICATION_TYPES.PHOTO;

  const sizes = {
    small: { badge: 24, icon: 12, font: 10 },
    medium: { badge: 32, icon: 16, font: 12 },
    large: { badge: 48, icon: 24, font: 14 },
    xlarge: { badge: 64, icon: 32, font: 16 },
  };

  const currentSize = sizes[size] || sizes.medium;

  useEffect(() => {
    if (animated && verified) {
      // Entrance animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        }),
      ]).start();

      // Continuous pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Shimmer animation for premium badges
      if (type === 'PREMIUM' || type === 'TRUSTED') {
        Animated.loop(
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ).start();
      }
    } else {
      scaleAnim.setValue(1);
      rotateAnim.setValue(1);
    }
  }, [animated, verified, type, pulseAnim, rotateAnim, scaleAnim, shimmerAnim]);

  const handlePress = () => {
    if (showTooltip) {
      setTooltipVisible(!tooltipVisible);
      setTimeout(() => setTooltipVisible(false), 2000);
    }
    onPress?.();
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-currentSize.badge, currentSize.badge * 2],
  });

  if (!verified) return null;

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={!showTooltip && !onPress}
      >
        <Animated.View
          style={[
            styles.badgeContainer,
            {
              width: currentSize.badge,
              height: currentSize.badge,
              borderRadius: currentSize.badge / 2,
              transform: [
                { scale: Animated.multiply(scaleAnim, pulseAnim) },
                { rotate: animated ? rotation : '0deg' },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={verification.gradient}
            style={[
              styles.badgeGradient,
              {
                width: currentSize.badge,
                height: currentSize.badge,
                borderRadius: currentSize.badge / 2,
              },
            ]}
          >
            <Ionicons
              name={verification.icon}
              size={currentSize.icon}
              color={Colors.background.white}
            />

            {/* Shimmer effect for special badges */}
            {(type === 'PREMIUM' || type === 'TRUSTED') && (
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

          {/* Glow effect */}
          <View
            style={[
              styles.glow,
              {
                backgroundColor: verification.color,
                width: currentSize.badge + 8,
                height: currentSize.badge + 8,
                borderRadius: (currentSize.badge + 8) / 2,
              },
            ]}
          />
        </Animated.View>
      </TouchableOpacity>

      {/* Label */}
      {showLabel && (
        <Text
          style={[
            styles.label,
            {
              fontSize: currentSize.font,
              color: verification.color,
            },
          ]}
        >
          {verification.shortLabel}
        </Text>
      )}

      {/* Tooltip */}
      {tooltipVisible && (
        <Animated.View style={styles.tooltip}>
          <Text style={styles.tooltipText}>{verification.label}</Text>
        </Animated.View>
      )}
    </View>
  );
};

// Multi-badge display component
export const VerificationBadgeGroup = ({
  verifications = [],
  size = 'small',
  maxDisplay = 3,
  onPress,
}) => {
  const displayedBadges = verifications.slice(0, maxDisplay);
  const remainingCount = verifications.length - maxDisplay;

  return (
    <View style={styles.groupContainer}>
      {displayedBadges.map((type, index) => (
        <View
          key={type}
          style={[
            styles.groupBadge,
            { marginLeft: index > 0 ? -8 : 0, zIndex: maxDisplay - index },
          ]}
        >
          <VerificationBadge
            type={type}
            size={size}
            animated={false}
            showTooltip={true}
            onPress={() => onPress?.(type)}
          />
        </View>
      ))}
      {remainingCount > 0 && (
        <View style={styles.moreCount}>
          <Text style={styles.moreCountText}>+{remainingCount}</Text>
        </View>
      )}
    </View>
  );
};

// Large verification display for profile
export const VerificationStatus = ({ verifications = [], onVerify, onPress }) => {
  const allTypes = Object.keys(VERIFICATION_TYPES);
  const verifiedTypes = verifications.filter(Boolean);
  const unverifiedTypes = allTypes.filter((t) => !verifiedTypes.includes(t) && t !== 'PREMIUM');

  return (
    <View style={styles.statusContainer}>
      <View style={styles.statusHeader}>
        <Ionicons name="shield-checkmark" size={20} color={Colors.accent.teal} />
        <Text style={styles.statusTitle}>Verification Status</Text>
      </View>

      {/* Verified badges */}
      {verifiedTypes.length > 0 && (
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>✓ Verified</Text>
          <View style={styles.badgesGrid}>
            {verifiedTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.statusBadgeItem}
                onPress={() => onPress?.(type)}
              >
                <VerificationBadge type={type} size="medium" showLabel />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Not verified badges */}
      {unverifiedTypes.length > 0 && (
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitlePending}>Pending Verification</Text>
          <View style={styles.badgesGrid}>
            {unverifiedTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.pendingBadgeItem}
                onPress={() => onVerify?.(type)}
              >
                <View style={styles.pendingBadge}>
                  <Ionicons
                    name={VERIFICATION_TYPES[type].icon}
                    size={20}
                    color={Colors.text.tertiary}
                  />
                  <Text style={styles.pendingLabel}>{VERIFICATION_TYPES[type].shortLabel}</Text>
                </View>
                <Text style={styles.verifyText}>Verify</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Verification progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Profile Trust Score</Text>
          <Text style={styles.progressValue}>
            {Math.round((verifiedTypes.length / (allTypes.length - 1)) * 100)}%
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={[Colors.accent.teal, Colors.accent.green]}
            style={[
              styles.progressFill,
              {
                width: `${(verifiedTypes.length / (allTypes.length - 1)) * 100}%`,
              },
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  badgeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  badgeGradient: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    width: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ skewX: '-20deg' }],
  },
  glow: {
    position: 'absolute',
    opacity: 0.3,
    zIndex: -1,
  },
  label: {
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center',
  },
  tooltip: {
    position: 'absolute',
    top: '100%',
    marginTop: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 100,
  },
  tooltipText: {
    color: Colors.background.white,
    fontSize: 12,
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  groupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupBadge: {
    borderWidth: 2,
    borderColor: Colors.background.white,
    borderRadius: 20,
  },
  moreCount: {
    marginLeft: 4,
    backgroundColor: Colors.background.light,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  moreCountText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  statusContainer: {
    backgroundColor: Colors.background.white,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.dark,
  },
  statusSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent.teal,
    marginBottom: 12,
  },
  sectionTitlePending: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.tertiary,
    marginBottom: 12,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statusBadgeItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  pendingBadgeItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  pendingBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  pendingLabel: {
    position: 'absolute',
    bottom: -16,
    fontSize: 10,
    color: Colors.text.tertiary,
  },
  verifyText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 18,
  },
  progressSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.background.light,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accent.teal,
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
  },
});

export default VerificationBadge;
