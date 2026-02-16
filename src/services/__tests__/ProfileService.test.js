import { ProfileService } from '../ProfileService';
import api from '../api';
import OfflineService from '../OfflineService';

jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../OfflineService', () => ({
  __esModule: true,
  default: {
    getNetworkStatus: jest.fn(),
    getCachedProfiles: jest.fn(),
    cacheProfiles: jest.fn(),
    getCachedUserProfile: jest.fn(),
    cacheUserProfile: jest.fn(),
  },
}));

describe('ProfileService', () => {
  const validUserId = '507f1f77bcf86cd799439011';
  const PHOTO_1 = 'photo1.jpg';
  const PHOTO_2 = 'photo2.jpg';
  const UPLOAD_PHOTO_1 = 'base64data1';
  const UPLOAD_PHOTO_2 = 'base64data2';
  const mockProfile = {
    _id: validUserId,
    name: 'John Doe',
    age: 28,
    bio: 'Love hiking and coffee',
    interests: ['hiking', 'coffee'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    OfflineService.getNetworkStatus.mockReturnValue(true);
    OfflineService.getCachedProfiles.mockResolvedValue(null);
    OfflineService.getCachedUserProfile.mockResolvedValue(null);
  });

  describe('getProfile', () => {
    it('returns profile from API and updates cache', async () => {
      api.get.mockResolvedValue({
        success: true,
        data: { user: mockProfile },
      });
      OfflineService.getCachedProfiles.mockResolvedValue([{ _id: 'old_profile' }]);

      const result = await ProfileService.getProfile(validUserId);

      expect(result).toEqual(mockProfile);
      expect(api.get).toHaveBeenCalledWith(`/profile/${validUserId}`);
      expect(OfflineService.cacheProfiles).toHaveBeenCalledWith(
        expect.arrayContaining([mockProfile])
      );
    });

    it('returns cached profile when offline', async () => {
      OfflineService.getNetworkStatus.mockReturnValue(false);
      OfflineService.getCachedProfiles.mockResolvedValue([mockProfile]);

      const result = await ProfileService.getProfile(validUserId);

      expect(result).toEqual(mockProfile);
      expect(api.get).not.toHaveBeenCalled();
    });

    it('falls back to cache when API request fails', async () => {
      const cached = { _id: validUserId, name: 'Cached User' };
      api.get.mockRejectedValue(new Error('Network error'));
      OfflineService.getCachedProfiles.mockResolvedValue([cached]);

      const result = await ProfileService.getProfile(validUserId);

      expect(result).toEqual(cached);
    });

    it('throws when offline and no cached profile exists', async () => {
      OfflineService.getNetworkStatus.mockReturnValue(false);
      OfflineService.getCachedProfiles.mockResolvedValue(null);

      await expect(ProfileService.getProfile(validUserId)).rejects.toThrow(
        'No cached profile available'
      );
    });

    it('rejects invalid user IDs', async () => {
      await expect(ProfileService.getProfile('bad')).rejects.toThrow();
    });
  });

  describe('getMyProfile', () => {
    it('returns current user profile from API and caches it', async () => {
      api.get.mockResolvedValue({
        success: true,
        data: { user: mockProfile },
      });

      const result = await ProfileService.getMyProfile();

      expect(result).toEqual(mockProfile);
      expect(api.get).toHaveBeenCalledWith('/profile/me');
      expect(OfflineService.cacheUserProfile).toHaveBeenCalledWith(mockProfile);
    });

    it('returns cached current user profile when offline', async () => {
      const cached = { _id: validUserId, name: 'Offline Me' };
      OfflineService.getNetworkStatus.mockReturnValue(false);
      OfflineService.getCachedUserProfile.mockResolvedValue(cached);

      const result = await ProfileService.getMyProfile();

      expect(result).toEqual(cached);
      expect(api.get).not.toHaveBeenCalled();
    });

    it('falls back to cached current user profile on API error', async () => {
      const cached = { _id: validUserId, name: 'Fallback Me' };
      api.get.mockRejectedValue(new Error('boom'));
      OfflineService.getCachedUserProfile.mockResolvedValue(cached);

      const result = await ProfileService.getMyProfile();

      expect(result).toEqual(cached);
    });
  });

  describe('updateProfile', () => {
    it('sanitizes fields and returns updated profile', async () => {
      api.put.mockResolvedValue({
        success: true,
        data: { user: { ...mockProfile, bio: 'Updated bio' } },
      });

      const result = await ProfileService.updateProfile({
        name: '  <John>  ',
        bio: '  hello '.concat('x'.repeat(600)),
        interests: ['  music  ', '', 'travel'],
      });

      expect(result.bio).toBe('Updated bio');
      expect(api.put).toHaveBeenCalledWith(
        '/profile/update',
        expect.objectContaining({
          name: '&lt;John&gt;',
          interests: ['music', 'travel'],
        })
      );
    });
  });

  describe('photo actions', () => {
    it('uploads photos', async () => {
      api.post.mockResolvedValue({
        success: true,
        data: { photos: [PHOTO_1, PHOTO_2] },
      });

      const result = await ProfileService.uploadPhotos([UPLOAD_PHOTO_1, UPLOAD_PHOTO_2]);

      expect(result).toHaveLength(2);
      expect(api.post).toHaveBeenCalledWith('/profile/photos/upload', {
        photos: [UPLOAD_PHOTO_1, UPLOAD_PHOTO_2],
      });
    });

    it('reorders photos', async () => {
      api.put.mockResolvedValue({
        success: true,
        data: { photos: [PHOTO_2, PHOTO_1] },
      });

      const result = await ProfileService.reorderPhotos(['2', '1']);

      expect(result).toEqual([PHOTO_2, PHOTO_1]);
      expect(api.put).toHaveBeenCalledWith('/profile/photos/reorder', { photoIds: ['2', '1'] });
    });

    it('deletes a photo', async () => {
      api.delete.mockResolvedValue({
        success: true,
        data: { photos: [PHOTO_1] },
      });

      const result = await ProfileService.deletePhoto('photo123');

      expect(result).toEqual([PHOTO_1]);
      expect(api.delete).toHaveBeenCalledWith('/profile/photos/photo123');
    });

    it('rejects invalid photo ID', async () => {
      await expect(ProfileService.deletePhoto('')).rejects.toThrow('Invalid photo ID');
    });
  });

  describe('validators', () => {
    it('validates photos constraints', () => {
      expect(() => ProfileService.validatePhotos(['p1.jpg'])).not.toThrow();
      expect(() => ProfileService.validatePhotos('not-array')).toThrow('Photos must be an array');
      expect(() => ProfileService.validatePhotos(Array(7).fill('photo.jpg'))).toThrow(
        'between 1 and 6 photos'
      );
    });

    it('validates bio length', () => {
      expect(() => ProfileService.validateBio('Short bio')).not.toThrow();
      expect(() => ProfileService.validateBio('a'.repeat(501))).toThrow(
        'must not exceed 500 characters'
      );
    });

    it('validates age range', () => {
      expect(() => ProfileService.validateAge(25)).not.toThrow();
      expect(() => ProfileService.validateAge(17)).toThrow('between 18 and 100');
      expect(() => ProfileService.validateAge(101)).toThrow('between 18 and 100');
    });
  });
});
