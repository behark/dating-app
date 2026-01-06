import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ImageService } from '../services/ImageService';
import { showStandardError, STANDARD_ERROR_MESSAGES } from '../utils/errorHandler';
import logger from '../utils/logger';

const PhotoGalleryScreen = ({ navigation, route }) => {
  const { currentUser } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      // Use backend API to get profile photos
      const response = await api.get('/profile/me');
      if (response.success && response.data) {
        setPhotos(response.data.photos || []);
      }
    } catch (error) {
      logger.error('Error loading photos:', error);
      showStandardError(error, 'load', 'Unable to Load Photos');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    if (photos.length >= 6) {
      Alert.alert('Limit Reached', 'You can upload up to 6 photos');
      return;
    }

    try {
      setUploading(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;

        // Moderate image
        const moderation = await ImageService.moderateImage(uri);
        if (!moderation.approved) {
          Alert.alert(
            'Image Rejected',
            moderation.reason || 'This image does not meet our guidelines'
          );
          return;
        }

        // Upload image
        const uploadResult = await ImageService.uploadProfileImage(
          currentUser.uid,
          uri,
          photos.length === 0 // Make first photo primary
        );

        if (uploadResult.success) {
          Alert.alert('Success', 'Photo uploaded successfully!');
          loadPhotos(); // Refresh photos
        } else {
          showStandardError(
            uploadResult.error || STANDARD_ERROR_MESSAGES.UPLOAD_FAILED,
            'upload',
            'Upload Failed'
          );
        }
      }
    } catch (error) {
      logger.error('Error picking/uploading image:', error);
      showStandardError(error, 'upload', 'Upload Failed');
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = (photo) => {
    Alert.alert('Delete Photo', 'Are you sure you want to delete this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const result = await ImageService.deleteProfileImage(currentUser.uid, photo.id, photo);

            if (result.success) {
              Alert.alert('Success', 'Photo deleted successfully');
              loadPhotos();
            } else {
              showStandardError(
                result.error || STANDARD_ERROR_MESSAGES.DELETE_FAILED,
                'delete',
                'Delete Failed'
              );
            }
          } catch (error) {
            logger.error('Error deleting photo:', error);
            showStandardError(error, 'delete', 'Delete Failed');
          }
        },
      },
    ]);
  };

  const setAsPrimary = async (photo) => {
    try {
      const result = await ImageService.setPrimaryPhoto(currentUser.uid, photo.id);

      if (result.success) {
        Alert.alert('Success', 'Primary photo updated!');
        loadPhotos();
      } else {
        showStandardError(
          result.error || STANDARD_ERROR_MESSAGES.SAVE_FAILED,
          'update',
          'Update Failed'
        );
      }
    } catch (error) {
      logger.error('Error setting primary photo:', error);
      showStandardError(error, 'update', 'Update Failed');
    }
  };

  const renderPhotoItem = (photo, index) => (
    <View key={photo.id} style={styles.photoItem}>
      <Image source={{ uri: photo.thumbnailUrl || photo.fullUrl }} style={styles.photoImage} />

      {photo.isPrimary && (
        <View style={styles.primaryBadge}>
          <Ionicons name="star" size={12} color={Colors.accent.gold} />
          <Text style={styles.primaryText}>PRIMARY</Text>
        </View>
      )}

      <View style={styles.photoOverlay}>
        <View style={styles.photoActions}>
          {!photo.isPrimary && (
            <TouchableOpacity style={styles.actionButton} onPress={() => setAsPrimary(photo)}>
              <Ionicons name="star-outline" size={20} color={Colors.background.white} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => deletePhoto(photo)}
          >
            <Ionicons name="trash" size={20} color={Colors.background.white} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.photoDate}>
        {new Date(photo.uploadedAt?.toDate?.() || photo.uploadedAt).toLocaleDateString()}
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient colors={Colors.gradient.primary} style={styles.emptyCard}>
        <Ionicons name="images-outline" size={80} color={Colors.background.white} />
        <Text style={styles.emptyTitle}>No photos yet</Text>
        <Text style={styles.emptyText}>
          Add photos to make your profile stand out!{'\n'}
          Upload up to 6 photos to showcase your best self.
        </Text>
      </LinearGradient>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={Colors.gradient.primary} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="images" size={60} color={Colors.background.white} />
          <Text style={styles.loadingText}>Loading photos...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={Colors.gradient.light} style={styles.container}>
      <LinearGradient colors={Colors.gradient.primary} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.background.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Photo Gallery</Text>
        <View style={styles.headerRightSection}>
          <TouchableOpacity
            style={styles.analyzeButton}
            onPress={() =>
              navigation.navigate('Premium', {
                feature: 'smartPhotos',
                photos: photos,
              })
            }
          >
            <Ionicons
              name="sparkles"
              size={18}
              color={Colors.accent.gold}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.analyzeButtonText}>Analyze</Text>
          </TouchableOpacity>
          <Text style={styles.photoCount}>{photos.length}/6</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.uploadSection}>
            <TouchableOpacity
              style={[
                styles.uploadButton,
                (uploading || photos.length >= 6) && styles.uploadButtonDisabled,
              ]}
              onPress={pickImage}
              disabled={uploading || photos.length >= 6}
            >
              <LinearGradient
                colors={
                  uploading || photos.length >= 6
                    ? Colors.gradient.disabled
                    : Colors.gradient.primary
                }
                style={styles.uploadButtonGradient}
              >
                {uploading ? (
                  <ActivityIndicator color={Colors.background.white} />
                ) : (
                  <Ionicons name="add" size={30} color={Colors.background.white} />
                )}
                <Text style={styles.uploadButtonText}>
                  {uploading ? 'Uploading...' : 'Add Photo'}
                </Text>
                <Text style={styles.uploadButtonSubtext}>
                  {photos.length >= 6 ? 'Gallery Full' : `${6 - photos.length} spots left`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {photos.length === 0 ? (
            renderEmptyState()
          ) : (
            <View style={styles.photosGrid}>
              {photos.map((photo, index) => renderPhotoItem(photo, index))}
            </View>
          )}

          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>📸 Photo Tips</Text>
            <View style={styles.tipsList}>
              <Text style={styles.tip}>• Use clear, well-lit photos</Text>
              <Text style={styles.tip}>• Show your face clearly in at least one photo</Text>
              <Text style={styles.tip}>• Include photos that show your personality</Text>
              <Text style={styles.tip}>• Avoid group photos as your primary image</Text>
              <Text style={styles.tip}>• Keep photos appropriate and respectful</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingTop: 50,
    paddingBottom: 15,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.background.white,
  },
  photoCount: {
    fontSize: 14,
    color: Colors.background.white,
    opacity: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: Colors.background.white,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  uploadSection: {
    marginBottom: 30,
  },
  uploadButton: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonGradient: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    color: Colors.background.white,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 10,
  },
  uploadButtonSubtext: {
    color: Colors.background.white,
    opacity: 0.8,
    fontSize: 14,
    marginTop: 5,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  photoItem: {
    width: '48%',
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: Colors.background.white,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  photoImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  actionButton: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.8)',
  },
  primaryBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  primaryText: {
    color: Colors.background.white,
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 4,
  },
  photoDate: {
    padding: 10,
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  emptyCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 30,
    padding: 40,
    alignItems: 'center',
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.background.white,
    marginTop: 20,
    marginBottom: 15,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.white90,
    textAlign: 'center',
    lineHeight: 24,
  },
  tipsSection: {
    backgroundColor: Colors.background.white,
    borderRadius: 15,
    padding: 20,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  tipsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.dark,
    marginBottom: 15,
    textAlign: 'center',
  },
  tipsList: {
    gap: 8,
  },
  tip: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  headerRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  analyzeButton: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  analyzeButtonText: {
    color: Colors.background.white,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default PhotoGalleryScreen;
