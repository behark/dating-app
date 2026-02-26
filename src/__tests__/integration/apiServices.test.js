import { AIService } from '../../services/AIService';
import DiscoveryService from '../../services/DiscoveryService';
import { PremiumService } from '../../services/PremiumService';

global.fetch = jest.fn();

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

describe('API Services Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
  });

  it('explores users through DiscoveryService', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ success: true, data: { users: [], total: 0 } }),
    });

    const result = await DiscoveryService.exploreUsers(37.7749, -122.4194, {
      radius: 50000,
      minAge: 18,
      maxAge: 100,
      limit: 20,
    });

    expect(result).toEqual({ users: [], total: 0 });
    expect(global.fetch).toHaveBeenCalled();
  });

  it('rejects invalid coordinates in DiscoveryService', async () => {
    await expect(DiscoveryService.exploreUsers(91, 0)).rejects.toThrow('Invalid coordinates');
  });

  it('returns AI smart photo selection for valid user IDs', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        success: true,
        data: { recommendations: [], analysis: {} },
      }),
    });

    const service = new AIService('test-token');
    const result = await service.getSmartPhotoSelection('507f1f77bcf86cd799439011');

    expect(result).toEqual({ recommendations: [], analysis: {} });
  });

  it('rejects clearly invalid AI user IDs', async () => {
    const service = new AIService('test-token');
    await expect(service.getSmartPhotoSelection('x')).rejects.toThrow();
  });

  it('checks premium status and returns fallback for invalid users', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest
        .fn()
        .mockResolvedValue({ success: true, data: { isPremium: false, features: {} } }),
    });

    const valid = await PremiumService.checkPremiumStatus('507f1f77bcf86cd799439011', 'token');
    expect(valid).toEqual({ isPremium: false, features: {} });

    const invalid = await PremiumService.checkPremiumStatus('x', 'token');
    expect(invalid).toEqual({ isPremium: false, features: {} });
  });

  it('returns structured error for invalid premium upgrade plan', async () => {
    const result = await PremiumService.upgradeToPremium(
      '507f1f77bcf86cd799439011',
      'invalid',
      'token'
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Plan type must be monthly or yearly');
  });
});
