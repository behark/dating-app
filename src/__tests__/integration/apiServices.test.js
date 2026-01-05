/**
 * Integration Tests for API Services
 * Tests actual API service methods with mocked fetch
 */

import DiscoveryService from '../../services/DiscoveryService';
import { AIService } from '../../services/AIService';
import { PremiumService } from '../../services/PremiumService';

// Mock fetch globally
global.fetch = jest.fn();

// Mock logger
jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: {
    apiError: jest.fn(),
    apiRequest: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock errorMessages
jest.mock('../../utils/errorMessages', () => ({
  getUserFriendlyMessage: jest.fn((msg) => msg),
  extractErrorMessage: jest.fn((error) => {
    if (typeof error === 'string') return error;
    return error?.message || 'Error';
  }),
}));

describe('API Services Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DiscoveryService', () => {
    const authToken = 'test-token';
    const service = new DiscoveryService(authToken);

    it('should explore users with validation', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: { users: [], total: 0 },
        }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      const result = await service.exploreUsers(37.7749, -122.4194, {
        radius: 50000,
        minAge: 18,
        maxAge: 100,
        limit: 20,
      });

      expect(result).toEqual({ users: [], total: 0 });
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should reject invalid coordinates', async () => {
      await expect(
        service.exploreUsers(91, 0) // Invalid latitude
      ).rejects.toThrow('Invalid coordinates');
    });

    it('should reject invalid radius', async () => {
      await expect(
        service.exploreUsers(37.7749, -122.4194, { radius: 50 }) // Too small
      ).rejects.toThrow('Radius must be between');
    });

    it('should handle API errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockResolvedValue({ message: 'Server error' }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      await expect(service.exploreUsers(37.7749, -122.4194)).rejects.toThrow();
    });
  });

  describe('AIService', () => {
    const authToken = 'test-token';
    const service = new AIService(authToken);

    it('should get smart photo selection with validation', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: { recommendations: [], analysis: {} },
        }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      const result = await service.getSmartPhotoSelection('507f1f77bcf86cd799439011');

      expect(result).toEqual({ recommendations: [], analysis: {} });
    });

    it('should reject invalid user ID', async () => {
      await expect(service.getSmartPhotoSelection('invalid-id')).rejects.toThrow('Invalid user ID');
    });
  });

  describe('PremiumService', () => {
    it('should check premium status with validation', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: { isPremium: false, features: {} },
        }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      const result = await PremiumService.checkPremiumStatus('507f1f77bcf86cd799439011', 'token');

      expect(result).toEqual({ isPremium: false, features: {} });
    });

    it('should reject invalid user ID', async () => {
      await expect(PremiumService.checkPremiumStatus('invalid', 'token')).rejects.toThrow(
        'Invalid user ID'
      );
    });

    it('should validate plan type on upgrade', async () => {
      await expect(
        PremiumService.upgradeToPremium('user-id', 'invalid-plan', 'token')
      ).rejects.toThrow('Plan type must be monthly or yearly');
    });
  });
});
