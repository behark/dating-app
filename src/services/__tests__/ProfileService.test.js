import { ProfileService } from '../ProfileService';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn(),
}));

jest.mock('../../config/firebase', () => ({
  db: {},
  storage: {},
}));

describe('ProfileService', () => {
  const mockProfile = {
    id: 'user_123',
    name: 'John Doe',
    age: 28,
    bio: 'Love hiking and coffee',
    email: 'john@example.com',
    photos: ['photo1.jpg', 'photo2.jpg'],
    interests: ['hiking', 'coffee', 'photography'],
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
    },
    preferences: {
      ageRange: { min: 25, max: 35 },
      distance: 50,
      gender: 'female',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should fetch user profile successfully', async () => {
      const { getDoc, doc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProfile,
        id: 'user_123',
      });

      const result = await ProfileService.getProfile('user_123');
      expect(result).toMatchObject(mockProfile);
    });

    it('should return null for non-existent profile', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await ProfileService.getProfile('nonexistent');
      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockRejectedValue(new Error('Network error'));

      await expect(ProfileService.getProfile('user_123')).rejects.toThrow();
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const { updateDoc } = require('firebase/firestore');
      updateDoc.mockResolvedValue();

      const updates = { bio: 'Updated bio' };
      await ProfileService.updateProfile('user_123', updates);

      expect(updateDoc).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const invalidUpdates = { name: '' };
      
      await expect(
        ProfileService.updateProfile('user_123', invalidUpdates)
      ).rejects.toThrow();
    });
  });

  describe('createProfile', () => {
    it('should create a new profile', async () => {
      const { setDoc } = require('firebase/firestore');
      setDoc.mockResolvedValue();

      await ProfileService.createProfile('user_123', mockProfile);
      expect(setDoc).toHaveBeenCalled();
    });

    it('should set default values for missing fields', async () => {
      const { setDoc } = require('firebase/firestore');
      setDoc.mockResolvedValue();

      const minimalProfile = {
        name: 'Jane',
        age: 25,
        email: 'jane@example.com',
      };

      await ProfileService.createProfile('user_123', minimalProfile);
      expect(setDoc).toHaveBeenCalled();
    });
  });

  describe('uploadPhoto', () => {
    it('should upload photo and return URL', async () => {
      const { uploadBytes, getDownloadURL, ref } = require('firebase/storage');
      uploadBytes.mockResolvedValue({});
      getDownloadURL.mockResolvedValue('https://firebase.storage/photo.jpg');

      const result = await ProfileService.uploadPhoto('user_123', 'base64data');
      expect(result).toContain('firebase.storage');
    });

    it('should handle upload errors', async () => {
      const { uploadBytes } = require('firebase/storage');
      uploadBytes.mockRejectedValue(new Error('Upload failed'));

      await expect(
        ProfileService.uploadPhoto('user_123', 'base64data')
      ).rejects.toThrow();
    });
  });

  describe('deletePhoto', () => {
    it('should delete photo successfully', async () => {
      const { deleteObject, ref } = require('firebase/storage');
      const { updateDoc } = require('firebase/firestore');
      deleteObject.mockResolvedValue();
      updateDoc.mockResolvedValue();

      await ProfileService.deletePhoto('user_123', 'photo_url');
      expect(deleteObject).toHaveBeenCalled();
    });
  });

  describe('updateLocation', () => {
    it('should update user location', async () => {
      const { updateDoc } = require('firebase/firestore');
      updateDoc.mockResolvedValue();

      await ProfileService.updateLocation('user_123', 40.7128, -74.0060);
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should validate coordinates', async () => {
      await expect(
        ProfileService.updateLocation('user_123', 999, -74.0060)
      ).rejects.toThrow();
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences', async () => {
      const { updateDoc } = require('firebase/firestore');
      updateDoc.mockResolvedValue();

      const preferences = {
        ageRange: { min: 20, max: 40 },
        distance: 100,
      };

      await ProfileService.updatePreferences('user_123', preferences);
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should validate age range', async () => {
      const invalidPreferences = {
        ageRange: { min: 10, max: 40 }, // min too low
      };

      await expect(
        ProfileService.updatePreferences('user_123', invalidPreferences)
      ).rejects.toThrow();
    });
  });

  describe('searchProfiles', () => {
    it('should return matching profiles', async () => {
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue({
        docs: [
          { id: 'user_1', data: () => ({ name: 'Alice', age: 25 }) },
          { id: 'user_2', data: () => ({ name: 'Bob', age: 27 }) },
        ],
      });

      const results = await ProfileService.searchProfiles({
        ageRange: { min: 20, max: 30 },
      });

      expect(results).toHaveLength(2);
    });
  });

  describe('getProfileCompleteness', () => {
    it('should calculate profile completeness percentage', () => {
      const completeProfile = {
        name: 'John',
        age: 28,
        bio: 'Hello',
        photos: ['photo1.jpg'],
        interests: ['hiking'],
        location: { latitude: 0, longitude: 0 },
      };

      const completeness = ProfileService.getProfileCompleteness(completeProfile);
      expect(completeness).toBeGreaterThan(80);
    });

    it('should return lower percentage for incomplete profiles', () => {
      const incompleteProfile = {
        name: 'John',
        age: 28,
      };

      const completeness = ProfileService.getProfileCompleteness(incompleteProfile);
      expect(completeness).toBeLessThan(50);
    });
  });
});
