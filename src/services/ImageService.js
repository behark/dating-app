import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../config/firebase';
import logger from '../utils/logger';
import api from './api';

export class ImageService {
  static async requestPermissions() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Camera roll permissions are required');
    }
  }

  static async compressImage(uri, options = {}) {
    const {
      maxWidth = 1200,
      maxHeight = 1200,
      quality = 0.8,
      format = ImageManipulator.SaveFormat.JPEG,
    } = options;

    try {
      return await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: maxWidth,
              height: maxHeight,
            },
          },
        ],
        {
          compress: quality,
          format,
        }
      );
    } catch (error) {
      logger.error('Error compressing image', error, { uri, options });
      // Return original if compression fails
      return { uri };
    }
  }

  static async createThumbnail(uri, size = 200) {
    try {
      return await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: size,
              height: size,
            },
          },
        ],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
    } catch (error) {
      logger.error('Error creating thumbnail', error, { uri, size });
      return null;
    }
  }

  static async validateImage(uri) {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      // Check file size (max 10MB)
      if (blob.size > 10 * 1024 * 1024) {
        throw new Error('Image size must be less than 10MB');
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(blob.type)) {
        throw new Error('Only JPEG, PNG, and WebP images are allowed');
      }

      return { valid: true, size: blob.size, type: blob.type };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  static async uploadProfileImage(userId, uri, isPrimary = false) {
    try {
      await this.requestPermissions();

      // Validate image
      const validation = await this.validateImage(uri);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Compress image
      const compressedImage = await this.compressImage(uri);
      const thumbnail = await this.createThumbnail(uri);

      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${userId}_${timestamp}`;
      const fullImageRef = ref(storage, `profiles/${userId}/${fileName}_full.jpg`);
      const thumbnailRef = ref(storage, `profiles/${userId}/${fileName}_thumb.jpg`);

      // Upload images to Firebase Storage (for CDN hosting)
      const [fullUpload, thumbUpload] = await Promise.all([
        uploadBytes(fullImageRef, await this.uriToBlob(compressedImage.uri)),
        thumbnail ? uploadBytes(thumbnailRef, await this.uriToBlob(thumbnail.uri)) : null,
      ]);

      // Get download URLs
      const [fullUrl, thumbUrl] = await Promise.all([
        getDownloadURL(fullImageRef),
        thumbnail ? getDownloadURL(thumbnailRef) : null,
      ]);

      // Create photo object for backend API
      const photoData = {
        url: fullUrl,
        thumbnailUrl: thumbUrl,
        isPrimary,
      };

      // Use backend API to add photo to user profile
      const response = await api.post('/profile/photos/upload', {
        photos: [photoData],
      });

      if (!response.success) {
        // If backend fails, clean up uploaded storage files
        try {
          await deleteObject(fullImageRef);
          if (thumbnail) await deleteObject(thumbnailRef);
        } catch (cleanupError) {
          logger.warn('Failed to cleanup storage after API error', cleanupError);
        }
        throw new Error(response.message || 'Failed to update profile with photo');
      }

      const imageData = {
        id: `${timestamp}`,
        fullUrl,
        thumbnailUrl: thumbUrl,
        uploadedAt: new Date(),
        isPrimary,
        fileName,
      };

      return { success: true, imageData };
    } catch (error) {
      logger.error('Error uploading profile image', error, { userId, isPrimary });
      return { success: false, error: error.message };
    }
  }

  static async deleteProfileImage(userId, imageId, imageData) {
    try {
      // Delete from storage if URL is from Firebase Storage
      try {
        if (imageData.fullUrl && imageData.fullUrl.includes('firebase')) {
          const fullRef = ref(storage, imageData.fullUrl);
          await deleteObject(fullRef);
        }

        if (imageData.thumbnailUrl && imageData.thumbnailUrl.includes('firebase')) {
          const thumbRef = ref(storage, imageData.thumbnailUrl);
          await deleteObject(thumbRef);
        }
      } catch (storageError) {
        logger.warn('Failed to delete from storage', storageError);
        // Continue with API deletion even if storage deletion fails
      }

      // Remove from user profile via backend API
      const response = await api.delete(`/profile/photos/${imageId}`);

      if (!response.success) {
        throw new Error(response.message || 'Failed to delete photo');
      }

      return { success: true };
    } catch (error) {
      logger.error('Error deleting profile image', error, { userId, imageId });
      return { success: false, error: error.message };
    }
  }

  static async setPrimaryPhoto(userId, imageId) {
    try {
      // Use backend API to update profile with reordered photos
      // Note: Setting primary is typically done by reordering photos where first photo is primary
      const response = await api.put('/profile/update', {
        primaryPhotoId: imageId,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to set primary photo');
      }

      return { success: true };
    } catch (error) {
      logger.error('Error setting primary photo', error, { userId, imageId });
      return { success: false, error: error.message };
    }
  }

  static async reorderPhotos(userId, photoIds) {
    try {
      // Use backend API to reorder photos
      const response = await api.put('/profile/photos/reorder', {
        photoIds,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to reorder photos');
      }

      return { success: true };
    } catch (error) {
      logger.error('Error reordering photos', error, { userId, photoIds });
      return { success: false, error: error.message };
    }
  }

  static async uriToBlob(uri) {
    const response = await fetch(uri);
    return await response.blob();
  }

  static async moderateImage(uri) {
    // Basic moderation - in production, integrate with services like:
    // - Google Cloud Vision API
    // - AWS Rekognition
    // - Clarifai
    // - Sightengine

    try {
      // For now, just check file size and basic validation
      // In production, you'd send to a moderation service

      const validation = await this.validateImage(uri);
      if (!validation.valid) {
        return { approved: false, reason: validation.error };
      }

      // Mock moderation result - always approve for demo
      // In production, this would check for inappropriate content
      return {
        approved: true,
        confidence: 0.95,
        categories: [],
      };
    } catch (error) {
      logger.error('Error moderating image', error, { uri });
      return { approved: false, reason: 'Moderation failed' };
    }
  }

  static getImageQualityScore(uri) {
    // Basic quality scoring based on file size and dimensions
    // In production, use more sophisticated algorithms

    // This is a simplified scoring - in production you'd analyze:
    // - Resolution
    // - Contrast
    // - Sharpness
    // - Lighting
    // - Composition

    return new Promise((resolve) => {
      // Mock scoring for demo
      const score = Math.random() * 40 + 60; // 60-100 range
      resolve(Math.round(score));
    });
  }

  static async optimizeImageForUpload(uri) {
    try {
      // Analyze image quality
      const qualityScore = await this.getImageQualityScore(uri);

      // Adjust compression based on quality
      let compressionQuality = 0.8;
      if (qualityScore < 70) {
        compressionQuality = 0.9; // Less compression for lower quality images
      } else if (qualityScore > 90) {
        compressionQuality = 0.7; // More compression for high quality images
      }

      // Compress and optimize
      return await this.compressImage(uri, {
        quality: compressionQuality,
        maxWidth: 1200,
        maxHeight: 1200,
      });
    } catch (error) {
      logger.error('Error optimizing image', error, { uri });
      return { uri }; // Return original on error
    }
  }
}
