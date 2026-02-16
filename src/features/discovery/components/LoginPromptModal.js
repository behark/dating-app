import React, { memo } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const getLoginPromptMessage = (reason, viewCount) => {
  switch (reason) {
    case 'swipe':
      return {
        title: '💕 Ready to Match?',
        subtitle: 'Create a free account to start swiping and find your match!',
      };
    case 'like':
      return {
        title: '❤️ Like This Person?',
        subtitle: "Sign up to let them know you're interested!",
      };
    case 'superlike':
      return {
        title: '⭐ Super Like?',
        subtitle: 'Create an account to send Super Likes and stand out!',
      };
    case 'view':
      return {
        title: '👀 Want to See More?',
        subtitle: 'Sign up to view full profiles and photos!',
      };
    case 'limit':
      return {
        title: "🔥 You're on Fire!",
        subtitle: `You've viewed ${viewCount} profiles! Sign up free to see unlimited matches.`,
      };
    case 'banner':
      return {
        title: '💕 Ready to Match?',
        subtitle: 'Join thousands of singles and start your dating journey today!',
      };
    default:
      return {
        title: 'Join Our Community!',
        subtitle: 'Create a free account to unlock all features and start matching!',
      };
  }
};

const LoginPromptModal = memo(
  ({ visible, reason, viewCount, onClose, onLogin, onRegister, theme }) => {
    const message = getLoginPromptMessage(reason, viewCount);

    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={[styles.container, { backgroundColor: theme?.cardBackground || '#fff' }]}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={theme?.text || '#333'} />
            </TouchableOpacity>

            <Text style={[styles.title, { color: theme?.text || '#333' }]}>{message.title}</Text>
            <Text style={[styles.subtitle, { color: theme?.textSecondary || '#666' }]}>
              {message.subtitle}
            </Text>

            <TouchableOpacity onPress={onRegister}>
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Create Free Account</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme?.border || '#ddd' }]}
              onPress={onLogin}
            >
              <Text style={[styles.secondaryButtonText, { color: theme?.text || '#333' }]}>
                I Already Have an Account
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: SCREEN_WIDTH - 40,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  primaryButton: {
    width: SCREEN_WIDTH - 88,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    width: SCREEN_WIDTH - 88,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

LoginPromptModal.displayName = 'LoginPromptModal';

export default LoginPromptModal;
