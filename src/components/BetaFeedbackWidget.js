import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const FEEDBACK_TYPES = [
  { id: 'bug', label: '🐛 Bug Report', color: '#FF6B6B' },
  { id: 'feature', label: '💡 Feature Request', color: '#4ECDC4' },
  { id: 'improvement', label: '✨ Improvement', color: '#FFE66D' },
  { id: 'general', label: '💬 General Feedback', color: '#95E1D3' },
];

const RATINGS = [
  { value: 1, emoji: '😠', label: 'Very Poor' },
  { value: 2, emoji: '😕', label: 'Poor' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😍', label: 'Excellent' },
];

export const BetaFeedbackWidget = ({
  userId,
  onSubmit,
  currentScreen,
  appVersion,
  isVisible,
  onClose,
}) => {
  const [feedbackType, setFeedbackType] = useState('general');
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    // slideAnim is stable (created with useRef), but included to satisfy exhaustive-deps
  }, [isVisible, slideAnim]);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      setScreenshot(result.assets[0].uri);
    }
  };

  const handleTakeScreenshot = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow camera access');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      setScreenshot(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title for your feedback');
      return;
    }

    setIsSubmitting(true);

    try {
      const feedbackData = {
        userId,
        type: feedbackType,
        rating,
        title: title.trim(),
        description: description.trim(),
        screenshot,
        screenName: currentScreen,
        appVersion,
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version,
        },
        timestamp: new Date().toISOString(),
      };

      await onSubmit?.(feedbackData);

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        resetForm();
        onClose?.();
      }, 2000);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFeedbackType('general');
    setRating(0);
    setTitle('');
    setDescription('');
    setScreenshot(null);
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="none"
      transparent
      accessibilityLabel="Beta feedback dialog"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <Animated.View
          style={[
            styles.feedbackPanel,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [600, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {showSuccess ? (
            <View style={styles.successContainer}>
              <Text style={styles.successEmoji}>🎉</Text>
              <Text style={styles.successText}>Thank you for your feedback!</Text>
              <Text style={styles.successSubtext}>Your input helps us improve the app</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Beta Feedback</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Feedback Type */}
              <Text style={styles.sectionTitle}>What type of feedback?</Text>
              <View style={styles.typeContainer}>
                {FEEDBACK_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeButton,
                      feedbackType === type.id && {
                        borderColor: type.color,
                        backgroundColor: `${type.color}20`,
                      },
                    ]}
                    onPress={() => setFeedbackType(type.id)}
                  >
                    <Text style={styles.typeLabel}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Rating */}
              <Text style={styles.sectionTitle}>How would you rate this?</Text>
              <View style={styles.ratingContainer}>
                {RATINGS.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    style={[styles.ratingButton, rating === r.value && styles.ratingButtonActive]}
                    onPress={() => setRating(r.value)}
                  >
                    <Text style={styles.ratingEmoji}>{r.emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Title */}
              <Text style={styles.sectionTitle}>Title *</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="Brief summary of your feedback"
                placeholderTextColor="#999"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />

              {/* Description */}
              <Text style={styles.sectionTitle}>Description</Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Tell us more details..."
                placeholderTextColor="#999"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={1000}
              />

              {/* Screenshot */}
              <Text style={styles.sectionTitle}>Attach Screenshot</Text>
              <View style={styles.screenshotContainer}>
                {screenshot ? (
                  <View style={styles.screenshotPreview}>
                    <Image source={{ uri: screenshot }} style={styles.screenshotImage} />
                    <TouchableOpacity
                      style={styles.removeScreenshot}
                      onPress={() => setScreenshot(null)}
                    >
                      <Text style={styles.removeText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.screenshotButtons}>
                    <TouchableOpacity style={styles.screenshotButton} onPress={handlePickImage}>
                      <Text style={styles.screenshotButtonText}>📷 Gallery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.screenshotButton}
                      onPress={handleTakeScreenshot}
                    >
                      <Text style={styles.screenshotButtonText}>📱 Camera</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </Text>
              </TouchableOpacity>

              {/* Current Screen Info */}
              <Text style={styles.debugInfo}>
                Screen: {currentScreen} | Version: {appVersion}
              </Text>
            </ScrollView>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Floating Feedback Button
export const BetaFeedbackButton = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.floatingButton} onPress={onPress}>
      <Text style={styles.floatingButtonText}>💬</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  feedbackPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#999',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
  },
  typeLabel: {
    fontSize: 14,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  ratingButton: {
    padding: 12,
    borderRadius: 30,
    backgroundColor: '#f5f5f5',
  },
  ratingButtonActive: {
    backgroundColor: '#FFE66D',
    transform: [{ scale: 1.2 }],
  },
  ratingEmoji: {
    fontSize: 28,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    height: 100,
    textAlignVertical: 'top',
  },
  screenshotContainer: {
    marginTop: 8,
  },
  screenshotButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  screenshotButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  screenshotButtonText: {
    fontSize: 14,
    color: '#666',
  },
  screenshotPreview: {
    position: 'relative',
  },
  screenshotImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeScreenshot: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: '#fff',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  debugInfo: {
    textAlign: 'center',
    fontSize: 11,
    color: '#999',
    marginTop: 12,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  successEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  successText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 16,
    color: '#666',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonText: {
    fontSize: 24,
  },
});

export default BetaFeedbackWidget;
