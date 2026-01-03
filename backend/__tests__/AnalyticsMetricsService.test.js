/**
 * Unit Tests for AnalyticsMetricsService
 * TD-001: Comprehensive test coverage
 */

// Mock dependencies
const mockDatadogService = {
  gauge: jest.fn(),
  histogram: jest.fn(),
  increment: jest.fn(),
};

jest.mock('../services/MonitoringService', () => ({
  datadogService: mockDatadogService,
}));

jest.mock('../models/User', () => ({
  countDocuments: jest.fn(),
  find: jest.fn(),
}));

jest.mock('../models/Swipe', () => ({
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
}));

jest.mock('../models/Message', () => ({
  aggregate: jest.fn(),
}));

jest.mock('../models/UserActivity', () => ({
  distinct: jest.fn(),
}));

jest.mock('../models/Subscription', () => ({
  countDocuments: jest.fn(),
}));

const { AnalyticsMetricsService, analyticsMetricsService } = require('../services/AnalyticsMetricsService');
const User = require('../models/User');
const Swipe = require('../models/Swipe');
const Message = require('../models/Message');
const UserActivity = require('../models/UserActivity');
const Subscription = require('../models/Subscription');

describe('AnalyticsMetricsService', () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AnalyticsMetricsService();
    service.clearCache();
  });

  // =============================================
  // User Engagement Metrics Tests
  // =============================================

  describe('getDailyActiveUsers', () => {
    it('should return count and userIds of daily active users', async () => {
      const mockUserIds = ['user1', 'user2', 'user3'];
      UserActivity.distinct.mockResolvedValue(mockUserIds);

      const result = await service.getDailyActiveUsers(new Date('2026-01-03'));

      expect(result).toHaveProperty('count', 3);
      expect(result).toHaveProperty('date', '2026-01-03');
      expect(result).toHaveProperty('userIds');
      expect(result.userIds).toEqual(mockUserIds);
      expect(UserActivity.distinct).toHaveBeenCalledWith('userId', expect.any(Object));
      expect(mockDatadogService.gauge).toHaveBeenCalledWith(
        'users.daily_active',
        3,
        ['date:2026-01-03']
      );
    });

    it('should use cache on subsequent calls', async () => {
      const mockUserIds = ['user1', 'user2'];
      UserActivity.distinct.mockResolvedValue(mockUserIds);

      const testDate = new Date('2026-01-03');
      
      // First call
      await service.getDailyActiveUsers(testDate);
      
      // Second call should use cache
      const result = await service.getDailyActiveUsers(testDate);

      expect(result.count).toBe(2);
      expect(UserActivity.distinct).toHaveBeenCalledTimes(1);
    });

    it('should return 0 when no active users', async () => {
      UserActivity.distinct.mockResolvedValue([]);

      const result = await service.getDailyActiveUsers();

      expect(result.count).toBe(0);
      expect(result.userIds).toEqual([]);
    });
  });

  describe('getWeeklyActiveUsers', () => {
    it('should return weekly active users count', async () => {
      const mockUserIds = ['user1', 'user2', 'user3', 'user4', 'user5'];
      UserActivity.distinct.mockResolvedValue(mockUserIds);

      const result = await service.getWeeklyActiveUsers(new Date('2026-01-03'));

      expect(result).toHaveProperty('count', 5);
      expect(result).toHaveProperty('startDate');
      expect(result).toHaveProperty('endDate');
      expect(mockDatadogService.gauge).toHaveBeenCalledWith('users.weekly_active', 5);
    });

    it('should calculate correct 7-day range', async () => {
      UserActivity.distinct.mockResolvedValue([]);

      await service.getWeeklyActiveUsers(new Date('2026-01-10'));

      expect(UserActivity.distinct).toHaveBeenCalledWith('userId', {
        createdAt: expect.objectContaining({
          $gte: expect.any(Date),
          $lte: expect.any(Date),
        }),
      });
    });
  });

  describe('getMonthlyActiveUsers', () => {
    it('should return monthly active users count', async () => {
      const mockUserIds = Array(100).fill('user');
      UserActivity.distinct.mockResolvedValue(mockUserIds);

      const result = await service.getMonthlyActiveUsers();

      expect(result).toHaveProperty('count', 100);
      expect(mockDatadogService.gauge).toHaveBeenCalledWith('users.monthly_active', 100);
    });

    it('should calculate correct 30-day range', async () => {
      UserActivity.distinct.mockResolvedValue([]);

      await service.getMonthlyActiveUsers(new Date('2026-01-30'));

      expect(UserActivity.distinct).toHaveBeenCalledWith('userId', {
        createdAt: expect.objectContaining({
          $gte: expect.any(Date),
          $lte: expect.any(Date),
        }),
      });
    });
  });

  // =============================================
  // Match & Conversion Metrics Tests
  // =============================================

  describe('getMatchRate', () => {
    it('should calculate match rate correctly', async () => {
      Swipe.countDocuments.mockResolvedValue(1000);
      Swipe.aggregate.mockResolvedValue([{ matches: 100 }]);

      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-03');
      const result = await service.getMatchRate(startDate, endDate);

      expect(result).toHaveProperty('matchRate');
      expect(result).toHaveProperty('totalLikes', 1000);
      expect(result).toHaveProperty('totalMatches', 50); // 100 / 2
      expect(result.matchRate).toBe(5); // (50 / 1000) * 100
    });

    it('should return 0 match rate when no likes', async () => {
      Swipe.countDocuments.mockResolvedValue(0);
      Swipe.aggregate.mockResolvedValue([]);

      const result = await service.getMatchRate(new Date(), new Date());

      expect(result.matchRate).toBe(0);
      expect(result.totalMatches).toBe(0);
    });

    it('should send metrics to datadog', async () => {
      Swipe.countDocuments.mockResolvedValue(100);
      Swipe.aggregate.mockResolvedValue([{ matches: 10 }]);

      await service.getMatchRate(new Date(), new Date());

      expect(mockDatadogService.gauge).toHaveBeenCalledWith('matches.rate', expect.any(Number));
      expect(mockDatadogService.gauge).toHaveBeenCalledWith('matches.total', expect.any(Number));
    });
  });

  describe('getSwipeToMatchConversion', () => {
    it('should calculate swipe to match conversion correctly', async () => {
      Swipe.countDocuments
        .mockResolvedValueOnce(2000) // Total swipes
        .mockResolvedValueOnce(1000); // Total likes for match rate
      Swipe.aggregate.mockResolvedValue([{ matches: 100 }]);

      const result = await service.getSwipeToMatchConversion(new Date(), new Date());

      expect(result).toHaveProperty('conversionRate');
      expect(result).toHaveProperty('totalSwipes', 2000);
      expect(result).toHaveProperty('totalMatches');
    });

    it('should return 0 when no swipes', async () => {
      Swipe.countDocuments.mockResolvedValue(0);
      Swipe.aggregate.mockResolvedValue([]);

      const result = await service.getSwipeToMatchConversion(new Date(), new Date());

      expect(result.conversionRate).toBe(0);
    });
  });

  // =============================================
  // Message Metrics Tests
  // =============================================

  describe('getMessageResponseRate', () => {
    it('should calculate response rate correctly', async () => {
      Message.aggregate.mockResolvedValue([
        { _id: 'match1', hasResponse: true },
        { _id: 'match2', hasResponse: true },
        { _id: 'match3', hasResponse: false },
        { _id: 'match4', hasResponse: false },
      ]);

      const result = await service.getMessageResponseRate(new Date(), new Date());

      expect(result).toHaveProperty('responseRate', 50);
      expect(result).toHaveProperty('totalConversationsStarted', 4);
      expect(result).toHaveProperty('conversationsWithResponse', 2);
    });

    it('should return 0 when no conversations', async () => {
      Message.aggregate.mockResolvedValue([]);

      const result = await service.getMessageResponseRate(new Date(), new Date());

      expect(result.responseRate).toBe(0);
      expect(result.totalConversationsStarted).toBe(0);
    });
  });

  describe('getAverageMessagesPerMatch', () => {
    it('should calculate average messages correctly', async () => {
      Message.aggregate.mockResolvedValue([{
        _id: null,
        avgMessages: 15.5,
        totalMatches: 100,
        totalMessages: 1550,
      }]);

      const result = await service.getAverageMessagesPerMatch(new Date(), new Date());

      expect(result).toHaveProperty('averageMessagesPerMatch', 15.5);
      expect(result).toHaveProperty('totalMatches', 100);
      expect(result).toHaveProperty('totalMessages', 1550);
    });

    it('should return 0 when no messages', async () => {
      Message.aggregate.mockResolvedValue([]);

      const result = await service.getAverageMessagesPerMatch(new Date(), new Date());

      expect(result.averageMessagesPerMatch).toBe(0);
      expect(result.totalMatches).toBe(0);
    });
  });

  // =============================================
  // Premium Conversion Metrics Tests
  // =============================================

  describe('getPremiumConversionRate', () => {
    it('should calculate premium conversion rate correctly', async () => {
      User.countDocuments.mockResolvedValue(1000);
      Subscription.countDocuments.mockResolvedValue(50);

      const result = await service.getPremiumConversionRate(new Date(), new Date());

      expect(result).toHaveProperty('conversionRate', 5);
      expect(result).toHaveProperty('totalNewUsers', 1000);
      expect(result).toHaveProperty('premiumConversions', 50);
    });

    it('should return 0 when no users', async () => {
      User.countDocuments.mockResolvedValue(0);
      Subscription.countDocuments.mockResolvedValue(0);

      const result = await service.getPremiumConversionRate(new Date(), new Date());

      expect(result.conversionRate).toBe(0);
    });
  });

  describe('getPremiumChurnRate', () => {
    it('should calculate churn rate correctly', async () => {
      Subscription.countDocuments
        .mockResolvedValueOnce(500) // Premium at start
        .mockResolvedValueOnce(25); // Cancelled in period

      const result = await service.getPremiumChurnRate(new Date(), new Date());

      expect(result).toHaveProperty('churnRate', 5);
      expect(result).toHaveProperty('premiumAtPeriodStart', 500);
      expect(result).toHaveProperty('cancelled', 25);
    });

    it('should return 0 when no premium users at start', async () => {
      Subscription.countDocuments.mockResolvedValue(0);

      const result = await service.getPremiumChurnRate(new Date(), new Date());

      expect(result.churnRate).toBe(0);
    });
  });

  // =============================================
  // Retention Metrics Tests
  // =============================================

  describe('getRetentionRate', () => {
    it('should calculate retention rates for D1, D7, D30', async () => {
      const mockUsers = [{ _id: 'user1' }, { _id: 'user2' }, { _id: 'user3' }, { _id: 'user4' }];
      User.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUsers),
      });
      
      UserActivity.distinct
        .mockResolvedValueOnce(['user1', 'user2', 'user3']) // D1: 3 active
        .mockResolvedValueOnce(['user1', 'user2']) // D7: 2 active
        .mockResolvedValueOnce(['user1']); // D30: 1 active

      const result = await service.getRetentionRate(new Date('2025-12-01'));

      expect(result).toHaveProperty('cohortDate', '2025-12-01');
      expect(result).toHaveProperty('cohortSize', 4);
      expect(result.retention).toHaveProperty('D1');
      expect(result.retention).toHaveProperty('D7');
      expect(result.retention).toHaveProperty('D30');
      expect(result.retention.D1.rate).toBe(75); // 3/4 * 100
      expect(result.retention.D7.rate).toBe(50); // 2/4 * 100
      expect(result.retention.D30.rate).toBe(25); // 1/4 * 100
    });

    it('should return empty retention when no cohort users', async () => {
      User.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getRetentionRate(new Date());

      expect(result.cohortSize).toBe(0);
      expect(result.retention).toEqual({});
    });

    it('should accept custom retention days', async () => {
      const mockUsers = [{ _id: 'user1' }];
      User.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUsers),
      });
      UserActivity.distinct.mockResolvedValue(['user1']);

      const result = await service.getRetentionRate(new Date(), [3, 14]);

      expect(result.retention).toHaveProperty('D3');
      expect(result.retention).toHaveProperty('D14');
      expect(result.retention).not.toHaveProperty('D1');
    });
  });

  describe('getRollingRetention', () => {
    it('should calculate rolling retention correctly', async () => {
      User.countDocuments
        .mockResolvedValueOnce(1000) // Eligible users
        .mockResolvedValueOnce(200); // Eligible active count
      UserActivity.distinct.mockResolvedValue(['user1', 'user2']);

      const result = await service.getRollingRetention(30);

      expect(result).toHaveProperty('rollingRetentionRate', 20);
      expect(result).toHaveProperty('eligibleUsers', 1000);
      expect(result).toHaveProperty('retainedUsers', 200);
      expect(result).toHaveProperty('lookbackDays', 30);
    });

    it('should return 0 when no eligible users', async () => {
      User.countDocuments.mockResolvedValue(0);
      UserActivity.distinct.mockResolvedValue([]);

      const result = await service.getRollingRetention(30);

      expect(result.rollingRetentionRate).toBe(0);
    });
  });

  // =============================================
  // Technical Metrics Tests
  // =============================================

  describe('trackApiResponseTime', () => {
    it('should track response time with correct tags', () => {
      service.trackApiResponseTime('/api/users', 'GET', 200, 150);

      expect(mockDatadogService.histogram).toHaveBeenCalledWith(
        'api.response_time',
        150,
        expect.arrayContaining([
          'endpoint:/api/users',
          'method:GET',
          'status:200',
          'status_class:2xx',
        ])
      );
      expect(mockDatadogService.increment).toHaveBeenCalledWith('api.requests', 1, expect.any(Array));
    });

    it('should track 5xx errors', () => {
      service.trackApiResponseTime('/api/users', 'POST', 500, 1000);

      expect(mockDatadogService.increment).toHaveBeenCalledWith(
        'api.errors.5xx',
        1,
        expect.any(Array)
      );
    });

    it('should track 4xx errors', () => {
      service.trackApiResponseTime('/api/users', 'GET', 404, 50);

      expect(mockDatadogService.increment).toHaveBeenCalledWith(
        'api.errors.4xx',
        1,
        expect.any(Array)
      );
    });
  });

  describe('trackPhotoUpload', () => {
    it('should track successful uploads', () => {
      service.trackPhotoUpload(true, 1024000, 500);

      expect(mockDatadogService.increment).toHaveBeenCalledWith(
        'photos.upload.attempts',
        1,
        ['success:true']
      );
      expect(mockDatadogService.increment).toHaveBeenCalledWith('photos.upload.success', 1);
      expect(mockDatadogService.histogram).toHaveBeenCalledWith('photos.upload.duration', 500);
      expect(mockDatadogService.histogram).toHaveBeenCalledWith('photos.upload.size', 1024000);
    });

    it('should track failed uploads with error type', () => {
      service.trackPhotoUpload(false, 0, 0, 'timeout');

      expect(mockDatadogService.increment).toHaveBeenCalledWith(
        'photos.upload.attempts',
        1,
        expect.arrayContaining(['success:false', 'error_type:timeout'])
      );
      expect(mockDatadogService.increment).toHaveBeenCalledWith(
        'photos.upload.failures',
        1,
        expect.any(Array)
      );
    });
  });

  describe('trackCrash', () => {
    it('should track app crashes', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      service.trackCrash('ios', '1.0.0', 'NullPointerException', 'stack trace');

      expect(mockDatadogService.increment).toHaveBeenCalledWith(
        'app.crashes',
        1,
        ['platform:ios', 'version:1.0.0']
      );
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  // =============================================
  // Dashboard Tests
  // =============================================

  describe('getDashboardMetrics', () => {
    beforeEach(() => {
      UserActivity.distinct.mockResolvedValue(['user1', 'user2']);
      Swipe.countDocuments.mockResolvedValue(100);
      Swipe.aggregate.mockResolvedValue([{ matches: 10 }]);
      Message.aggregate.mockResolvedValue([
        { _id: 'match1', hasResponse: true },
        { _id: 'match2', hasResponse: false },
      ]);
      User.countDocuments.mockResolvedValue(100);
      Subscription.countDocuments.mockResolvedValue(5);
      User.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([{ _id: 'user1' }]),
      });
    });

    it('should return comprehensive dashboard metrics', async () => {
      const result = await service.getDashboardMetrics();

      expect(result).toHaveProperty('generatedAt');
      expect(result).toHaveProperty('period');
      expect(result).toHaveProperty('engagement');
      expect(result).toHaveProperty('matching');
      expect(result).toHaveProperty('messaging');
      expect(result).toHaveProperty('monetization');
      expect(result).toHaveProperty('retention');
    });

    it('should calculate DAU/MAU ratio', async () => {
      const result = await service.getDashboardMetrics();

      expect(result.engagement).toHaveProperty('dauMauRatio');
      expect(typeof result.engagement.dauMauRatio).toBe('number');
    });

    it('should use default 30-day period when startDate not provided', async () => {
      const result = await service.getDashboardMetrics();

      const periodStart = new Date(result.period.start);
      const periodEnd = new Date(result.period.end);
      const diffDays = (periodEnd - periodStart) / (1000 * 60 * 60 * 24);

      expect(diffDays).toBeCloseTo(30, 0);
    });
  });

  // =============================================
  // Cache Tests
  // =============================================

  describe('Cache functionality', () => {
    it('should cache values correctly', () => {
      service.setCache('test_key', { data: 'test' });

      expect(service.isCacheValid('test_key')).toBe(true);
    });

    it('should return false for non-existent cache key', () => {
      expect(service.isCacheValid('non_existent')).toBe(false);
    });

    it('should clear all cache', () => {
      service.setCache('key1', { data: 1 });
      service.setCache('key2', { data: 2 });

      service.clearCache();

      expect(service.isCacheValid('key1')).toBe(false);
      expect(service.isCacheValid('key2')).toBe(false);
    });

    it('should invalidate cache after TTL', async () => {
      // Override TTL for testing
      const originalTTL = service.cacheTTL;
      service.cacheTTL = 10; // 10ms

      service.setCache('test_key', { data: 'test' });

      await new Promise(resolve => setTimeout(resolve, 15));

      expect(service.isCacheValid('test_key')).toBe(false);

      service.cacheTTL = originalTTL;
    });
  });

  // =============================================
  // Singleton Instance Tests
  // =============================================

  describe('Singleton instance', () => {
    it('should export singleton instance', () => {
      expect(analyticsMetricsService).toBeInstanceOf(AnalyticsMetricsService);
    });

    it('should export class for custom instantiation', () => {
      const customInstance = new AnalyticsMetricsService();
      expect(customInstance).toBeInstanceOf(AnalyticsMetricsService);
    });
  });

  // =============================================
  // Edge Cases
  // =============================================

  describe('Edge cases', () => {
    it('should handle database errors gracefully', async () => {
      UserActivity.distinct.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.getDailyActiveUsers()).rejects.toThrow('Database connection failed');
    });

    it('should handle null/undefined dates', async () => {
      UserActivity.distinct.mockResolvedValue([]);

      // Should use current date by default
      const result = await service.getDailyActiveUsers();

      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('count', 0);
    });

    it('should handle empty aggregation results', async () => {
      Swipe.countDocuments.mockResolvedValue(100);
      Swipe.aggregate.mockResolvedValue([]);

      const result = await service.getMatchRate(new Date(), new Date());

      expect(result.totalMatches).toBe(0);
      expect(result.matchRate).toBe(0);
    });
  });
});
