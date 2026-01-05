import { ProfileService } from '../ProfileService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('ProfileService', () => {
  // Valid MongoDB ObjectId format
  const validUserId = '507f1f77bcf86cd799439011';
  const mockProfile = {
    id: validUserId,
    name: 'John Doe',
    age: 28,
    bio: 'Love hiking and coffee',
    email: 'john@example.com',
    photos: ['photo1.jpg', 'photo2.jpg'],
    interests: ['hiking', 'coffee', 'photography'],
    location: {
      latitude: 40.7128,
      longitude: -74.006,
    },
    preferences: {
      ageRange: { min: 25, max: 35 },
      distance: 50,
      gender: 'female',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    AsyncStorage.getItem.mockResolvedValue('mock-auth-token');
  });

  describe('getProfile', () => {
    it('should fetch user profile successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { user: mockProfile },
        }),
      });

      const result = await ProfileService.getProfile(validUserId);
      expect(result).toMatchObject(mockProfile);
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining(`/profile/${validUserId}`));
    });

    it('should return null for non-existent profile', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { user: null },
        }),
      });

      const result = await ProfileService.getProfile(validUserId);
      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(ProfileService.getProfile(validUserId)).rejects.toThrow();
    });

    it('should reject invalid user IDs', async () => {
      await expect(ProfileService.getProfile('invalid-id')).rejects.toThrow();
    });
  });

  describe('getMyProfile', () => {
    it('should fetch current user profile successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { user: mockProfile },
        }),
      });

      const result = await ProfileService.getMyProfile();
      expect(result).toMatchObject(mockProfile);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/profile/me'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-auth-token',
          }),
        })
      );
    });

    it('should throw error when no auth token', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      await expect(ProfileService.getMyProfile()).rejects.toThrow('No authentication token found');
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { user: { ...mockProfile, bio: 'Updated bio' } },
        }),
      });

      const updates = { bio: 'Updated bio' };
      const result = await ProfileService.updateProfile(updates);

      expect(result.bio).toBe('Updated bio');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/profile/update'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-auth-token',
          }),
        })
      );
    });

    it('should throw error when no auth token', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      await expect(ProfileService.updateProfile({})).rejects.toThrow(
        'No authentication token found'
      );
    });
  });

  describe('uploadPhotos', () => {
    it('should upload photos successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { photos: ['photo1.jpg', 'photo2.jpg'] },
        }),
      });

      const result = await ProfileService.uploadPhotos(['base64data1', 'base64data2']);
      expect(result).toHaveLength(2);
    });
  });

  describe('deletePhoto', () => {
    it('should delete photo successfully', async () => {
      const photoId = 'photo123';
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { photos: ['photo1.jpg'] },
        }),
      });

      const result = await ProfileService.deletePhoto(photoId);
      expect(result).toHaveLength(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/profile/photos/${photoId}`),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should reject invalid photo ID', async () => {
      await expect(ProfileService.deletePhoto('')).rejects.toThrow('Invalid photo ID');
    });
  });

  describe('validatePhotos', () => {
    it('should validate photos array', () => {
      expect(() => ProfileService.validatePhotos(['photo1.jpg', 'photo2.jpg'])).not.toThrow();
    });

    it('should reject non-array', () => {
      expect(() => ProfileService.validatePhotos('not-array')).toThrow('Photos must be an array');
    });

    it('should reject too many photos', () => {
      expect(() => ProfileService.validatePhotos(Array(7).fill('photo.jpg'))).toThrow(
        'between 1 and 6 photos'
      );
    });
  });

  describe('validateBio', () => {
    it('should validate bio length', () => {
      expect(() => ProfileService.validateBio('Short bio')).not.toThrow();
    });

    it('should reject bio that is too long', () => {
      const longBio = 'a'.repeat(501);
      expect(() => ProfileService.validateBio(longBio)).toThrow('must not exceed 500 characters');
    });
  });

  describe('validateAge', () => {
    it('should validate age range', () => {
      expect(() => ProfileService.validateAge(25)).not.toThrow();
    });

    it('should reject age below 18', () => {
      expect(() => ProfileService.validateAge(17)).toThrow('between 18 and 100');
    });

    it('should reject age above 100', () => {
      expect(() => ProfileService.validateAge(101)).toThrow('between 18 and 100');
    });
  });
});
