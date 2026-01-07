import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { UniversalImage } from '../Image';

const UserCard = ({
  user,
  cardWidth,
  onPress,
  showBadges = true,
  distance,
  style,
}) => {
  const {
    name,
    age,
    photos,
    isBoosted,
    isProfileVerified,
    _id,
  } = user;

  return (
    <TouchableOpacity
      style={[styles.userCard, { width: cardWidth, height: cardWidth * 1.3 }, style]}
      onPress={() => onPress?.(user)}
      activeOpacity={0.9}
    >
      {/* User Image */}
      {photos?.[0] ? (
        <UniversalImage
          source={{ uri: photos[0]?.url || photos[0] }}
          style={styles.userImage}
          enableLazy={true}
        />
      ) : (
        <View style={[styles.userImage, styles.placeholderImage]}>
          <Ionicons name="person" size={48} color={Colors.text.light} />
        </View>
      )}

      {/* Boosted Badge */}
      {showBadges && isBoosted && (
        <LinearGradient
          colors={['rgba(255, 215, 0, 0.8)', 'rgba(255, 215, 0, 0.3)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.boostedBadge}
        >
          <Ionicons name="flash" size={16} color={Colors.background.white} />
          <Text style={styles.boostedText}>Boosted</Text>
        </LinearGradient>
      )}

      {/* Verified Badge */}
      {showBadges && isProfileVerified && (
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.status.success} />
        </View>
      )}

      {/* Gradient Overlay */}
      <LinearGradient
        colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.7)']}
        style={styles.gradient}
      />

      {/* Card Content */}
      <View style={styles.cardContent}>
        <Text style={styles.userName}>
          {name}, {age}
        </Text>
        {distance && (
          <View style={styles.distanceRow}>
            <Ionicons name="location" size={14} color={Colors.background.white} />
            <Text style={styles.distance}>{distance.toFixed(1)} km away</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  userCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.background.white,
    marginBottom: 8,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userImage: {
    width: '100%',
    height: '100%',
    
  },
  placeholderImage: {
    backgroundColor: Colors.background.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boostedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  boostedText: {
    color: Colors.background.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.background.white90,
    borderRadius: 20,
    padding: 4,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.background.white,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  distance: {
    fontSize: 12,
    color: Colors.background.white,
  },
});

export default UserCard;