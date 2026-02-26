const mockDatadogService = {
  gauge: jest.fn(),
  histogram: jest.fn(),
  increment: jest.fn(),
};

const cacheMock = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(true),
  del: jest.fn().mockResolvedValue(true),
  delByPattern: jest.fn().mockResolvedValue(true),
};

jest.mock('../src/infrastructure/external/MonitoringService', () => ({
  datadogService: mockDatadogService,
}));

jest.mock('../src/config/redis', () => ({
  cache: cacheMock,
  CACHE_TTL: {},
}));

jest.mock('../src/core/domain/User', () => ({
  countDocuments: jest.fn(),
  find: jest.fn(),
}));

jest.mock('../src/core/domain/Swipe', () => ({
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
}));

jest.mock('../src/core/domain/Message', () => ({
  aggregate: jest.fn(),
}));

jest.mock('../src/core/domain/UserActivity', () => ({
  distinct: jest.fn(),
}));

jest.mock('../src/core/domain/Subscription', () => ({
  countDocuments: jest.fn(),
}));

const {
  AnalyticsMetricsService,
  analyticsMetricsService,
} = require('../services/AnalyticsMetricsService');
const User = require('../src/core/domain/User');
const Swipe = require('../src/core/domain/Swipe');
const Message = require('../src/core/domain/Message');
const UserActivity = require('../src/core/domain/UserActivity');
const Subscription = require('../src/core/domain/Subscription');

describe('AnalyticsMetricsService', () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AnalyticsMetricsService();
    service.clearCache();
  });

  it('returns DAU and reports gauge', async () => {
    UserActivity.distinct.mockResolvedValue(['u1', 'u2', 'u3']);

    const result = await service.getDailyActiveUsers(new Date('2026-01-03T12:00:00.000Z'));

    expect(result.count).toBe(3);
    expect(result.date).toBe('2026-01-03');
    expect(mockDatadogService.gauge).toHaveBeenCalledWith('users.daily_active', 3, [
      'date:2026-01-03',
    ]);
  });

  it('uses cache for repeated DAU call with same date', async () => {
    UserActivity.distinct.mockResolvedValue(['u1', 'u2']);
    const d = new Date('2026-01-03T12:00:00.000Z');

    const first = await service.getDailyActiveUsers(d);
    const second = await service.getDailyActiveUsers(d);

    expect(first.count).toBe(2);
    expect(second.count).toBe(2);
    expect(UserActivity.distinct).toHaveBeenCalledTimes(1);
  });

  it('calculates match rate', async () => {
    Swipe.countDocuments.mockResolvedValue(1000);
    Swipe.aggregate.mockResolvedValue([{ matches: 100 }]);

    const result = await service.getMatchRate(new Date('2026-01-01'), new Date('2026-01-10'));

    expect(result.totalLikes).toBe(1000);
    expect(result.totalMatches).toBe(50);
    expect(result.matchRate).toBe(5);
    expect(mockDatadogService.gauge).toHaveBeenCalledWith('matches.rate', 5);
  });

  it('calculates swipe-to-match conversion', async () => {
    Swipe.countDocuments.mockResolvedValueOnce(2000).mockResolvedValueOnce(1000);
    Swipe.aggregate.mockResolvedValue([{ matches: 100 }]);

    const result = await service.getSwipeToMatchConversion(
      new Date('2026-01-01'),
      new Date('2026-01-10')
    );

    expect(result.totalSwipes).toBe(2000);
    expect(result.totalMatches).toBe(50);
    expect(result.conversionRate).toBe(2.5);
  });

  it('calculates message response rate', async () => {
    Message.aggregate.mockResolvedValue([
      { _id: 'm1', hasResponse: true },
      { _id: 'm2', hasResponse: false },
      { _id: 'm3', hasResponse: true },
    ]);

    const result = await service.getMessageResponseRate(
      new Date('2026-01-01'),
      new Date('2026-01-10')
    );

    expect(result.totalConversationsStarted).toBe(3);
    expect(result.conversationsWithResponse).toBe(2);
    expect(result.responseRate).toBeCloseTo(66.67, 2);
  });

  it('calculates premium conversion rate', async () => {
    User.countDocuments.mockResolvedValue(200);
    Subscription.countDocuments.mockResolvedValue(50);

    const result = await service.getPremiumConversionRate(
      new Date('2026-01-01'),
      new Date('2026-01-10')
    );

    expect(result.totalNewUsers).toBe(200);
    expect(result.premiumConversions).toBe(50);
    expect(result.conversionRate).toBe(25);
  });

  it('computes retention metrics per day bucket', async () => {
    User.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([{ _id: 'u1' }, { _id: 'u2' }, { _id: 'u3' }]),
    });
    UserActivity.distinct
      .mockResolvedValueOnce(['u1', 'u2'])
      .mockResolvedValueOnce(['u2'])
      .mockResolvedValueOnce(['u1']);

    const result = await service.getRetentionRate(new Date('2025-12-01T12:00:00.000Z'));

    expect(typeof result.cohortDate).toBe('string');
    expect(result.cohortSize).toBe(3);
    expect(result.retention.D1.retained).toBe(2);
    expect(result.retention.D7.retained).toBe(1);
    expect(result.retention.D30.retained).toBe(1);
  });

  it('tracks API response metrics', () => {
    service.trackApiResponseTime('/api/users', 'GET', 500, 180);

    expect(mockDatadogService.histogram).toHaveBeenCalledWith(
      'api.response_time',
      180,
      expect.arrayContaining([
        'endpoint:/api/users',
        'method:GET',
        'status:500',
        'status_class:5xx',
      ])
    );
    expect(mockDatadogService.increment).toHaveBeenCalledWith(
      'api.errors.5xx',
      1,
      expect.any(Array)
    );
  });

  it('tracks photo upload success and failure', () => {
    service.trackPhotoUpload(true, 2048, 150);
    service.trackPhotoUpload(false, 0, 0, 'timeout');

    expect(mockDatadogService.increment).toHaveBeenCalledWith('photos.upload.attempts', 1, [
      'success:true',
    ]);
    expect(mockDatadogService.increment).toHaveBeenCalledWith(
      'photos.upload.attempts',
      1,
      expect.arrayContaining(['success:false', 'error_type:timeout'])
    );
  });

  it('exports singleton instance', () => {
    expect(analyticsMetricsService).toBeInstanceOf(AnalyticsMetricsService);
  });
});
