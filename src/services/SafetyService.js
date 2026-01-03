import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export class SafetyService {
  // Block/Unblock users
  static async blockUser(userId, blockedUserId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const blockedUsers = userDoc.data()?.blockedUsers || [];

      if (!blockedUsers.includes(blockedUserId)) {
        await updateDoc(userRef, {
          blockedUsers: [...blockedUsers, blockedUserId],
          updatedAt: new Date(),
        });
        console.log(`User ${blockedUserId} blocked by ${userId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error blocking user:', error);
      return false;
    }
  }

  static async unblockUser(userId, blockedUserId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const blockedUsers = userDoc.data()?.blockedUsers || [];

      const filtered = blockedUsers.filter(id => id !== blockedUserId);
      await updateDoc(userRef, {
        blockedUsers: filtered,
        updatedAt: new Date(),
      });
      console.log(`User ${blockedUserId} unblocked by ${userId}`);
      return true;
    } catch (error) {
      console.error('Error unblocking user:', error);
      return false;
    }
  }

  static async getBlockedUsers(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.data()?.blockedUsers || [];
    } catch (error) {
      console.error('Error getting blocked users:', error);
      return [];
    }
  }

  static async isUserBlocked(userId, otherUserId) {
    try {
      const blockedUsers = await this.getBlockedUsers(userId);
      return blockedUsers.includes(otherUserId);
    } catch (error) {
      console.error('Error checking if user is blocked:', error);
      return false;
    }
  }

  // Report users for abuse
  static async reportUser(reporterId, reportedUserId, category, description, evidence = []) {
    try {
      const report = {
        reporterId,
        reportedUserId,
        category, // 'inappropriate_photos', 'fake_profile', 'harassment', 'scam', 'offensive_behavior', 'other'
        description,
        evidence, // array of evidence object IDs or descriptions
        status: 'pending', // 'pending', 'reviewed', 'action_taken', 'dismissed'
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'reports'), report);
      console.log('Report created:', docRef.id);

      // Increment report count on user
      await updateDoc(doc(db, 'users', reportedUserId), {
        reportCount: (await getDoc(doc(db, 'users', reportedUserId))).data()?.reportCount + 1 || 1,
      });

      return { success: true, reportId: docRef.id };
    } catch (error) {
      console.error('Error creating report:', error);
      return { success: false, error: error.message };
    }
  }

  static async getReportCategories() {
    return [
      { id: 'inappropriate_photos', label: '📸 Inappropriate Photos', color: '#FF6B6B' },
      { id: 'fake_profile', label: '👤 Fake Profile', color: '#FFD93D' },
      { id: 'harassment', label: '💬 Harassment/Abuse', color: '#6BCB77' },
      { id: 'scam', label: '⚠️ Scam', color: '#4D96FF' },
      { id: 'offensive_behavior', label: '😠 Offensive Behavior', color: '#FF6B9D' },
      { id: 'other', label: '📋 Other', color: '#9D84B7' },
    ];
  }

  // Photo verification
  static async submitPhotoVerification(userId, photoUri, livenessCheck = {}) {
    try {
      const verification = {
        userId,
        photoUri,
        livenessCheck: {
          timestamp: new Date(),
          detectionMethod: livenessCheck.method || 'basic', // 'basic', 'advanced'
          passed: livenessCheck.passed || false,
          ...livenessCheck
        },
        status: 'pending', // 'pending', 'approved', 'rejected'
        submittedAt: new Date(),
        reviewedAt: null,
      };

      const docRef = await addDoc(collection(db, 'verifications'), verification);
      console.log('Verification submitted:', docRef.id);

      return { success: true, verificationId: docRef.id };
    } catch (error) {
      console.error('Error submitting verification:', error);
      return { success: false, error: error.message };
    }
  }

  static async getPhotoVerificationStatus(userId) {
    try {
      const q = query(
        collection(db, 'verifications'),
        where('userId', '==', userId)
      );
      const docs = await getDocs(q);
      
      if (docs.empty) {
        return { verified: false, status: 'not_submitted' };
      }

      const latest = docs.docs
        .sort((a, b) => b.data().submittedAt - a.data().submittedAt)[0]
        .data();

      return {
        verified: latest.status === 'approved',
        status: latest.status,
        submittedAt: latest.submittedAt,
        reviewedAt: latest.reviewedAt,
      };
    } catch (error) {
      console.error('Error getting verification status:', error);
      return { verified: false, status: 'error' };
    }
  }

  // Content moderation flagging
  static async flagContent(userId, contentType, contentId, reason, description = '') {
    try {
      // contentType: 'message', 'profile_photo', 'bio', 'profile'
      const flag = {
        userId, // user flagging
        contentType,
        contentId,
        reason, // 'explicit', 'hateful', 'violent', 'misleading', 'spam'
        description,
        status: 'pending', // 'pending', 'reviewed', 'action_taken'
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'flags'), flag);
      console.log('Content flagged:', docRef.id);

      return { success: true, flagId: docRef.id };
    } catch (error) {
      console.error('Error flagging content:', error);
      return { success: false, error: error.message };
    }
  }

  static async getContentFlags(contentId) {
    try {
      const q = query(
        collection(db, 'flags'),
        where('contentId', '==', contentId)
      );
      const docs = await getDocs(q);
      return docs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting content flags:', error);
      return [];
    }
  }

  // Safety check before allowing interaction
  static async canInteractWith(userId, targetUserId) {
    try {
      // Check if target has blocked user
      const targetBlockedUsers = await this.getBlockedUsers(targetUserId);
      if (targetBlockedUsers.includes(userId)) {
        return { allowed: false, reason: 'blocked_by_user' };
      }

      // Check if user has blocked target
      const userBlockedUsers = await this.getBlockedUsers(userId);
      if (userBlockedUsers.includes(targetUserId)) {
        return { allowed: false, reason: 'user_blocked_target' };
      }

      // Check if target is reported/suspended
      const targetDoc = await getDoc(doc(db, 'users', targetUserId));
      if (targetDoc.data()?.suspended) {
        return { allowed: false, reason: 'user_suspended' };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking interaction:', error);
      return { allowed: false, reason: 'error' };
    }
  }

  // Get safety tips
  static getSafetyTips() {
    return [
      {
        id: 1,
        title: 'Protect Your Personal Information',
        category: 'privacy',
        tips: [
          "Don't share your home address or phone number in your profile",
          'Avoid mentioning your workplace or routine schedule',
          'Never send money or financial information to someone you just met',
          'Be cautious about location-based personal details',
        ],
        icon: '🔐',
      },
      {
        id: 2,
        title: 'Verify Before Meeting',
        category: 'verification',
        tips: [
          'Video call before meeting in person for the first time',
          'Ask for and verify photo authenticity',
          'Check their social media profiles if available',
          'Ask clarifying questions about their background',
          'Trust your instincts - if something feels off, it probably is',
        ],
        icon: '✅',
      },
      {
        id: 3,
        title: 'Safe First Meeting',
        category: 'meeting',
        tips: [
          'Always meet in a public place with good lighting',
          'Tell a friend where you are and who you are meeting',
          'Have an exit plan and means of transportation',
          'Keep your phone charged and accessible',
          'Trust your gut - cancel if you feel unsafe',
          'Avoid excessive alcohol on first dates',
        ],
        icon: '📍',
      },
      {
        id: 4,
        title: 'Online Interaction Safety',
        category: 'online',
        tips: [
          'Use the app for messaging - avoid giving phone numbers quickly',
          'Report suspicious behavior immediately',
          'Block users who make you uncomfortable',
          'Never share intimate photos with unverified users',
          'Be aware of romance scams and catfishing',
          'Verify unusual requests or stories',
        ],
        icon: '💬',
      },
      {
        id: 5,
        title: 'Red Flags to Watch For',
        category: 'warning',
        tips: [
          'Inconsistent stories or photos that look altered',
          'Pressure to move conversations off the app quickly',
          'Requests for money, gifts, or financial help',
          'Love bombing or moving too fast emotionally',
          'Resistance to video calls or meeting in person',
          'Asking for intimate photos early on',
          'Excessive compliments or flattery',
        ],
        icon: '⚠️',
      },
      {
        id: 6,
        title: 'If Something Goes Wrong',
        category: 'emergency',
        tips: [
          'Report the user immediately through the app',
          'Block the user to prevent further contact',
          'Save evidence of inappropriate behavior',
          'Contact local authorities if threatened',
          'Reach out to trusted friends or family',
          'Consider counseling if you experience trauma',
          'File a police report for serious crimes',
        ],
        icon: '🚨',
      },
    ];
  }

  static getSafetyTipsByCategory(category) {
    const allTips = this.getSafetyTips();
    return allTips.filter(tip => tip.category === category);
  }

  // User safety score (for moderation team)
  static async calculateSafetyScore(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const user = userDoc.data();

      let score = 100; // Start with perfect score

      // Deduct points for various risk factors
      if (user?.suspended) score -= 100; // Suspended users
      if (user?.reportCount && user.reportCount > 0) score -= Math.min(10 * user.reportCount, 50);
      if (!user?.emailVerified) score -= 10;
      if (!user?.phoneVerified) score -= 5;
      if (!user?.photoVerified) score -= 15;
      if (user?.blockedCount && user.blockedCount > 0) score -= Math.min(5 * user.blockedCount, 20);

      return Math.max(0, Math.min(100, score));
    } catch (error) {
      console.error('Error calculating safety score:', error);
      return null;
    }
  }

  // Validation
  static validateReport(category, description) {
    const errors = [];

    if (!category || category.trim() === '') {
      errors.push('Please select a report category');
    }

    if (!description || description.trim().length < 10) {
      errors.push('Please provide at least 10 characters of detail');
    }

    if (description && description.length > 500) {
      errors.push('Description cannot exceed 500 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
