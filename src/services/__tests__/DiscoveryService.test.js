import DiscoveryService from '../DiscoveryService';
import api from '../api';

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

describe('DiscoveryService', () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DiscoveryService();
  });

  it('explores users with valid coordinates and filters', async () => {
    api.get.mockResolvedValue({
      success: true,
      data: [{ id: 'user_1' }, { id: 'user_2' }],
    });

    const result = await service.exploreUsers(40.7128, -74.006, {
      radius: 10000,
      minAge: 21,
      maxAge: 35,
      gender: 'female',
      limit: 10,
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(api.get).toHaveBeenCalledWith(
      expect.stringContaining('/discovery/explore?'),
      expect.any(Object)
    );
  });

  it('rejects invalid coordinates in exploreUsers', async () => {
    await expect(service.exploreUsers(200, -74.006)).rejects.toThrow(
      'Invalid coordinates provided'
    );
  });

  it('gets top picks', async () => {
    api.get.mockResolvedValue({
      success: true,
      data: { topPicks: [{ id: 'pick_1' }] },
    });

    const result = await service.getTopPicks(5);

    expect(api.get).toHaveBeenCalledWith('/discovery/top-picks?limit=5');
    expect(result.topPicks).toHaveLength(1);
  });

  it('gets recently active users', async () => {
    api.get.mockResolvedValue({
      success: true,
      data: { users: [{ id: 'active_1' }] },
    });

    const result = await service.getRecentlyActiveUsers(24, 20);

    expect(api.get).toHaveBeenCalledWith('/discovery/recently-active?hoursBack=24&limit=20');
    expect(result.users).toHaveLength(1);
  });

  it('gets verified profiles', async () => {
    api.get.mockResolvedValue({
      success: true,
      data: { users: [{ id: 'verified_1' }] },
    });

    const result = await service.getVerifiedProfiles(40.7128, -74.006, {
      minAge: 22,
      maxAge: 40,
      limit: 10,
    });

    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/discovery/verified?'));
    expect(result.users).toHaveLength(1);
  });

  it('initiates profile verification', async () => {
    api.post.mockResolvedValue({ success: true, data: { verificationId: 'v1' } });

    const result = await service.verifyProfile('photo');

    expect(api.post).toHaveBeenCalledWith('/discovery/verify-profile', {
      verificationMethod: 'photo',
    });
    expect(result.verificationId).toBe('v1');
  });

  it('rejects invalid user id for approval', async () => {
    await expect(service.approveProfileVerification('x')).rejects.toThrow();
  });
});
