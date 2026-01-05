import {
  doc,
  updateDoc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import logger from '../utils/logger';

export class VerificationService {
  static async submitVerificationRequest(userId, verificationData) {
    try {
      const verificationRequest = {
        userId,
        type: verificationData.type, // 'photo', 'government_id', 'social_media'
        status: 'pending', // 'pending', 'approved', 'rejected'
        submittedAt: new Date(),
        documents: verificationData.documents || [],
        notes: verificationData.notes || '',
        reviewedAt: null,
        reviewerId: null,
        reviewNotes: '',
      };

      const docRef = await addDoc(collection(db, 'verification_requests'), verificationRequest);

      // Update user profile with verification status
      await updateDoc(doc(db, 'users', userId), {
        verificationStatus: 'pending',
        verificationSubmittedAt: new Date(),
      });

      logger.info('Verification request submitted', { userId, requestId: docRef.id, type: verificationData.type });
      return { success: true, requestId: docRef.id };
    } catch (error) {
      logger.error('Error submitting verification request', error, { userId, type: verificationData.type });
      return { success: false, error: error.message };
    }
  }

  static async uploadVerificationDocument(userId, fileUri, fileName, documentType) {
    try {
      if (!storage) {
        throw new Error('Firebase Storage is not available');
      }

      const response = await fetch(fileUri);
      const blob = await response.blob();

      // Check file size (limit to 5MB)
      if (blob.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      const fileExtension = fileName.split('.').pop().toLowerCase();
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];

      if (!allowedExtensions.includes(fileExtension)) {
        throw new Error('File must be JPG, PNG, or PDF');
      }

      const fileRef = ref(storage, `verifications/${userId}/${Date.now()}_${fileName}`);

      await uploadBytes(fileRef, blob, {
        contentType: blob.type,
        customMetadata: {
          uploadedBy: userId,
          documentType,
          uploadedAt: new Date().toISOString(),
        },
      });

      const downloadURL = await getDownloadURL(fileRef);

      return {
        success: true,
        url: downloadURL,
        fileName,
        documentType,
      };
    } catch (error) {
      logger.error('Error uploading verification document', error, { userId, documentType });
      return { success: false, error: error.message };
    }
  }

  static async getVerificationStatus(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        return {
          status: 'unverified',
          verifiedAt: null,
          rejectionReason: null,
          requests: [],
        };
      }
      const userData = userDoc.data();
      if (!userData) {
        return {
          status: 'unverified',
          verifiedAt: null,
          rejectionReason: null,
          requests: [],
        };
      }

      const verificationRequestsQuery = query(
        collection(db, 'verification_requests'),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(verificationRequestsQuery);
      const requests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {
        status: userData?.verificationStatus || 'unverified', // 'unverified', 'pending', 'verified', 'rejected'
        verifiedAt: userData?.verifiedAt || null,
        rejectionReason: userData?.verificationRejectionReason || null,
        requests: requests.sort((a, b) => b.submittedAt - a.submittedAt),
      };
    } catch (error) {
      logger.error('Error getting verification status', error, { userId });
      return {
        status: 'unverified',
        verifiedAt: null,
        rejectionReason: null,
        requests: [],
      };
    }
  }

  static async cancelVerificationRequest(requestId, userId) {
    try {
      // Note: In production, you'd want to soft delete or archive requests
      // For now, we'll just mark as cancelled
      await updateDoc(doc(db, 'verification_requests', requestId), {
        status: 'cancelled',
        cancelledAt: new Date(),
      });

      // Check if user has any other pending requests
      const verificationRequestsQuery = query(
        collection(db, 'verification_requests'),
        where('userId', '==', userId),
        where('status', '==', 'pending')
      );

      const snapshot = await getDocs(verificationRequestsQuery);

      if (snapshot.empty) {
        // No more pending requests, reset user verification status
        await updateDoc(doc(db, 'users', userId), {
          verificationStatus: 'unverified',
        });
      }

      return { success: true };
    } catch (error) {
      logger.error('Error cancelling verification request', error, { requestId, userId });
      return { success: false, error: error.message };
    }
  }

  // Admin functions (for verification review)
  static async getPendingVerifications() {
    try {
      const verificationRequestsQuery = query(
        collection(db, 'verification_requests'),
        where('status', '==', 'pending')
      );

      const snapshot = await getDocs(verificationRequestsQuery);
      const requests = [];

      for (const docSnap of snapshot.docs) {
        const requestData = docSnap.data();
        const userDoc = await getDoc(doc(db, 'users', requestData.userId));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData) {
            requests.push({
              id: docSnap.id,
              ...requestData,
              user: {
                id: userDoc.id,
                name: userData.name,
                email: userData.email,
                photoURL: userData.photoURL,
              },
            });
          }
        }
      }

      return requests;
    } catch (error) {
      logger.error('Error getting pending verifications', error);
      return [];
    }
  }

  static async reviewVerification(requestId, reviewerId, approved, reviewNotes = '') {
    try {
      const requestRef = doc(db, 'verification_requests', requestId);
      const requestDoc = await getDoc(requestRef);

      if (!requestDoc.exists()) {
        throw new Error('Verification request not found');
      }

      const requestData = requestDoc.data();

      await updateDoc(requestRef, {
        status: approved ? 'approved' : 'rejected',
        reviewedAt: new Date(),
        reviewerId,
        reviewNotes,
      });

      // Update user verification status
      const userUpdate = {
        verificationStatus: approved ? 'verified' : 'rejected',
        verificationReviewedAt: new Date(),
      };

      if (approved) {
        userUpdate.verifiedAt = new Date();
        userUpdate.verificationBadge = true;
      } else {
        userUpdate.verificationRejectionReason = reviewNotes;
      }

      await updateDoc(doc(db, 'users', requestData.userId), userUpdate);

      return { success: true };
    } catch (error) {
      logger.error('Error reviewing verification', error, { requestId, reviewerId, approved });
      return { success: false, error: error.message };
    }
  }

  // Verification badge display logic
  static getVerificationBadgeInfo(userData) {
    const status = userData?.verificationStatus || 'unverified';

    switch (status) {
      case 'verified':
        return {
          showBadge: true,
          badgeColor: '#4ECDC4',
          badgeText: 'Verified',
          iconName: 'checkmark-circle',
        };
      case 'pending':
        return {
          showBadge: true,
          badgeColor: '#FFA500',
          badgeText: 'Pending',
          iconName: 'time',
        };
      case 'rejected':
        return {
          showBadge: false,
          badgeText: '',
        };
      default:
        return {
          showBadge: false,
          badgeText: '',
        };
    }
  }
}
