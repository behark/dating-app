import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { ProfileService } from '../services/ProfileService';
import logger from '../utils/logger';

export const EditProfileScreen = ({ navigation, route }) => {
  const { currentUser, authToken } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(false);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState([]);
  const [interestInput, setInterestInput] = useState('');
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userProfile = await ProfileService.getMyProfile();
      setProfile(userProfile);

      setName(userProfile.name || '');
      setAge(userProfile.age?.toString() || '');
      setGender(userProfile.gender || '');
      setBio(userProfile.bio || '');
      setInterests(userProfile.interests || []);
      setPhotos(userProfile.photos || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
      logger.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.cancelled) {
        // Upload image to storage and get URL
        const imageUri = result.assets[0].uri;

        // Note: Image upload to cloud storage should be handled by ProfileService.uploadPhotos()
        // This local URI is used for preview; actual upload happens when user saves profile
        const newPhoto = {
          url: imageUri,
          order: photos.length,
        };

        const updatedPhotos = [...photos, newPhoto];

        if (updatedPhotos.length > 6) {
          Alert.alert('Limit', 'Maximum 6 photos allowed');
          return;
        }

        try {
          setUploadingPhoto(true);
          const uploadedPhotos = await ProfileService.uploadPhotos([newPhoto]);
          setPhotos(uploadedPhotos);
          Alert.alert('Success', 'Photo uploaded successfully');
        } catch (error) {
          Alert.alert('Error', error.message || 'Failed to upload photo');
        } finally {
          setUploadingPhoto(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      logger.error('Error picking image:', error);
    }
  };

  const removePhoto = async (photoId) => {
    try {
      setDeletingPhoto(photoId);
      const updatedPhotos = await ProfileService.deletePhoto(photoId);
      setPhotos(updatedPhotos);
      Alert.alert('Success', 'Photo deleted');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to delete photo');
    } finally {
      setDeletingPhoto(false);
    }
  };

  const addInterest = () => {
    if (interestInput.trim() && interests.length < 20) {
      setInterests([...interests, interestInput.trim()]);
      setInterestInput('');
    }
  };

  const removeInterest = (index) => {
    setInterests(interests.filter((_, i) => i !== index));
  };

  const saveProfile = async () => {
    try {
      if (!name.trim()) {
        Alert.alert('Error', 'Name is required');
        return;
      }

      ProfileService.validateAge(parseInt(age));
      ProfileService.validateBio(bio);

      setSaving(true);

      const updatedProfile = await ProfileService.updateProfile({
        name: name.trim(),
        age: parseInt(age),
        gender,
        bio: bio.trim(),
        interests,
      });

      setProfile(updatedProfile);
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.accent.red} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Photos Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photos</Text>
        <Text style={styles.helperText}>{photos.length}/6 photos uploaded</Text>

        <View style={styles.photosGrid}>
          {photos.map((photo, index) => (
            <View key={photo._id || index} style={styles.photoContainer}>
              <Image source={{ uri: photo.url }} style={styles.photo} />
              <TouchableOpacity
                style={[styles.photoDeleteBtn, deletingPhoto === photo._id && styles.photoDeleteBtnDisabled]}
                onPress={() => removePhoto(photo._id)}
                disabled={deletingPhoto === photo._id}
              >
                {deletingPhoto === photo._id ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.photoDeletBtnText}>×</Text>
                )}
              </TouchableOpacity>
              {photo.moderationStatus === 'pending' && (
                <View style={styles.moderationBadge}>
                  <Text style={styles.moderationText}>Pending</Text>
                </View>
              )}
            </View>
          ))}

          {photos.length < 6 && (
            <TouchableOpacity
              style={[styles.photoAddBtn, uploadingPhoto && styles.photoAddBtnDisabled]}
              onPress={pickImage}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color={Colors.accent.red} />
              ) : (
                <Text style={styles.photoAddBtnText}>+ Add Photo</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Age *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your age"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender *</Text>
          <View style={styles.genderOptions}>
            {['male', 'female', 'other'].map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                onPress={() => setGender(g)}
              >
                <Text style={[styles.genderBtnText, gender === g && styles.genderBtnTextActive]}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Bio */}
      <View style={styles.section}>
        <View style={styles.bioHeaderRow}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <TouchableOpacity
            style={styles.bioSuggestButton}
            onPress={() =>
              navigation.navigate('Premium', {
                feature: 'bioSuggestions',
                currentBio: bio,
                interests: interests,
              })
            }
          >
            <Text style={styles.bioSuggestButtonText}>✨ Suggestions</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tell us about yourself</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            placeholder="Enter your bio (max 500 characters)"
            value={bio}
            onChangeText={setBio}
            maxLength={500}
            multiline
            numberOfLines={5}
          />
          <Text style={styles.charCount}>{bio.length}/500 characters</Text>
        </View>
      </View>

      {/* Interests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Interests</Text>
        <View style={styles.inputGroup}>
          <View style={styles.interestInputRow}>
            <TextInput
              style={styles.interestInput}
              placeholder="Add an interest"
              value={interestInput}
              onChangeText={setInterestInput}
            />
            <TouchableOpacity style={styles.addInterestBtn} onPress={addInterest}>
              <Text style={styles.addInterestBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.interestsList}>
            {interests.map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest}</Text>
                <TouchableOpacity onPress={() => removeInterest(index)}>
                  <Text style={styles.interestRemove}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={saveProfile}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.saveBtnText}>Save Changes</Text>
        )}
      </TouchableOpacity>

      <View style={styles.spacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.white,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.light,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: Colors.text.dark,
  },
  helperText: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginBottom: 12,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoContainer: {
    width: '31%',
    aspectRatio: 3 / 4,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: Colors.background.light,
  },
  photoDeleteBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accent.red,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoDeleteBtnDisabled: {
    opacity: 0.6,
  },
  photoDeletBtnText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  photoAddBtn: {
    width: '31%',
    aspectRatio: 3 / 4,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  photoAddBtnDisabled: {
    opacity: 0.6,
  },
  photoAddBtnText: {
    color: Colors.text.tertiary,
    fontSize: 14,
    textAlign: 'center',
  },
  moderationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#FFC107',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  moderationText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.background.white,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.text.dark,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text.dark,
  },
  bioInput: {
    textAlignVertical: 'top',
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 4,
    textAlign: 'right',
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    alignItems: 'center',
  },
  genderBtnActive: {
    backgroundColor: Colors.accent.red,
    borderColor: Colors.accent.red,
  },
  genderBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.dark,
  },
  genderBtnTextActive: {
    color: 'white',
  },
  interestInputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  interestInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  addInterestBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.accent.red,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addInterestBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  interestsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.light,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  interestText: {
    fontSize: 13,
    color: Colors.text.dark,
  },
  interestRemove: {
    fontSize: 18,
    color: Colors.text.tertiary,
    fontWeight: 'bold',
  },
  saveBtn: {
    margin: 20,
    paddingVertical: 14,
    backgroundColor: Colors.accent.red,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  spacer: {
    height: 20,
  },
  bioHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bioSuggestButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.background.light,
    borderRadius: 6,
  },
  bioSuggestButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
});
