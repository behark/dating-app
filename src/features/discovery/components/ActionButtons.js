import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Alert, Platform, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/colors';
import DESIGN_TOKENS from '../../../constants/designTokens';

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
        <TouchableOpacity style={styles.undoButton} onPress={onUndo} activeOpacity={0.8}>
          <Ionicons name="arrow-undo" size={24} color={Colors.primary} />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.dislikeButton}
        onPress={() => onSwipeLeft(cards[currentIndex])}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={DESIGN_TOKENS.colors.gradients.discovery}
          style={styles.actionButtonCircle}
        >
          <Ionicons name="close" size={32} color={Colors.background.white} />
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.superLikeButton, !canSuperLike && styles.disabledButton]}
        onPress={handleSuperLikePress}
        activeOpacity={0.8}
        disabled={!canSuperLike}
      >
        <LinearGradient
          colors={canSuperLike ? DESIGN_TOKENS.colors.gradients.matches : Colors.gradient.disabled}
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
        <LinearGradient
          colors={DESIGN_TOKENS.colors.gradients.profile}
          style={styles.actionButtonCircle}
        >
          <Ionicons name="heart" size={32} color={Colors.background.white} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = {
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 14,
  },
  undoButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.08)',
  },
  dislikeButton: {
    width: 58,
    height: 58,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px 6px 16px rgba(244,63,94,0.3)' },
      default: {
        shadowColor: '#F43F5E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
      },
    }),
  },
  superLikeButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px 6px 16px rgba(78,205,196,0.3)' },
      default: {
        shadowColor: '#4ECDC4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
      },
    }),
  },
  likeButton: {
    width: 66,
    height: 66,
    borderRadius: 22,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px 6px 16px rgba(108,99,255,0.35)' },
      default: {
        shadowColor: '#6C63FF',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 10,
      },
    }),
  },
  actionButtonCircle: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  limitBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F43F5E',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
};

export default ActionButtons;
