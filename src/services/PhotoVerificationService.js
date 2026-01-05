import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import logger from '../utils/logger';

export class PhotoVerificationService {
  // Submit a photo for verification
  static async submitVerificationPhoto(userId, photoUri, metadata = {}) {
    try {
      // Upload photo to Firebase Storage
      const fileName = `verifications/${userId}/${Date.now()}.jpg`;
      const response = await fetch(photoUri);
      const blob = await response.blob();

      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, blob);
      const photoUrl = await getDownloadURL(storageRef);

      // Create verification record
      const verificationData = {
        userId,
        photoUrl,
        status: 'pending', // 'pending', 'approved', 'rejected'
        reason: '', // Reason for rejection if rejected
        submittedAt: new Date(),
        reviewedAt: null,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Expires in 1 year
        livenessCheck: {
          method: 'basic', // 'basic', 'selfie_match', 'advanced'
          timestamp: new Date(),
          passed: false,
          confidence: 0,
          ...metadata,
        },
        attempts: 1,
      };

      const verificationRef = doc(collection(db, 'verifications'), userId);
      await setDoc(verificationRef, verificationData, { merge: true });

      // Update user verification status
      await updateDoc(doc(db, 'users', userId), {
        verificationSubmittedAt: new Date(),
        photoVerified: false,
      });

      logger.info('Verification photo submitted', { userId, photoUrl });
      return { success: true, photoUrl };
    } catch (error) {
      logger.error('Error submitting verification photo', error, { userId });
      return { success: false, error: error.message };
    }
  }

  // Get current verification status
  static async getVerificationStatus(userId) {
    try {
      const verificationDoc = await getDoc(doc(db, 'verifications', userId));

      if (!verificationDoc.exists()) {
        return {
          verified: false,
          status: 'not_submitted',
          submittedAt: null,
          expiresAt: null,
          reason: null,
        };
      }

      const data = verificationDoc.data();

      // Check if verification expired
      if (data.expiresAt && new Date() > data.expiresAt.toDate()) {
        return {
          verified: false,
          status: 'expired',
          submittedAt: data.submittedAt,
          expiresAt: data.expiresAt,
          reason: 'Verification expired. Please submit a new photo.',
        };
      }

      return {
        verified: data.status === 'approved',
        status: data.status,
        submittedAt: data.submittedAt,
        reviewedAt: data.reviewedAt,
        expiresAt: data.expiresAt,
        reason: data.reason || null,
        photoUrl: data.photoUrl || null,
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

  // Basic liveness detection (simulated)
  static async performLivenessCheck(photoUri) {
    try {
      // In a real app, this would use a ML model or API service like AWS Rekognition
      // For now, we'll simulate basic checks

      // Fetch the image
      const response = await fetch(photoUri);
      const blob = await response.blob();

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

      const currentResponse = await fetch(currentPhotoUri);
      const currentBlob = await currentResponse.blob();

      const profileResponse = await fetch(profilePhotoUri);
      const profileBlob = await profileResponse.blob();

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

  // Get pending verifications (for admin)
  static async getPendingVerifications() {
    try {
      const q = query(collection(db, 'verifications'), where('status', '==', 'pending'));
      const docs = await getDocs(q);
      return docs.docs.map((doc) => ({
        userId: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      logger.error('Error getting pending verifications', error);
      return [];
    }
  }

  // Approve verification (admin)
  static async approveVerification(userId) {
    try {
      await updateDoc(doc(db, 'verifications', userId), {
        status: 'approved',
        reviewedAt: new Date(),
      });

      await updateDoc(doc(db, 'users', userId), {
        photoVerified: true,
        verificationApprovedAt: new Date(),
      });

      logger.info('Verification approved', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Error approving verification', error, { userId });
      return { success: false, error: error.message };
    }
  }

  // Reject verification (admin)
  static async rejectVerification(userId, reason = 'Photo does not meet requirements') {
    try {
      await updateDoc(doc(db, 'verifications', userId), {
        status: 'rejected',
        reason,
        reviewedAt: new Date(),
      });

      await updateDoc(doc(db, 'users', userId), {
        photoVerified: false,
      });

      logger.info('Verification rejected', { userId, reason });
      return { success: true };
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
        color: '#ccc',
        label: 'Not verified',
        description: 'Submit a photo to get verified',
      };
    }

    return {
      icon: 'checkmark-circle',
      color: '#4CAF50',
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
        color: '#4CAF50',
      },
      approved: {
        title: 'Verified ✓',
        description: 'Your identity has been verified',
        actionText: 'Verified',
        color: '#4CAF50',
      },
      rejected: {
        title: 'Verification Failed',
        description: 'Please check requirements and try again',
        actionText: 'Resubmit',
        color: '#FF6B6B',
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
        color: '#FF6B6B',
      },
    };

    return messages[status] || messages.error;
  }
}
