import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/colors';

const ActionButtons = ({
  cards,
  currentIndex,
  lastSwipedCard,
  superLikesUsed,
  premiumFeatures,
  onSwipeLeft,
  onSwipeRight,
  onSuperLike,
  onUndo,
  onUpgradePress,
}) => {
  const hasCards = cards.length > 0 && currentIndex < cards.length;
  const canSuperLike = hasCards && superLikesUsed < (premiumFeatures.superLikesPerDay || 1);

  if (!hasCards) return null;

  const handleSuperLikePress = () => {
    if (!canSuperLike) {
      Alert.alert(
        'Super Like Limit',
        "You've reached your daily limit. Upgrade to premium for unlimited super likes!",
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: onUpgradePress },
        ]
      );
      return;
    }

    onSuperLike(cards[currentIndex]);
  };

  return (
    <View style={styles.actionButtonsContainer}>
      {lastSwipedCard && (
        <TouchableOpacity
          style={styles.undoButton}
          onPress={onUndo}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-undo" size={24} color={Colors.primary} />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.dislikeButton}
        onPress={() => onSwipeLeft(cards[currentIndex])}
        activeOpacity={0.8}
      >
        <LinearGradient colors={Colors.gradient.red} style={styles.actionButtonCircle}>
          <Ionicons name="close" size={32} color={Colors.background.white} />
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.superLikeButton,
          !canSuperLike && styles.disabledButton,
        ]}
        onPress={handleSuperLikePress}
        activeOpacity={0.8}
        disabled={!canSuperLike}
      >
        <LinearGradient
          colors={
            canSuperLike
              ? Colors.gradient.teal
              : Colors.gradient.disabled
          }
          style={styles.actionButtonCircle}
        >
          <Ionicons name="star" size={28} color={Colors.background.white} />
        </LinearGradient>
        {!canSuperLike && (
          <View style={styles.limitBadge}>
            <Ionicons name="lock-closed" size={12} color={Colors.background.white} />
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.likeButton}
        onPress={() => onSwipeRight(cards[currentIndex])}
        activeOpacity={0.8}
      >
        <LinearGradient colors={Colors.gradient.primary} style={styles.actionButtonCircle}>
          <Ionicons name="heart" size={32} color={Colors.background.white} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = {
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 15,
  },
  undoButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.background.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    marginRight: 10,
  },
  dislikeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: Colors.accent.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  superLikeButton: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    overflow: 'hidden',
    shadowColor: Colors.accent.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  likeButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButtonCircle: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  limitBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: Colors.accent.red,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background.white,
  },
};

export default ActionButtons;