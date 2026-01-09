import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/colors';

const GuestModeBanner = ({
  guestViewCount,
  GUEST_FREE_VIEWS,
  onSignUpPress
}) => {
  const hasReachedLimit = guestViewCount >= GUEST_FREE_VIEWS;

  return (
    <View style={styles.guestBanner}>
      <View style={styles.guestBannerContent}>
        <Ionicons name="eye-outline" size={18} color={Colors.primary} />
        <Text style={styles.guestBannerText}>
          {hasReachedLimit
            ? '🔥 Last chance!'
            : 'Browsing as Guest'}
        </Text>
        {!hasReachedLimit && (
          <Text style={styles.guestBannerCount}>
            {Math.max(0, GUEST_FREE_VIEWS - guestViewCount)} free views left
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={[
          styles.guestSignUpButton,
          hasReachedLimit && styles.guestSignUpButtonUrgent
        ]}
        onPress={onSignUpPress}
        activeOpacity={0.8}
      >
        <Text style={styles.guestSignUpButtonText}>
          {hasReachedLimit ? '🚀 Sign Up Now' : 'Join Free'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = {
  guestBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  guestBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guestBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  guestBannerCount: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginLeft: 8,
  },
  guestSignUpButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  guestSignUpButtonUrgent: {
    backgroundColor: Colors.accent.red,
    shadowColor: Colors.accent.red,
  },
  guestSignUpButtonText: {
    color: Colors.background.white,
    fontSize: 13,
    fontWeight: '700',
  },
};

export default GuestModeBanner;