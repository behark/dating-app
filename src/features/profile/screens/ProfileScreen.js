import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useEffect, useState } from 'react';
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
} from 'react-native';
import BadgeShowcase from '../../../components/Gamification/BadgeShowcase';
import { storage } from '../../../config/firebase';
import { Colors } from '../../../constants/colors';
import { useAuth } from '../../../context/AuthContext';
import { ProfileService } from '../../../services/ProfileService';
import HapticFeedback from '../../../utils/haptics';
import logger from '../../../utils/logger';
import { shadowToWebBoxShadow, textShadowToWeb } from '../../../utils/stylePlatform';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { currentUser, logout } = useAuth();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [loading, setLoading] = useState(false);
  const [userBadges, setUserBadges] = useState([]);

  useEffect(() => {
    loadProfile();
    loadUserBadges();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userData = await ProfileService.getMyProfile();
      if (userData) {
        setName(userData.name || '');
        setAge(userData.age?.toString() || '');
        setBio(userData.bio || '');
        setPhotoURL(userData.photoURL || userData.photos?.[0]?.url || '');
      } else {
        logger.warn('Profile data is empty');
      }
    } catch (error) {
      logger.error('Error loading profile:', error);
      Alert.alert(
        'Error Loading Profile',
        error.message || 'Failed to load your profile. Please try again.',
        [
          {
            text: 'Retry',
            onPress: loadProfile,
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const loadUserBadges = async () => {
    try {
      const { GamificationService } = require('../../../services/GamificationService');
      const badges = await GamificationService.getUserBadges(currentUser.uid);
      setUserBadges(badges || []);
    } catch (error) {
      logger.error('Error loading user badges:', error);
      // Silently fail for badges - not critical, but log it
      // User can still use the profile screen without badges
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera roll permissions!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const compressImage = async (uri) => {
    // Basic image compression - in production, consider using react-native-image-picker's compression
    // or a library like react-native-image-resizer
    return new Promise((resolve) => {
      // For now, return the original URI - in production you'd compress here
      resolve(uri);
    });
  };

  const uploadImage = async (uri) => {
    try {
      HapticFeedback.mediumImpact();
      setLoading(true);

      // Compress image before upload
      const compressedUri = await compressImage(uri);

      if (storage) {
        try {
          const response = await fetch(compressedUri);
          const blob = await response.blob();

          // Check file size (limit to 2MB after compression)
          if (blob.size > 2 * 1024 * 1024) {
            Alert.alert('Error', 'Image is too large. Please choose a smaller image.');
            setLoading(false);
            return;
          }

          const imageRef = ref(storage, `profiles/${currentUser.uid}/${Date.now()}.jpg`);

          await uploadBytes(imageRef, blob, {
            contentType: 'image/jpeg',
            customMetadata: {
              uploadedBy: currentUser.uid,
              uploadedAt: new Date().toISOString(),
            },
          });

          const downloadURL = await getDownloadURL(imageRef);
          setPhotoURL(downloadURL);
          HapticFeedback.successNotification();
          setLoading(false);
          return;
        } catch (storageError) {
          logger.warn('Firebase Storage not available:', storageError);
          setPhotoURL(compressedUri);
          Alert.alert(
            'Storage Not Available',
            'Firebase Storage is not enabled. You can use an image URL instead.',
            [{ text: 'OK' }]
          );
          setLoading(false);
        }
      }

      setPhotoURL(compressedUri);
      Alert.alert(
        'Storage Not Available',
        'Firebase Storage is not enabled. You can use an image URL instead.',
        [{ text: 'OK' }]
      );
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

  const saveProfile = async () => {
    if (!validateProfileData()) {
      HapticFeedback.errorNotification();
      return;
    }

    try {
      HapticFeedback.mediumImpact();
      setLoading(true);
      await ProfileService.updateProfile({
        name: name.trim(),
        age: parseInt(age),
        bio: bio ? bio.trim() : '',
        photoURL,
      });

      HapticFeedback.successNotification();
      Alert.alert('Success', 'Profile updated successfully!');
      setLoading(false);
    } catch (error) {
      logger.error('Error saving profile:', error);
      HapticFeedback.errorNotification();
      Alert.alert('Error', 'Failed to save profile');
      setLoading(false);
    }
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
              Platform.OS === 'web' ? textShadowToWeb(styles.headerTitle) : null,
            ]}
          >
            Edit Profile
          </Text>
          <Text style={styles.headerSubtitle}>Make your profile stand out</Text>
        </View>

        <View
          style={[styles.card, Platform.OS === 'web' ? shadowToWebBoxShadow(styles.card) : null]}
        >
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
            <View
              style={[
                styles.editBadge,
                Platform.OS === 'web' ? shadowToWebBoxShadow(styles.editBadge) : null,
              ]}
            >
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
            style={[
              styles.saveButton,
              Platform.OS === 'web' ? shadowToWebBoxShadow(styles.saveButton) : null,
            ]}
            onPress={saveProfile}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient colors={Colors.gradient.primary} style={styles.saveButtonGradient}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={Colors.background.white}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save Profile'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Gamification Section - Badge Showcase */}
          <BadgeShowcase badges={userBadges} userId={currentUser.uid} />

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
                style={{ marginRight: 8 }}
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
              <Ionicons name="notifications" size={20} color="#FFA500" style={{ marginRight: 8 }} />
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
                style={{ marginRight: 8 }}
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
                style={{ marginRight: 8 }}
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
              <Ionicons name="share-social" size={20} color="#1DB954" style={{ marginRight: 8 }} />
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
                style={{ marginRight: 8 }}
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
                style={{ marginRight: 8 }}
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
                style={{ marginRight: 8 }}
              />
              <Text style={styles.secondaryButtonText}>🛡️ Safety Center</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.premiumButton,
                Platform.OS === 'web' ? shadowToWebBoxShadow(styles.premiumButton) : null,
              ]}
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
                  style={{ marginRight: 8 }}
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
              style={{ marginRight: 8 }}
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
    paddingBottom: 30,
  },
  header: {
    padding: 25,
    paddingTop: 50,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.background.white,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.text.white90,
  },
  card: {
    backgroundColor: Colors.background.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    marginTop: 20,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  placeholderImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.background.white,
  },
  placeholderText: {
    color: Colors.background.white,
    fontSize: 14,
    marginTop: 8,
    fontWeight: '600',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: Colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.background.white,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.lightest,
    borderRadius: 15,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: Colors.border.gray,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: Colors.text.dark,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  helpText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: -10,
    marginBottom: 20,
    paddingHorizontal: 5,
    fontStyle: 'italic',
  },
  saveButton: {
    borderRadius: 15,
    marginTop: 10,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: Colors.background.white,
    fontSize: 18,
    fontWeight: '700',
  },
  buttonGroup: {
    marginTop: 20,
    marginBottom: 15,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.white,
    borderWidth: 2,
    borderColor: Colors.border.gray,
    borderRadius: 15,
    paddingVertical: 15,
    marginBottom: 10,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  premiumButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 10,
    shadowColor: Colors.accent.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  premiumButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumButtonText: {
    color: Colors.background.white,
    fontSize: 16,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.white,
    borderWidth: 2,
    borderColor: Colors.accent.red,
    borderRadius: 15,
    paddingVertical: 15,
  },
  logoutButtonText: {
    color: Colors.accent.red,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
