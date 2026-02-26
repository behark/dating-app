import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import logger from '../utils/logger';
import { API_URL } from '../config/api';
import api from './api';

const VERY_LIKELY = 'VERY_LIKELY';
const LIKELY = 'LIKELY';
const MODERATION_REASON_REJECTED = 'Image contains inappropriate content';
const MODERATION_REASON_APPROVED = 'Image approved by moderation service';

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
      // We skip separate thumbnail generation for local upload simplicity
      // The backend or frontend can handle resizing if needed

      // Create FormData for upload (backend expects "photos" field)
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const response = await fetch(compressedImage.uri);
        const blob = await response.blob();
        formData.append('photos', blob, `photo_${Date.now()}.jpg`);
      } else {
        formData.append('photos', {
          uri: compressedImage.uri,
          name: `photo_${Date.now()}.jpg`,
          type: 'image/jpeg',
        });
      }

      // Get auth token
      const token = await api.getAuthToken();

      // Upload to backend
      const uploadResponse = await fetch(`${API_URL}/upload/photo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          // Content-Type is set automatically by fetch for FormData
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
      }

      const uploadResult = await uploadResponse.json();

      if (!uploadResult.success) {
        throw new Error(uploadResult.message || 'Upload failed');
      }

      const uploadResults = uploadResult?.data?.uploadResults || uploadResult?.uploadResults || [];
      const firstSuccess = uploadResults.find((result) => result.success) || uploadResults[0] || {};

      const fullUrl =
        firstSuccess.url || uploadResult?.data?.url || uploadResult?.url || compressedImage.uri;
      const thumbUrl = firstSuccess.thumbnailUrl || fullUrl;

      const imageData = {
        id: firstSuccess.publicId || uploadResult.fileId || Date.now().toString(),
        fullUrl,
        thumbnailUrl: thumbUrl,
        uploadedAt: new Date(),
        isPrimary,
        fileName: firstSuccess.fileName || uploadResult.fileName,
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
      // Firebase storage deletion commented out since Firebase imports are removed
      /*
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
      */

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
    /**
     * Image Moderation Service
     *
     * Integrates with moderation services to detect inappropriate content:
     * - Nudity/Adult content
     * - Violence
     * - Hate symbols
     * - Weapons
     * - Spam/Scam content
     *
     * Supported services:
     * - Google Cloud Vision API (recommended)
     * - AWS Rekognition
     * - Sightengine
     * - Clarifai
     */

    try {
      // First, validate image format and size
      const validation = await this.validateImage(uri);
      if (!validation.valid) {
        return { approved: false, reason: validation.error };
      }

      // Check if moderation service is configured
      const moderationService = process.env.EXPO_PUBLIC_MODERATION_SERVICE || 'none';
      const moderationApiKey = process.env.EXPO_PUBLIC_MODERATION_API_KEY;

      if (moderationService === 'none' || !moderationApiKey) {
        // Fallback: Basic validation only (NOT RECOMMENDED FOR PRODUCTION)
        logger.warn('Image moderation service not configured - using basic validation only');
        return {
          approved: true,
          confidence: 0.5, // Low confidence since no real moderation
          categories: [],
          warning: 'Moderation service not configured - manual review recommended',
        };
      }

      // Convert image to base64 for API submission
      const base64Image = await this.uriToBase64(uri);

      // Route to appropriate moderation service
      switch (moderationService.toLowerCase()) {
        case 'google-vision':
          return await this.moderateWithGoogleVision(base64Image);
        case 'aws-rekognition':
          return await this.moderateWithAWSRekognition(base64Image);
        case 'sightengine':
          return await this.moderateWithSightengine(base64Image, moderationApiKey);
        case 'clarifai':
          return await this.moderateWithClarifai(base64Image, moderationApiKey);
        default:
          logger.warn(`Unknown moderation service: ${moderationService}`);
          return {
            approved: true,
            confidence: 0.5,
            categories: [],
            warning: 'Unknown moderation service',
          };
      }
    } catch (error) {
      logger.error('Error moderating image', error, { uri });
      // On error, reject image to be safe
      return {
        approved: false,
        reason: 'Moderation service error - please try again',
        error: error.message,
      };
    }
  }

  /**
   * Convert image URI to base64
   */
  static async uriToBase64(uri) {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw new Error(`Failed to convert image to base64: ${error.message}`);
    }
  }

  /**
   * Moderate with Google Cloud Vision API
   * Requires: GOOGLE_CLOUD_VISION_API_KEY environment variable
   */
  static async moderateWithGoogleVision(base64Image) {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY;
    if (!apiKey) {
      throw new Error('Google Cloud Vision API key not configured');
    }

    try {
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [
              {
                image: { content: base64Image },
                features: [
                  { type: 'SAFE_SEARCH_DETECTION', maxResults: 1 },
                  { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Google Vision API error');
      }

      const safeSearch = data.responses[0]?.safeSearchAnnotation;
      if (!safeSearch) {
        return { approved: true, confidence: 0.7, categories: [] };
      }

      // Check for inappropriate content
      const isInappropriate =
        safeSearch.adult === VERY_LIKELY ||
        safeSearch.adult === LIKELY ||
        safeSearch.violence === VERY_LIKELY ||
        safeSearch.violence === LIKELY ||
        safeSearch.racy === VERY_LIKELY;

      return {
        approved: !isInappropriate,
        confidence: 0.9,
        categories: {
          adult: safeSearch.adult,
          violence: safeSearch.violence,
          racy: safeSearch.racy,
          medical: safeSearch.medical,
          spoof: safeSearch.spoof,
        },
        reason: isInappropriate ? MODERATION_REASON_REJECTED : MODERATION_REASON_APPROVED,
      };
    } catch (error) {
      logger.error('Google Vision moderation error:', error);
      throw error;
    }
  }

  /**
   * Moderate with AWS Rekognition
   * Requires: AWS credentials configured
   */
  static async moderateWithAWSRekognition(base64Image) {
    // Note: AWS Rekognition requires AWS SDK and proper credentials
    // This is a placeholder - implement with AWS SDK in production
    logger.warn('AWS Rekognition moderation not yet implemented');
    return {
      approved: true,
      confidence: 0.5,
      categories: [],
      warning: 'AWS Rekognition not implemented',
    };
  }

  /**
   * Moderate with Sightengine API
   * Requires: SIGHTENGINE_API_KEY and SIGHTENGINE_API_SECRET
   */
  static async moderateWithSightengine(base64Image, apiKey) {
    const apiSecret = process.env.EXPO_PUBLIC_SIGHTENGINE_API_SECRET;
    if (!apiSecret) {
      throw new Error('Sightengine API secret not configured');
    }

    try {
      const formData = new FormData();
      formData.append('media', base64Image);
      formData.append('models', 'nudity,wad,offensive,celebrities,face-attributes');

      const response = await fetch(
        `https://api.sightengine.com/1.0/check.json?api_user=${apiKey}&api_secret=${apiSecret}`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Sightengine API error');
      }

      // Check moderation results
      const isInappropriate =
        data.nudity?.sexual_activity > 0.5 ||
        data.nudity?.sexual_display > 0.5 ||
        data.offensive?.prob > 0.5 ||
        data.weapon > 0.5;

      return {
        approved: !isInappropriate,
        confidence: 0.9,
        categories: {
          nudity: data.nudity,
          offensive: data.offensive,
          weapon: data.weapon,
        },
        reason: isInappropriate ? MODERATION_REASON_REJECTED : MODERATION_REASON_APPROVED,
      };
    } catch (error) {
      logger.error('Sightengine moderation error:', error);
      throw error;
    }
  }

  /**
   * Moderate with Clarifai
   * Requires: CLARIFAI_API_KEY
   */
  static async moderateWithClarifai(base64Image, apiKey) {
    try {
      const response = await fetch('https://api.clarifai.com/v2/models/nsfw-v1.0/outputs', {
        method: 'POST',
        headers: {
          Authorization: `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: [
            {
              data: {
                image: {
                  base64: base64Image,
                },
              },
            },
          ],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.status?.description || 'Clarifai API error');
      }

      const concepts = data.outputs[0]?.data?.concepts || [];
      const nsfwConcept = concepts.find((c) => c.name === 'nsfw');
      const sfwConcept = concepts.find((c) => c.name === 'sfw');

      const isInappropriate = nsfwConcept && nsfwConcept.value > 0.5;

      return {
        approved: !isInappropriate,
        confidence: nsfwConcept?.value || 0.5,
        categories: {
          nsfw: nsfwConcept?.value || 0,
          sfw: sfwConcept?.value || 0,
        },
        reason: isInappropriate ? MODERATION_REASON_REJECTED : MODERATION_REASON_APPROVED,
      };
    } catch (error) {
      logger.error('Clarifai moderation error:', error);
      throw error;
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

export default ImageService;
