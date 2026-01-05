import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../constants/colors';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const REACTIONS = [
  { id: 'heart', emoji: '❤️', name: 'Love', color: Colors.accent.red },
  { id: 'laugh', emoji: '😂', name: 'Haha', color: '#FFD93D' },
  { id: 'wow', emoji: '😮', name: 'Wow', color: Colors.accent.teal },
  { id: 'sad', emoji: '😢', name: 'Sad', color: '#74B9FF' },
  { id: 'angry', emoji: '😡', name: 'Angry', color: '#FF7675' },
  { id: 'fire', emoji: '🔥', name: 'Fire', color: '#FF9F43' },
  { id: 'thumbsup', emoji: '👍', name: 'Like', color: Colors.primary },
  { id: 'clap', emoji: '👏', name: 'Clap', color: '#F8B500' },
];

const MessageReactions = ({
  messageId,
  reactions = [],
  onReact,
  onRemoveReaction,
  disabled = false,
  position = 'bottom', // 'top' or 'bottom'
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState(null);

  // Animation values
  const pickerAnim = useRef(new Animated.Value(0)).current;
  const reactionAnims = useRef(REACTIONS.map(() => new Animated.Value(0))).current;
  const burstAnims = useRef(
    [...Array(6)].map(() => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
      x: new Animated.Value(0),
      y: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (showPicker) {
      // Animate picker open
      Animated.spring(pickerAnim, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }).start();

      // Stagger reaction buttons
      reactionAnims.forEach((anim, index) => {
        Animated.sequence([
          Animated.delay(index * 30),
          Animated.spring(anim, {
            toValue: 1,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      pickerAnim.setValue(0);
      reactionAnims.forEach((anim) => anim.setValue(0));
    }
  }, [showPicker]);

  const triggerBurstAnimation = (_reaction) => {
    burstAnims.forEach((anim, i) => {
      const angle = i * 60 * (Math.PI / 180);

      Animated.parallel([
        Animated.timing(anim.scale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(anim.x, {
          toValue: Math.cos(angle) * 40,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(anim.y, {
          toValue: Math.sin(angle) * 40,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.delay(200),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        anim.scale.setValue(0);
        anim.x.setValue(0);
        anim.y.setValue(0);
      });
    });
  };

  const handleReact = (reaction) => {
    setSelectedReaction(reaction);
    triggerBurstAnimation(reaction);
    setShowPicker(false);
    onReact?.(messageId, reaction.id);
  };

  const handleLongPress = () => {
    if (!disabled) {
      setShowPicker(true);
    }
  };

  const getReactionCounts = () => {
    const counts = {};
    reactions.forEach((r) => {
      counts[r.reactionId] = (counts[r.reactionId] || 0) + 1;
    });
    return counts;
  };

  const renderExistingReactions = () => {
    const counts = getReactionCounts();
    const reactionEntries = Object.entries(counts);

    if (reactionEntries.length === 0) return null;

    return (
      <View style={[styles.existingReactions, position === 'top' && styles.reactionsTop]}>
        {reactionEntries.map(([reactionId, count]) => {
          const reaction = REACTIONS.find((r) => r.id === reactionId);
          if (!reaction) return null;

          return (
            <TouchableOpacity
              key={reactionId}
              style={[styles.reactionBubble, { backgroundColor: `${reaction.color}20` }]}
              onPress={() => onRemoveReaction?.(messageId, reactionId)}
            >
              <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
              {count > 1 && <Text style={styles.reactionCount}>{count}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderPicker = () => {
    const pickerScale = pickerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1],
    });

    const pickerOpacity = pickerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <Modal
        visible={showPicker}
        transparent
        animationType="none"
        onRequestClose={() => setShowPicker(false)}
      >
        <Pressable style={styles.pickerOverlay} onPress={() => setShowPicker(false)}>
          <Animated.View
            style={[
              styles.pickerContainer,
              {
                transform: [{ scale: pickerScale }],
                opacity: pickerOpacity,
              },
            ]}
          >
            <View style={styles.pickerContent}>
              {REACTIONS.map((reaction, index) => {
                const scale = reactionAnims[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                });

                return (
                  <TouchableOpacity
                    key={reaction.id}
                    onPress={() => handleReact(reaction)}
                    style={styles.reactionButton}
                  >
                    <Animated.View style={[styles.reactionButtonInner, { transform: [{ scale }] }]}>
                      <Text style={styles.reactionButtonEmoji}>{reaction.emoji}</Text>
                    </Animated.View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    );
  };

  const renderBurst = () => (
    <>
      {burstAnims.map((anim, i) => (
        <Animated.Text
          key={i}
          style={[
            styles.burstParticle,
            {
              opacity: anim.opacity,
              transform: [{ translateX: anim.x }, { translateY: anim.y }, { scale: anim.scale }],
            },
          ]}
        >
          {selectedReaction?.emoji || '✨'}
        </Animated.Text>
      ))}
    </>
  );

  return (
    <View style={styles.container}>
      {renderExistingReactions()}

      <TouchableOpacity
        onLongPress={handleLongPress}
        delayLongPress={300}
        disabled={disabled}
        style={styles.addReactionButton}
      >
        <Ionicons name="happy-outline" size={16} color={Colors.text.tertiary} />
      </TouchableOpacity>

      {renderPicker()}
      {renderBurst()}
    </View>
  );
};

// Quick reaction button for inline use
export const QuickReactionButton = ({
  onPress,
  reaction = REACTIONS.length > 0 ? REACTIONS[0] : null,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.5,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    onPress?.(reaction);
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Text style={styles.quickReactionEmoji}>{reaction.emoji}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  existingReactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  reactionsTop: {
    marginTop: 4,
    marginBottom: 0,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 2,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  addReactionButton: {
    padding: 4,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: Colors.background.white,
    borderRadius: 24,
    padding: 8,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pickerContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 280,
    gap: 4,
  },
  reactionButton: {
    padding: 8,
  },
  reactionButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background.lightest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionButtonEmoji: {
    fontSize: 24,
  },
  burstParticle: {
    position: 'absolute',
    fontSize: 16,
  },
  quickReactionEmoji: {
    fontSize: 20,
  },
});

export { REACTIONS };
export default MessageReactions;
