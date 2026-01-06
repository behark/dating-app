import { Colors } from '../constants/colors';
import logger from '../utils/logger';
import api from './api';

export class PhotoVerificationService {
  // Submit a photo for verification
  static async submitVerificationPhoto(userId, photoUri, metadata = {}) {
    try {
      // Use backend API for verification submission
      const response = await api.post('/safety/photo-verification/advanced', {
        photoUri,
        livenessCheck: {
          method: metadata.method || 'basic',
          timestamp: new Date().toISOString(),
          passed: metadata.passed || false,
          confidence: metadata.confidence || 0,
          faceDetected: metadata.faceDetected || false,
          ...metadata,
        },
      });

      if (!response.success) {
        logger.error('Error submitting verification photo via API', new Error(response.message), {
          userId,
        });
        return { success: false, error: response.message || 'Failed to submit verification' };
      }

      logger.info('Verification photo submitted via API', {
        userId,
        verificationId: response.data?.verificationId,
      });
      return {
        success: true,
        verificationId: response.data?.verificationId,
        photoUrl: response.data?.photoUrl,
      };
    } catch (error) {
      logger.error('Error submitting verification photo', error, { userId });
      return { success: false, error: error.message };
    }
  }

  // Get current verification status
  static async getVerificationStatus(userId) {
    try {
      // Use account status endpoint which includes verification info
      const response = await api.get('/safety/account-status');

      if (!response.success) {
        return {
          verified: false,
          status: 'not_submitted',
          submittedAt: null,
          expiresAt: null,
          reason: null,
        };
      }

      const data = response.data || response;

      // Check if verification expired
      if (data.verificationExpiresAt && new Date() > new Date(data.verificationExpiresAt)) {
        return {
          verified: false,
          status: 'expired',
          submittedAt: data.verificationSubmittedAt,
          expiresAt: data.verificationExpiresAt,
          reason: 'Verification expired. Please submit a new photo.',
        };
      }

      return {
        verified: data.isPhotoVerified || data.photoVerified || false,
        status: data.verificationStatus || (data.isPhotoVerified ? 'approved' : 'not_submitted'),
        submittedAt: data.verificationSubmittedAt,
        reviewedAt: data.verificationReviewedAt,
        expiresAt: data.verificationExpiresAt,
        reason: data.verificationRejectionReason || null,
        photoUrl: data.verificationPhotoUrl || null,
      };
    } catch (error) {
      logger.error('Error getting verification status', error, { userId });
      return {
        verified: false,
        status: 'error',
        error: error.message,
      };
    }
  }

  // Check if user is verified
  static async isUserVerified(userId) {
    try {
      const status = await this.getVerificationStatus(userId);
      return status.verified;
    } catch (error) {
      logger.error('Error checking verification', error, { userId });
      return false;
    }
  }

  // Basic liveness detection (simulated - would integrate with ML service)
  static async performLivenessCheck(photoUri) {
    try {
      // In a real app, this would use a ML model or API service like AWS Rekognition
      // For now, we'll simulate basic checks

      // Fetch the image to validate it exists
      const response = await fetch(photoUri);
      if (!response.ok) {
        throw new Error('Failed to fetch photo');
      }

      // Basic validations
      const checks = {
        faceDetected: true, // Would use ML model
        isSelfie: true, // Would analyze photo properties
        isRecent: true, // Would check EXIF data
        spoofingDetected: false, // Would use liveness detection
        confidence: 0.85, // Confidence score 0-1
      };

      // You could integrate with services like:
      // - AWS Rekognition (Face detection & liveness)
      // - Microsoft Face API
      // - Google Cloud Vision
      // - Custom ML models

      return {
        passed: !checks.spoofingDetected && checks.faceDetected && checks.confidence > 0.7,
        checks,
        confidence: checks.confidence,
      };
    } catch (error) {
      logger.error('Error performing liveness check', error);
      return {
        passed: false,
        checks: {},
        confidence: 0,
        error: error.message,
      };
    }
  }

  // Enhanced liveness detection with selfie matching
  static async performAdvancedLivenessCheck(currentPhotoUri, profilePhotoUri) {
    try {
      // Compare current photo with profile photo to ensure it's the same person
      // Uses facial recognition

      // Validate photos exist
      const currentResponse = await fetch(currentPhotoUri);
      const profileResponse = await fetch(profilePhotoUri);

      if (!currentResponse.ok || !profileResponse.ok) {
        throw new Error('Failed to fetch photos for comparison');
      }

      // In production, use AWS Rekognition or similar service:
      // const { FaceMatches } = await rekognition.compareFaces({
      //   SourceImage: { Bytes: currentBlob },
      //   TargetImage: { Bytes: profileBlob },
      //   SimilarityThreshold: 90
      // }).promise();

      // Simulated result
      const faceMatchSimilarity = 0.92; // 92% match
      const isSamePerson = faceMatchSimilarity > 0.85;

      return {
        passed: isSamePerson,
        similarity: faceMatchSimilarity,
        isSamePerson,
        checks: {
          faceDetected: true,
          faceMatched: isSamePerson,
          qualityCheck: true,
        },
        confidence: faceMatchSimilarity,
      };
    } catch (error) {
      logger.error('Error performing advanced liveness check', error);
      return {
        passed: false,
        similarity: 0,
        isSamePerson: false,
        checks: {},
        confidence: 0,
        error: error.message,
      };
    }
  }

