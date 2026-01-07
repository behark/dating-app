/**
 * ImageService (TypeScript)
 * Handles image manipulation, compression, validation, and upload
 */

import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import logger from '../utils/logger';
import { API_URL } from '../config/api';
import api from './api';

/**
 * Image compression options
 */
export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: ImageManipulator.SaveFormat;
}

/**
 * Image validation result
 */
export interface ImageValidationResult {
  valid: boolean;
  size?: number;
  type?: string;
  error?: string;
}

/**
 * Image upload result
 */
export interface ImageUploadResult {
  success: boolean;
  imageData?: {
    id: string;
    fullUrl: string;
    thumbnailUrl: string;
    uploadedAt: Date;
    isPrimary: boolean;
    fileName?: string;
  };
  error?: string;
}

/**
 * Image moderation result
 */
export interface ImageModerationResult {
  approved: boolean;
  confidence?: number;
  categories?: Record<string, unknown>;
  reason?: string;
  warning?: string;
  error?: string;
}

/**
 * Image data for deletion
 */
export interface ImageData {
  fullUrl?: string;
  thumbnailUrl?: string;
  [key: string]: unknown;
}

export class ImageService {
  /**
   * Request media library permissions
   */
  static async requestPermissions(): Promise<void> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Camera roll permissions are required');
    }
  }

  /**
   * Compress image
   */
  static async compressImage(
    uri: string,
    options: ImageCompressionOptions = {}
  ): Promise<ImageManipulator.ImageResult> {
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
      // @ts-expect-error - logger.error accepts Error | null but TypeScript infers strict type
      logger.error('Error compressing image', error instanceof Error ? error : null, { uri, options });
      // Return original if compression fails
      return { uri } as ImageManipulator.ImageResult;
    }
  }

  /**
   * Create thumbnail
   */
  static async createThumbnail(uri: string, size: number = 200): Promise<ImageManipulator.ImageResult | null> {
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
      // @ts-expect-error - logger.error accepts Error | null but TypeScript infers strict type
      logger.error('Error creating thumbnail', error instanceof Error ? error : null, { uri, size });
      return null;
    }
  }

  /**
   * Validate image
   */
  static async validateImage(uri: string): Promise<ImageValidationResult> {
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { valid: false, error: errorMessage };
    }
  }

  /**
   * Upload profile image
   */
  static async uploadProfileImage(userId: string, uri: string, isPrimary: boolean = false): Promise<ImageUploadResult> {
    try {
      await this.requestPermissions();

      // Validate image
      const validation = await this.validateImage(uri);
      if (!validation.valid) {
        throw new Error(validation.error || 'Image validation failed');
      }

      // Compress image
      const compressedImage = await this.compressImage(uri);
      // We skip separate thumbnail generation for local upload simplicity
      // The backend or frontend can handle resizing if needed

      // Create FormData for upload
      const formData = new FormData();
      formData.append('image', {
        uri: compressedImage.uri,
        name: `photo_${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as unknown as Blob);

      // Get auth token
      const token = await api.getAuthToken();

      // Upload to backend
      const uploadResponse = await fetch(`${API_URL}/upload`, {
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

      const uploadResult = (await uploadResponse.json()) as {
        success?: boolean;
        message?: string;
        url?: string;
        fileId?: string;
        fileName?: string;
      };

      if (!uploadResult.success) {
        throw new Error(uploadResult.message || 'Upload failed');
      }

      const fullUrl = uploadResult.url || '';
      const thumbUrl = uploadResult.url || ''; // Use same URL for now

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
        throw new Error(response.message || 'Failed to update profile with photo');
      }

      const imageData = {
        id: uploadResult.fileId || Date.now().toString(),
        fullUrl,
        thumbnailUrl: thumbUrl,
        uploadedAt: new Date(),
        isPrimary,
        fileName: uploadResult.fileName,
      };

      return { success: true, imageData };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // @ts-expect-error - logger.error accepts Error | null but TypeScript infers strict type
      logger.error('Error uploading profile image', error instanceof Error ? error : null, { userId, isPrimary });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Delete profile image
   */
  static async deleteProfileImage(userId: string, imageId: string, imageData: ImageData): Promise<{ success: boolean; error?: string }> {
    try {
      // Remove from user profile via backend API
      const response = await api.delete(`/profile/photos/${imageId}`);

      if (!response.success) {
        throw new Error(response.message || 'Failed to delete photo');
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // @ts-expect-error - logger.error accepts Error | null but TypeScript infers strict type
      logger.error('Error deleting profile image', error instanceof Error ? error : null, { userId, imageId });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Set primary photo
   */
  static async setPrimaryPhoto(userId: string, imageId: string): Promise<{ success: boolean; error?: string }> {
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      // @ts-expect-error - logger.error accepts Error | null but TypeScript infers strict type
      logger.error('Error setting primary photo', error instanceof Error ? error : null, { userId, imageId });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Reorder photos
   */
  static async reorderPhotos(userId: string, photoIds: string[]): Promise<{ success: boolean; error?: string }> {
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      // @ts-expect-error - logger.error accepts Error | null but TypeScript infers strict type
      logger.error('Error reordering photos', error instanceof Error ? error : null, { userId, photoIds });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Convert URI to Blob
   */
  static async uriToBlob(uri: string): Promise<Blob> {
    const response = await fetch(uri);
    return await response.blob();
  }

  /**
   * Moderate image for inappropriate content
   */
  static async moderateImage(uri: string): Promise<ImageModerationResult> {
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
          categories: {},
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
            categories: {},
            warning: 'Unknown moderation service',
          };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // @ts-expect-error - logger.error accepts Error | null but TypeScript infers strict type
      logger.error('Error moderating image', error instanceof Error ? error : null, { uri });
      // On error, reject image to be safe
      return {
        approved: false,
        reason: 'Moderation service error - please try again',
        error: errorMessage,
      };
    }
  }

  /**
   * Convert image URI to base64
   */
  static async uriToBase64(uri: string): Promise<string> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64String = result.split(',')[1];
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to convert image to base64: ${errorMessage}`);
    }
  }

  /**
   * Moderate with Google Cloud Vision API
   */
  static async moderateWithGoogleVision(base64Image: string): Promise<ImageModerationResult> {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY;
    if (!apiKey) {
      throw new Error('Google Cloud Vision API key not configured');
    }

    try {
      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
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
      });

      const data = (await response.json()) as {
        error?: { message?: string };
        responses?: Array<{
          safeSearchAnnotation?: {
            adult?: string;
            violence?: string;
            racy?: string;
            medical?: string;
            spoof?: string;
          };
        }>;
      };

      if (!response.ok) {
        throw new Error(data.error?.message || 'Google Vision API error');
      }

      const safeSearch = data.responses?.[0]?.safeSearchAnnotation;
      if (!safeSearch) {
        return { approved: true, confidence: 0.7, categories: {} };
      }

      // Check for inappropriate content
      const isInappropriate =
        safeSearch.adult === 'VERY_LIKELY' ||
        safeSearch.adult === 'LIKELY' ||
        safeSearch.violence === 'VERY_LIKELY' ||
        safeSearch.violence === 'LIKELY' ||
        safeSearch.racy === 'VERY_LIKELY';

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
        reason: isInappropriate ? 'Image contains inappropriate content' : 'Image approved by moderation service',
      };
    } catch (error) {
      // @ts-expect-error - logger.error accepts Error | null but TypeScript infers strict type
      logger.error('Google Vision moderation error:', error);
      throw error;
    }
  }

  /**
   * Moderate with AWS Rekognition
   */
  static async moderateWithAWSRekognition(base64Image: string): Promise<ImageModerationResult> {
    // Note: AWS Rekognition requires AWS SDK and proper credentials
    // This is a placeholder - implement with AWS SDK in production
    logger.warn('AWS Rekognition moderation not yet implemented');
    return {
      approved: true,
      confidence: 0.5,
      categories: {},
      warning: 'AWS Rekognition not implemented',
    };
  }

  /**
   * Moderate with Sightengine API
   */
  static async moderateWithSightengine(base64Image: string, apiKey: string): Promise<ImageModerationResult> {
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

      const data = (await response.json()) as {
        error?: { message?: string };
        nudity?: {
          sexual_activity?: number;
          sexual_display?: number;
        };
        offensive?: { prob?: number };
        weapon?: number;
      };

      if (!response.ok) {
        throw new Error(data.error?.message || 'Sightengine API error');
      }

      // Check moderation results
      const isInappropriate =
        (data.nudity?.sexual_activity ?? 0) > 0.5 ||
        (data.nudity?.sexual_display ?? 0) > 0.5 ||
        (data.offensive?.prob ?? 0) > 0.5 ||
        (data.weapon ?? 0) > 0.5;

      return {
        approved: !isInappropriate,
        confidence: 0.9,
        categories: {
          nudity: data.nudity,
          offensive: data.offensive,
          weapon: data.weapon,
        },
        reason: isInappropriate ? 'Image contains inappropriate content' : 'Image approved by moderation service',
      };
    } catch (error) {
      // @ts-expect-error - logger.error accepts Error | null but TypeScript infers strict type
      logger.error('Sightengine moderation error:', error);
      throw error;
    }
  }

  /**
   * Moderate with Clarifai
   */
  static async moderateWithClarifai(base64Image: string, apiKey: string): Promise<ImageModerationResult> {
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

      const data = (await response.json()) as {
        status?: { description?: string };
        outputs?: Array<{
          data?: {
            concepts?: Array<{ name?: string; value?: number }>;
          };
        }>;
      };

      if (!response.ok) {
        throw new Error(data.status?.description || 'Clarifai API error');
      }

      const concepts = data.outputs?.[0]?.data?.concepts || [];
      const nsfwConcept = concepts.find((c) => c.name === 'nsfw');
      const sfwConcept = concepts.find((c) => c.name === 'sfw');

      const isInappropriate = nsfwConcept && (nsfwConcept.value ?? 0) > 0.5;

      return {
        approved: !isInappropriate,
        confidence: nsfwConcept?.value || 0.5,
        categories: {
          nsfw: nsfwConcept?.value || 0,
          sfw: sfwConcept?.value || 0,
        },
        reason: isInappropriate ? 'Image contains inappropriate content' : 'Image approved by moderation service',
      };
    } catch (error) {
      // @ts-expect-error - logger.error accepts Error | null but TypeScript infers strict type
      logger.error('Clarifai moderation error:', error);
      throw error;
    }
  }

  /**
   * Get image quality score
   */
  static async getImageQualityScore(uri: string): Promise<number> {
    // Basic quality scoring based on file size and dimensions
    // In production, use more sophisticated algorithms

    // This is a simplified scoring - in production you'd analyze:
    // - Resolution
    // - Contrast
    // - Sharpness
    // - Lighting
    // - Composition

    // Mock scoring for demo
    const score = Math.random() * 40 + 60; // 60-100 range
    return Math.round(score);
  }

  /**
   * Optimize image for upload
   */
  static async optimizeImageForUpload(uri: string): Promise<ImageManipulator.ImageResult> {
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
      // @ts-expect-error - logger.error accepts Error | null but TypeScript infers strict type
      logger.error('Error optimizing image', error instanceof Error ? error : null, { uri });
      return { uri } as ImageManipulator.ImageResult; // Return original on error
    }
  }
}
