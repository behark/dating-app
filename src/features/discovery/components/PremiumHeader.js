import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/colors';

const PremiumHeader = ({
  isPremium,
  swipesRemaining,
  userLocation,
  superLikesUsed,
  premiumFeatures,
  onUpgradePress,
  onExplorePress,
  onTopPicksPress,
}) => {
  return (
    <View style={styles.premiumHeader}>
      <View style={styles.headerLeftSection}>
        {isPremium ? (
          <LinearGradient colors={Colors.gradient.gold} style={styles.premiumBadge}>
            <Ionicons name="diamond" size={16} color={Colors.background.white} />
            <Text style={styles.premiumText}>PREMIUM</Text>
          </LinearGradient>
        ) : (
          <TouchableOpacity style={styles.upgradePrompt} onPress={onUpgradePress}>
            <Ionicons name="diamond-outline" size={16} color={Colors.accent.gold} />
            <Text style={styles.upgradeText}>Upgrade</Text>
          </TouchableOpacity>
        )}

        {!isPremium && (
          <View style={styles.swipeLimitBadge}>
            <Ionicons name="flame" size={14} color={Colors.accent.red} />
            <Text style={styles.swipeLimitText}>{swipesRemaining}/50</Text>
          </View>
        )}
      </View>

      <View style={styles.headerRightSection}>
        <TouchableOpacity style={styles.discoveryButton} onPress={onTopPicksPress}>
          <Ionicons name="trophy" size={18} color={Colors.accent.gold} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.discoveryButton} onPress={onExplorePress}>
          <Ionicons name="compass" size={18} color={Colors.accent.teal} />
        </TouchableOpacity>
        {userLocation && (
          <View style={styles.locationBadge}>
            <Ionicons name="location" size={14} color={Colors.accent.red} />
            <Text style={styles.locationText}>{userLocation.latitude.toFixed(2)}°</Text>
          </View>
        )}
        <View style={styles.superLikeCounter}>
          <Ionicons name="star" size={16} color={Colors.accent.teal} />
          <Text style={styles.counterText}>
            {Math.max(0, (premiumFeatures.superLikesPerDay || 1) - superLikesUsed)} left
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = {
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    shadowColor: Colors.accent.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  premiumText: {
    color: Colors.background.white,
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 4,
  },
  headerLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  swipeLimitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(242, 139, 130, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.interactive.danger,
  },
  swipeLimitText: {
    color: Colors.interactive.danger,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  upgradePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.accent.gold,
  },
  upgradeText: {
    color: Colors.accent.gold,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  locationText: {
    color: Colors.accent.red,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  headerRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  discoveryButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  superLikeCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  counterText: {
    color: Colors.accent.teal,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
};

export default PremiumHeader;
