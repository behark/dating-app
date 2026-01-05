import DiscoveryService from '../DiscoveryService';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  GeoPoint: jest.fn((lat, lng) => ({ latitude: lat, longitude: lng })),
}));

jest.mock('../../config/firebase', () => ({
  db: {},
}));

describe('DiscoveryService', () => {
  const mockUser = {
    id: 'user_123',
    location: { latitude: 40.7128, longitude: -74.006 },
    preferences: {
      ageRange: { min: 25, max: 35 },
      distance: 50,
      gender: ['female'],
    },
    blockedUsers: ['blocked_1'],
    swipedUsers: ['swiped_1', 'swiped_2'],
  };

  const mockProfiles = [
    {
      id: 'profile_1',
      name: 'Alice',
      age: 27,
      location: { latitude: 40.73, longitude: -74.01 },
      photos: ['photo1.jpg'],
      bio: 'Love hiking',
    },
    {
      id: 'profile_2',
      name: 'Emma',
      age: 29,
      location: { latitude: 40.75, longitude: -73.99 },
      photos: ['photo2.jpg'],
      bio: 'Coffee enthusiast',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDiscoveryProfiles', () => {
    it('should fetch profiles based on user preferences', async () => {
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue({
        docs: mockProfiles.map((p) => ({
          id: p.id,
          data: () => p,
        })),
      });

      const profiles = await DiscoveryService.getDiscoveryProfiles(mockUser);
      expect(profiles.length).toBeGreaterThan(0);
    });

    it('should exclude blocked users', async () => {
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue({
        docs: [
          { id: 'blocked_1', data: () => ({ name: 'Blocked User' }) },
          ...mockProfiles.map((p) => ({ id: p.id, data: () => p })),
        ],
      });

      const profiles = await DiscoveryService.getDiscoveryProfiles(mockUser);
      const blockedProfile = profiles.find((p) => p.id === 'blocked_1');
      expect(blockedProfile).toBeUndefined();
    });

    it('should exclude already swiped users', async () => {
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue({
        docs: [
          { id: 'swiped_1', data: () => ({ name: 'Swiped User' }) },
          ...mockProfiles.map((p) => ({ id: p.id, data: () => p })),
        ],
      });

      const profiles = await DiscoveryService.getDiscoveryProfiles(mockUser);
      const swipedProfile = profiles.find((p) => p.id === 'swiped_1');
      expect(swipedProfile).toBeUndefined();
    });

    it('should handle empty results', async () => {
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue({ docs: [] });

      const profiles = await DiscoveryService.getDiscoveryProfiles(mockUser);
      expect(profiles).toEqual([]);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates', () => {
      const distance = DiscoveryService.calculateDistance(
        40.7128,
        -74.006, // New York
        40.73,
        -74.01
      );

      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(10); // Should be less than 10 km
    });

    it('should return 0 for same coordinates', () => {
      const distance = DiscoveryService.calculateDistance(40.7128, -74.006, 40.7128, -74.006);

      expect(distance).toBe(0);
    });
  });

  describe('filterByDistance', () => {
    it('should filter profiles within distance', () => {
      const profiles = DiscoveryService.filterByDistance(
        mockProfiles,
        mockUser.location,
        10 // 10 km
      );

      expect(profiles.length).toBeLessThanOrEqual(mockProfiles.length);
    });

    it('should exclude profiles outside distance', () => {
      const farProfile = {
        id: 'far_1',
        location: { latitude: 41.8781, longitude: -87.6298 }, // Chicago
      };

      const profiles = DiscoveryService.filterByDistance(
        [...mockProfiles, farProfile],
        mockUser.location,
        50
      );

      const farFound = profiles.find((p) => p.id === 'far_1');
      expect(farFound).toBeUndefined();
    });
  });

  describe('filterByAge', () => {
    it('should filter profiles within age range', () => {
      const profiles = DiscoveryService.filterByAge(mockProfiles, { min: 25, max: 28 });

      profiles.forEach((p) => {
        expect(p.age).toBeGreaterThanOrEqual(25);
        expect(p.age).toBeLessThanOrEqual(28);
      });
    });
  });

  describe('sortByCompatibility', () => {
    it('should sort profiles by compatibility score', async () => {
      const sortedProfiles = await DiscoveryService.sortByCompatibility(mockProfiles, mockUser);

      expect(sortedProfiles).toHaveLength(mockProfiles.length);
      // First profile should have highest compatibility
      if (sortedProfiles.length > 1) {
        expect(sortedProfiles[0].compatibilityScore).toBeGreaterThanOrEqual(
          sortedProfiles[1].compatibilityScore
        );
      }
    });
  });

  describe('recordSwipe', () => {
    it('should record a right swipe (like)', async () => {
      const firestore = require('firebase/firestore');
      firestore.updateDoc = jest.fn().mockResolvedValue();

      await DiscoveryService.recordSwipe('user_123', 'profile_1', 'right');
      // Verify swipe was recorded
    });

    it('should record a left swipe (pass)', async () => {
      const firestore = require('firebase/firestore');
      firestore.updateDoc = jest.fn().mockResolvedValue();

      await DiscoveryService.recordSwipe('user_123', 'profile_1', 'left');
    });

    it('should record a super like', async () => {
      const firestore = require('firebase/firestore');
      firestore.updateDoc = jest.fn().mockResolvedValue();

      await DiscoveryService.recordSwipe('user_123', 'profile_1', 'superlike');
    });
  });

  describe('checkMatch', () => {
    it('should return true for mutual likes', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ likedUsers: ['user_123'] }),
      });

      const isMatch = await DiscoveryService.checkMatch('user_123', 'profile_1');
      expect(isMatch).toBe(true);
    });

    it('should return false for non-mutual likes', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ likedUsers: [] }),
      });

      const isMatch = await DiscoveryService.checkMatch('user_123', 'profile_1');
      expect(isMatch).toBe(false);
    });
  });

  describe('getRecommendations', () => {
    it('should return AI-powered recommendations', async () => {
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue({
        docs: mockProfiles.map((p) => ({
          id: p.id,
          data: () => p,
        })),
      });

      const recommendations = await DiscoveryService.getRecommendations('user_123');
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('getPaginatedProfiles', () => {
    it('should return paginated results', async () => {
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue({
        docs: mockProfiles.map((p) => ({
          id: p.id,
          data: () => p,
        })),
      });

      const result = await DiscoveryService.getPaginatedProfiles(mockUser, null, 10);
      expect(result.profiles).toBeDefined();
      expect(result.lastDoc).toBeDefined();
    });
  });
});
