import { FeatureFlagService } from '../FeatureFlagService';
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

describe('FeatureFlagService', () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockResolvedValue({ success: true, data: [] });
    service = new FeatureFlagService();
    service.initializeFlags();
  });

  it('registers a new feature flag', () => {
    service.registerFlag('test_feature', {
      enabled: true,
      description: 'Test feature',
      rolloutPercentage: 100,
      allowedGroups: ['all'],
    });

    const flag = service.getAllFlags().find((f) => f.name === 'test_feature');
    expect(flag).toBeDefined();
    expect(flag.enabled).toBe(true);
  });

  it('evaluates sync flag checks correctly', () => {
    service.registerFlag('premium_feature', {
      enabled: true,
      rolloutPercentage: 100,
      allowedGroups: ['premium'],
    });

    expect(service.isEnabledSync('premium_feature', 'user_1', ['free'])).toBe(false);
    expect(service.isEnabledSync('premium_feature', 'user_1', ['premium'])).toBe(true);
    expect(service.isEnabledSync('missing_flag', 'user_1')).toBe(false);
  });

  it('returns consistent rollout for same user', () => {
    service.registerFlag('partial_rollout', {
      enabled: true,
      rolloutPercentage: 50,
      allowedGroups: ['all'],
    });

    const a = service.isEnabledSync('partial_rollout', 'same_user');
    const b = service.isEnabledSync('partial_rollout', 'same_user');

    expect(a).toBe(b);
  });

  it('supports user overrides', () => {
    service.registerFlag('overridable', {
      enabled: false,
      rolloutPercentage: 0,
      allowedGroups: ['all'],
    });

    expect(service.isEnabledSync('overridable', 'special_user')).toBe(false);

    service.setUserOverride('special_user', 'overridable', true);

    expect(service.isEnabledSync('overridable', 'special_user')).toBe(true);
    expect(service.isEnabledSync('overridable', 'other_user')).toBe(false);
  });

  it('returns user flags with boolean enabled values', () => {
    service.registerFlag('flag_1', {
      enabled: true,
      rolloutPercentage: 100,
      allowedGroups: ['all'],
    });

    const flags = service.getUserFlags('user_123', ['all']);

    expect(typeof flags.flag_1.enabled).toBe('boolean');
    expect(flags.flag_1.enabled).toBe(true);
  });

  it('refreshes flags from API on async checks', async () => {
    api.get.mockResolvedValue({
      success: true,
      data: [{ name: 'server_flag', enabled: true, rolloutPercentage: 100, allowedGroups: ['all'] }],
    });

    const enabled = await service.isEnabled('server_flag', 'user_1', ['all']);

    expect(api.get).toHaveBeenCalledWith('/feature-flags');
    expect(enabled).toBe(true);
  });

  it('updates rollout boundaries between 0 and 100', () => {
    service.registerFlag('cap_test', {
      enabled: true,
      rolloutPercentage: 50,
      allowedGroups: ['all'],
    });

    service.updateRollout('cap_test', 150);
    expect(service.getAllFlags().find((f) => f.name === 'cap_test').rolloutPercentage).toBe(100);

    service.updateRollout('cap_test', -10);
    expect(service.getAllFlags().find((f) => f.name === 'cap_test').rolloutPercentage).toBe(0);
  });
});