  // Get pending verifications (for admin) - would need admin API endpoint
  static async getPendingVerifications() {
    try {
      // This would need an admin endpoint like GET /admin/verifications/pending
      logger.warn('getPendingVerifications: Admin endpoint not available');
      return [];
    } catch (error) {
      logger.error('Error getting pending verifications', error);
      return [];
    }
  }

  // Approve verification (admin) - would need admin API endpoint
  static async approveVerification(userId) {
    try {
      // This would need an admin endpoint like PUT /admin/verifications/:userId/approve
      logger.warn('approveVerification: Admin endpoint not available');
      return { success: false, error: 'Admin endpoint not available' };
    } catch (error) {
      logger.error('Error approving verification', error, { userId });
      return { success: false, error: error.message };
    }
  }

  // Reject verification (admin) - would need admin API endpoint
  static async rejectVerification(userId, reason = 'Photo does not meet requirements') {
    try {
      // This would need an admin endpoint like PUT /admin/verifications/:userId/reject
      logger.warn('rejectVerification: Admin endpoint not available');
      return { success: false, error: 'Admin endpoint not available' };
    } catch (error) {
      logger.error('Error rejecting verification', error, { userId });
      return { success: false, error: error.message };
    }
  }

  // Get verification badge
  static getVerificationBadge(verified) {
    if (!verified) {
      return {
        icon: 'checkmark-circle-outline',
        color: Colors.text.light,
        label: 'Not verified',
        description: 'Submit a photo to get verified',
      };
    }

    return {
      icon: 'checkmark-circle',
      color: Colors.status.success,
      label: 'Verified',
      description: 'This user has verified their identity',
    };
  }

  // Validation
  static validatePhotoQuality(metadata) {
    const errors = [];

    if (!metadata.width || !metadata.height) {
      errors.push('Unable to determine photo dimensions');
    }

    const minSize = 500000; // 500 KB
    const maxSize = 10000000; // 10 MB
    if (metadata.fileSize < minSize) {
      errors.push('Photo is too small (minimum 500 KB)');
    } else if (metadata.fileSize > maxSize) {
      errors.push('Photo is too large (maximum 10 MB)');
    }

    if (metadata.width && metadata.height) {
      const aspectRatio = metadata.width / metadata.height;
      if (aspectRatio < 0.75 || aspectRatio > 1.33) {
        errors.push('Photo aspect ratio should be close to square or portrait');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Get verification requirements
  static getVerificationRequirements() {
    return [
      {
        id: 'clear_face',
        title: 'Clear Face Visible',
        description: 'Your face must be clearly visible and well-lit',
        icon: '😊',
      },
      {
        id: 'recent_photo',
        title: 'Recent Photo',
        description: 'Use a photo taken within the last 30 days',
        icon: '📅',
      },
      {
        id: 'no_filters',
        title: 'No Heavy Filters',
        description: 'Avoid extreme filters or heavy editing',
        icon: '🖼️',
      },
      {
        id: 'solo_photo',
        title: 'Solo Photo',
        description: 'Should only show you - no other people',
        icon: '👤',
      },
      {
        id: 'neutral_background',
        title: 'Neutral Background',
        description: 'Plain or natural background works best',
        icon: '🌳',
      },
      {
        id: 'facing_camera',
        title: 'Face Camera',
        description: 'Look directly at the camera',
        icon: '📷',
      },
    ];
  }

  // Verification status messages
  static getStatusMessage(status) {
    const messages = {
      not_submitted: {
        title: 'Get Verified',
        description: 'Submit a photo to verify your identity',
        actionText: 'Submit Photo',
        color: '#FFA500',
      },
      pending: {
        title: 'Verification Pending',
        description: 'Your photo is being reviewed by our safety team',
        actionText: 'Submitted',
        color: Colors.status.success,
      },
      approved: {
        title: 'Verified ✓',
        description: 'Your identity has been verified',
        actionText: 'Verified',
        color: Colors.status.success,
      },
      rejected: {
        title: 'Verification Failed',
        description: 'Please check requirements and try again',
        actionText: 'Resubmit',
        color: Colors.accent.red,
      },
      expired: {
        title: 'Verification Expired',
        description: 'Please submit a new photo for reverification',
        actionText: 'Resubmit',
        color: '#FFD93D',
      },
      error: {
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        actionText: 'Retry',
        color: Colors.accent.red,
      },
    };

    return messages[status] || messages.error;
  }
}
