import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  ActivityIndicator,
} from 'react-native';
import BadgeShowcase from '../../../components/Gamification/BadgeShowcase';
import { Colors } from '../../../constants/colors';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import { API_URL } from '../../../config/api';
import HapticFeedback from '../../../utils/haptics';
import logger from '../../../utils/logger';
import { shadowToWebBoxShadow, textShadowToWeb } from '../../../utils/stylePlatform';
import { useProfile } from '../hooks/useProfile';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { currentUser, logout } = useAuth();

  // ── Local controlled-input state ─────────────────────────────────────────
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  // Track whether the form has been seeded from server data
  const [seeded, setSeeded] = useState(false);

  // ── TanStack Query: profile data + save mutation ───────────────────────────
  const {
    profileData,
    profileLoading,
    profileError,
    refetchProfile,
    userBadges,
    saveProfile,
    isSaving,
  } = useProfile({ userId: currentUser?.uid });

  // Seed the form inputs once the server data arrives (only on first load)
  if (profileData && !seeded) {
    setName(profileData.name || '');
    setAge(profileData.age?.toString() || '');
    setBio(profileData.bio || '');
    setPhotoURL(profileData.photoURL || profileData.photos?.[0]?.url || '');
    setSeeded(true);
  }

  // Combined loading flag for upload spinner (profileLoading OR isSaving)
  const loading = profileLoading || isSaving;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera roll permissions!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    try {
      HapticFeedback.mediumImpact();
      setLoading(true);

      const formData = new FormData();
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('photos', blob, `photo_${Date.now()}.jpg`);
      } else {
        formData.append('photos', {
          uri,
          name: `photo_${Date.now()}.jpg`,
          type: 'image/jpeg',
        });
      }

      const token = await api.getAuthToken();
      const uploadResponse = await fetch(`${API_URL}/upload/photo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      const result = await uploadResponse.json();
      const uploadResults = result?.data?.uploadResults || result?.uploadResults || [];
      const firstSuccess = uploadResults.find((r) => r.success) || uploadResults[0] || {};
      const downloadURL = firstSuccess.url || result?.data?.url || result?.url || uri;

      setPhotoURL(downloadURL);
      HapticFeedback.successNotification();
      setLoading(false);
    } catch (error) {
      logger.error('Error uploading image:', error);
      HapticFeedback.errorNotification();
      Alert.alert('Error', 'Failed to upload image. Please try again or use an image URL.');
      setLoading(false);
    }
  };

  const validateProfileData = () => {
    if (!name || name.trim().length < 2) {
      Alert.alert('Error', 'Please enter a valid name (at least 2 characters)');
      return false;
    }

    const ageNum = parseInt(age);
    if (!age || isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
      Alert.alert('Error', 'Please enter a valid age between 18 and 100');
      return false;
    }

    if (bio && bio.length > 500) {
      Alert.alert('Error', 'Bio must be less than 500 characters');
      return false;
    }

    return true;
  };

  const handleSaveProfile = () => {
    if (!validateProfileData()) {
      HapticFeedback.errorNotification();
      return;
    }
    saveProfile({
      name: name.trim(),
      age: parseInt(age),
      bio: bio ? bio.trim() : '',
      photoURL,
    });
  };

  return (
    <LinearGradient colors={Colors.gradient.primary} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text
            style={[
              styles.headerTitle,
              Platform.OS === 'web'
                ? textShadowToWeb({
                    textShadowColor: 'rgba(0, 0, 0, 0.3)',
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 4,
                  })
                : {
                    textShadowColor: 'rgba(0, 0, 0, 0.3)',
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 4,
                  },
            ]}
          >
            Edit Profile
          </Text>
          <Text style={styles.headerSubtitle}>Make your profile stand out</Text>
        </View>

        <View style={[styles.card, styles.cardShadow]}>
          <TouchableOpacity
            onPress={() => {
              HapticFeedback.lightImpact();
              navigation.navigate('PhotoGallery');
            }}
            style={styles.imageContainer}
          >
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={styles.image} />
            ) : (
              <LinearGradient colors={['#f093fb', '#f5576c']} style={styles.placeholderImage}>
                <Ionicons name="camera" size={40} color={Colors.background.white} />
                <Text style={styles.placeholderText}>Tap to add photo</Text>
              </LinearGradient>
            )}
            <View style={[styles.editBadge, styles.editBadgeShadow]}>
              <Ionicons name="images" size={16} color={Colors.background.white} />
            </View>
          </TouchableOpacity>

          <View style={styles.inputGroup}>
            <Ionicons
              name="person-outline"
              size={20}
              color={Colors.primary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Your Name"
              placeholderTextColor={Colors.text.tertiary}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={Colors.primary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Age"
              placeholderTextColor={Colors.text.tertiary}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Ionicons
              name="document-text-outline"
              size={20}
              color={Colors.primary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="Tell us about yourself..."
              placeholderTextColor={Colors.text.tertiary}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Ionicons
              name="image-outline"
              size={20}
              color={Colors.primary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Or paste image URL here"
              placeholderTextColor={Colors.text.tertiary}
              value={photoURL}
              onChangeText={setPhotoURL}
              autoCapitalize="none"
            />
          </View>
          <Text style={styles.helpText}>💡 Tip: Upload to Imgur or ImgBB and paste the URL</Text>

          <TouchableOpacity
            style={[styles.saveButton, styles.saveButtonShadow]}
            onPress={handleSaveProfile}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            <LinearGradient colors={Colors.gradient.primary} style={styles.saveButtonGradient}>
              {isSaving ? (
                <ActivityIndicator size="small" color={Colors.background.white} style={styles.iconSpacing} />
              ) : (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={Colors.background.white}
                  style={styles.iconSpacing}
                />
              )}
              <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Profile'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Gamification Section - Badge Showcase */}
          <BadgeShowcase badges={userBadges} userId={currentUser?.uid} />

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                HapticFeedback.lightImpact();
                navigation.navigate('Preferences');
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="settings"
                size={20}
                color={Colors.primary}
                style={styles.iconSpacing}
              />
              <Text style={styles.secondaryButtonText}>Preferences</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                HapticFeedback.lightImpact();
                navigation.navigate('NotificationPreferences');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="notifications" size={20} color="#FFA500" style={styles.iconSpacing} />
              <Text style={styles.secondaryButtonText}>Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                HapticFeedback.lightImpact();
                navigation.navigate('Verification');
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="shield-checkmark"
                size={20}
                color={Colors.accent.teal}
                style={styles.iconSpacing}
              />
              <Text style={styles.secondaryButtonText}>Verification</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                HapticFeedback.lightImpact();
                navigation.navigate('PhotoGallery');
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="images"
                size={20}
                color={Colors.accent.red}
                style={styles.iconSpacing}
              />
              <Text style={styles.secondaryButtonText}>Photo Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                HapticFeedback.lightImpact();
                navigation.navigate('SocialMediaConnection');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social" size={20} color="#1DB954" style={styles.iconSpacing} />
              <Text style={styles.secondaryButtonText}>Social Media</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                HapticFeedback.lightImpact();
                navigation.navigate('ProfileViews');
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="eye"
                size={20}
                color={Colors.accent.teal}
                style={styles.iconSpacing}
              />
              <Text style={styles.secondaryButtonText}>Who Viewed Me</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                HapticFeedback.lightImpact();
                navigation.navigate('SafetyTips');
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={Colors.status.warning}
                style={styles.iconSpacing}
              />
              <Text style={styles.secondaryButtonText}>Safety Tips</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                HapticFeedback.lightImpact();
                navigation.navigate('SafetyAdvanced', { userId: currentUser.uid, isPremium: true });
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="shield"
                size={20}
                color={Colors.accent.pink}
                style={styles.iconSpacing}
              />
              <Text style={styles.secondaryButtonText}>🛡️ Safety Center</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.premiumButton, styles.premiumButtonShadow]}
              onPress={() => {
                HapticFeedback.mediumImpact();
                navigation.navigate('Premium');
              }}
              activeOpacity={0.8}
            >
              <LinearGradient colors={Colors.gradient.gold} style={styles.premiumButtonGradient}>
                <Ionicons
                  name="diamond"
                  size={20}
                  color={Colors.background.white}
                  style={styles.iconSpacing}
                />
                <Text style={styles.premiumButtonText}>Go Premium</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              HapticFeedback.warningNotification();
              logout();
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color={Colors.accent.red}
              style={styles.iconSpacing}
            />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    padding: 24,
    paddingTop: 56,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.background.white,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '400',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    marginTop: 16,
  },
  cardShadow: Platform.select({
    web: shadowToWebBoxShadow({
      shadowColor: '#1A1A2E',
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
    }),
    default: {
      shadowColor: '#1A1A2E',
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 12,
    },
  }),
  imageContainer: {
    alignItems: 'center',
    marginBottom: 28,
    position: 'relative',
  },
  image: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  placeholderImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  placeholderText: {
    color: Colors.background.white,
    fontSize: 13,
    marginTop: 8,
    fontWeight: '500',
  },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: '33%',
    backgroundColor: Colors.primary,
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  editBadgeShadow: Platform.select({
    web: shadowToWebBoxShadow({
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    }),
    default: {
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
  }),
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6FF',
    borderRadius: 14,
    marginBottom: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#E8EAF6',
  },
  inputIcon: {
    marginRight: 12,
  },
  iconSpacing: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 15,
    color: Colors.text.dark,
    letterSpacing: 0.1,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  helpText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: -8,
    marginBottom: 20,
    paddingHorizontal: 5,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  saveButton: {
    borderRadius: 14,
    marginTop: 10,
    marginBottom: 16,
    overflow: 'hidden',
  },
  saveButtonShadow: Platform.select({
    web: shadowToWebBoxShadow({
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
    }),
    default: {
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 10,
    },
  }),
  saveButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: Colors.background.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  buttonGroup: {
    marginTop: 24,
    marginBottom: 16,
    gap: 10,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8EAF6',
    borderRadius: 14,
    paddingVertical: 15,
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  premiumButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
  },
  premiumButtonShadow: Platform.select({
    web: shadowToWebBoxShadow({
      shadowColor: Colors.accent.gold,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
    }),
    default: {
      shadowColor: Colors.accent.gold,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 10,
    },
  }),
  premiumButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumButtonText: {
    color: Colors.background.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,107,107,0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,107,107,0.2)',
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 8,
  },
  logoutButtonText: {
    color: Colors.accent.red,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ProfileScreen;
