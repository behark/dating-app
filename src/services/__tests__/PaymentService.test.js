import { PaymentService } from '../PaymentService';

// Mock API module
jest.mock('../api', () => ({
  API: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSubscriptionPlans', () => {
    it('should fetch available subscription plans', async () => {
      const { API } = require('../api');
      API.get.mockResolvedValue({
        data: {
          plans: [
            { id: 'basic', name: 'Basic', price: 9.99 },
            { id: 'premium', name: 'Premium', price: 19.99 },
            { id: 'gold', name: 'Gold', price: 29.99 },
          ],
        },
      });

      const plans = await PaymentService.getSubscriptionPlans();
      expect(plans).toHaveLength(3);
      expect(plans[0].id).toBe('basic');
    });

    it('should handle API errors', async () => {
      const { API } = require('../api');
      API.get.mockRejectedValue(new Error('Network error'));

      await expect(PaymentService.getSubscriptionPlans()).rejects.toThrow();
    });
  });

  describe('createSubscription', () => {
    it('should create subscription successfully', async () => {
      const { API } = require('../api');
      API.post.mockResolvedValue({
        data: {
          subscriptionId: 'sub_123',
          clientSecret: 'secret_123',
          status: 'pending',
        },
      });

      const result = await PaymentService.createSubscription('premium', 'pm_123');
      expect(result.subscriptionId).toBe('sub_123');
      expect(result.clientSecret).toBeDefined();
    });

    it('should validate plan ID', async () => {
      await expect(
        PaymentService.createSubscription('', 'pm_123')
      ).rejects.toThrow('Plan ID is required');
    });

    it('should validate payment method', async () => {
      await expect(
        PaymentService.createSubscription('premium', '')
      ).rejects.toThrow('Payment method is required');
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription successfully', async () => {
      const { API } = require('../api');
      API.post.mockResolvedValue({
        data: { success: true, message: 'Subscription cancelled' },
      });

      const result = await PaymentService.cancelSubscription('sub_123');
      expect(result.success).toBe(true);
    });

    it('should handle cancellation errors', async () => {
      const { API } = require('../api');
      API.post.mockRejectedValue(new Error('Cannot cancel subscription'));

      await expect(
        PaymentService.cancelSubscription('sub_123')
      ).rejects.toThrow();
    });
  });

  describe('getSubscriptionStatus', () => {
    it('should return active subscription status', async () => {
      const { API } = require('../api');
      API.get.mockResolvedValue({
        data: {
          status: 'active',
          plan: 'premium',
          expiresAt: '2026-02-01T00:00:00Z',
          features: ['unlimited_likes', 'see_who_likes_you'],
        },
      });

      const status = await PaymentService.getSubscriptionStatus('user_123');
      expect(status.status).toBe('active');
      expect(status.plan).toBe('premium');
    });

    it('should return inactive for non-subscribers', async () => {
      const { API } = require('../api');
      API.get.mockResolvedValue({
        data: { status: 'inactive', plan: null },
      });

      const status = await PaymentService.getSubscriptionStatus('user_123');
      expect(status.status).toBe('inactive');
    });
  });

  describe('purchaseBoost', () => {
    it('should purchase boost successfully', async () => {
      const { API } = require('../api');
      API.post.mockResolvedValue({
        data: {
          success: true,
          boostId: 'boost_123',
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        },
      });

      const result = await PaymentService.purchaseBoost('pm_123');
      expect(result.success).toBe(true);
      expect(result.boostId).toBeDefined();
    });
  });

  describe('purchaseSuperLike', () => {
    it('should purchase super likes successfully', async () => {
      const { API } = require('../api');
      API.post.mockResolvedValue({
        data: {
          success: true,
          quantity: 5,
          totalSuperLikes: 10,
        },
      });

      const result = await PaymentService.purchaseSuperLike(5, 'pm_123');
      expect(result.success).toBe(true);
      expect(result.quantity).toBe(5);
    });
  });

  describe('getPaymentHistory', () => {
    it('should fetch payment history', async () => {
      const { API } = require('../api');
      API.get.mockResolvedValue({
        data: {
          payments: [
            { id: 'pay_1', amount: 19.99, date: '2025-12-01', type: 'subscription' },
            { id: 'pay_2', amount: 4.99, date: '2025-12-15', type: 'boost' },
          ],
        },
      });

      const history = await PaymentService.getPaymentHistory('user_123');
      expect(history.payments).toHaveLength(2);
    });
  });

  describe('validateReceipt', () => {
    it('should validate iOS receipt', async () => {
      const { API } = require('../api');
      API.post.mockResolvedValue({
        data: { valid: true, productId: 'premium_monthly' },
      });

      const result = await PaymentService.validateReceipt('receipt_data', 'ios');
      expect(result.valid).toBe(true);
    });

    it('should validate Android receipt', async () => {
      const { API } = require('../api');
      API.post.mockResolvedValue({
        data: { valid: true, productId: 'premium_monthly' },
      });

      const result = await PaymentService.validateReceipt('receipt_data', 'android');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid receipts', async () => {
      const { API } = require('../api');
      API.post.mockResolvedValue({
        data: { valid: false, error: 'Invalid receipt' },
      });

      const result = await PaymentService.validateReceipt('invalid_receipt', 'ios');
      expect(result.valid).toBe(false);
    });
  });

  describe('restorePurchases', () => {
    it('should restore purchases successfully', async () => {
      const { API } = require('../api');
      API.post.mockResolvedValue({
        data: {
          restored: true,
          subscriptions: ['premium_monthly'],
          purchases: ['super_like_pack'],
        },
      });

      const result = await PaymentService.restorePurchases('user_123');
      expect(result.restored).toBe(true);
    });
  });
});
