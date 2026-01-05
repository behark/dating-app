import { SafetyService } from '../SafetyService';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(() => Promise.resolve({ id: 'report_123' })),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ empty: true, docs: [] })),
  query: jest.fn(),
  updateDoc: jest.fn(),
  where: jest.fn(),
}));

jest.mock('../../config/firebase', () => ({
  db: {},
}));

describe('SafetyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('blockUser', () => {
    it('should block a user successfully', async () => {
      const { getDoc, updateDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        data: () => ({ blockedUsers: [] }),
      });
      updateDoc.mockResolvedValue();

      const result = await SafetyService.blockUser('user1', 'user2');
      expect(result).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should not block already blocked user', async () => {
      const { getDoc, updateDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        data: () => ({ blockedUsers: ['user2'] }),
      });

      const result = await SafetyService.blockUser('user1', 'user2');
      expect(result).toBe(false);
      expect(updateDoc).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockRejectedValue(new Error('Firebase error'));

      const result = await SafetyService.blockUser('user1', 'user2');
      expect(result).toBe(false);
    });
  });

  describe('unblockUser', () => {
    it('should unblock a user successfully', async () => {
      const { getDoc, updateDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        data: () => ({ blockedUsers: ['user2', 'user3'] }),
      });
      updateDoc.mockResolvedValue();

      const result = await SafetyService.unblockUser('user1', 'user2');
      expect(result).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockRejectedValue(new Error('Firebase error'));

      const result = await SafetyService.unblockUser('user1', 'user2');
      expect(result).toBe(false);
    });
  });

  describe('getBlockedUsers', () => {
    it('should return blocked users list', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        data: () => ({ blockedUsers: ['user2', 'user3'] }),
      });

      const result = await SafetyService.getBlockedUsers('user1');
      expect(result).toEqual(['user2', 'user3']);
    });

    it('should return empty array on error', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockRejectedValue(new Error('Firebase error'));

      const result = await SafetyService.getBlockedUsers('user1');
      expect(result).toEqual([]);
    });
  });

  describe('isUserBlocked', () => {
    it('should return true if user is blocked', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        data: () => ({ blockedUsers: ['user2'] }),
      });

      const result = await SafetyService.isUserBlocked('user1', 'user2');
      expect(result).toBe(true);
    });

    it('should return false if user is not blocked', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        data: () => ({ blockedUsers: ['user3'] }),
      });

      const result = await SafetyService.isUserBlocked('user1', 'user2');
      expect(result).toBe(false);
    });
  });

  describe('reportUser', () => {
    it('should create a report successfully', async () => {
      const { addDoc, getDoc, updateDoc } = require('firebase/firestore');
      addDoc.mockResolvedValue({ id: 'report_123' });
      getDoc.mockResolvedValue({
        data: () => ({ reportCount: 0 }),
      });
      updateDoc.mockResolvedValue();

      const result = await SafetyService.reportUser(
        'reporter1',
        'reported1',
        'harassment',
        'Sent inappropriate messages'
      );

      expect(result.success).toBe(true);
      expect(result.reportId).toBe('report_123');
    });

    it('should handle report creation errors', async () => {
      const { addDoc } = require('firebase/firestore');
      addDoc.mockRejectedValue(new Error('Database error'));

      const result = await SafetyService.reportUser(
        'reporter1',
        'reported1',
        'scam',
        'Trying to collect money'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getReportCategories', () => {
    it('should return all report categories', async () => {
      const categories = await SafetyService.getReportCategories();

      expect(categories).toHaveLength(6);
      expect(categories.map((c) => c.id)).toContain('harassment');
      expect(categories.map((c) => c.id)).toContain('fake_profile');
      expect(categories.map((c) => c.id)).toContain('scam');
    });
  });

  describe('submitPhotoVerification', () => {
    it('should submit verification successfully', async () => {
      const { addDoc } = require('firebase/firestore');
      addDoc.mockResolvedValue({ id: 'verification_123' });

      const result = await SafetyService.submitPhotoVerification(
        'user1',
        'https://example.com/photo.jpg',
        { method: 'advanced', passed: true }
      );

      expect(result.success).toBe(true);
      expect(result.verificationId).toBe('verification_123');
    });

    it('should handle verification submission errors', async () => {
      const { addDoc } = require('firebase/firestore');
      addDoc.mockRejectedValue(new Error('Upload failed'));

      const result = await SafetyService.submitPhotoVerification(
        'user1',
        'https://example.com/photo.jpg'
      );

      expect(result.success).toBe(false);
    });
  });

  describe('getPhotoVerificationStatus', () => {
    it('should return not_submitted for new users', async () => {
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue({ empty: true, docs: [] });

      const result = await SafetyService.getPhotoVerificationStatus('user1');

      expect(result.verified).toBe(false);
      expect(result.status).toBe('not_submitted');
    });
  });
});
