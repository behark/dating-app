import { PaymentService } from '../PaymentService';

// Mock expo-linking
jest.mock('expo-linking', () => ({
  openURL: jest.fn(() => Promise.resolve()),
  createURL: jest.fn(),
  parseURL: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('PaymentService', () => {
  const mockToken = 'mock-auth-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSubscriptionTiers', () => {
    it('should fetch subscription tiers successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            tiers: [
              { id: 'basic', name: 'Basic', price: 9.99 },
              { id: 'premium', name: 'Premium', price: 19.99 },
            ],
            consumables: {},
          },
        }),
      });

      const result = await PaymentService.getSubscriptionTiers();
      expect(result.tiers).toHaveLength(2);
      expect(result.tiers[0].id).toBe('basic');
    });

    it('should handle API errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await PaymentService.getSubscriptionTiers();
      expect(result.tiers).toEqual([]);
      expect(result.consumables).toEqual({});
    });
  });

  describe('getPaymentStatus', () => {
    it('should fetch payment status successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            status: 'active',
            plan: 'premium',
            expiresAt: '2026-02-01T00:00:00Z',
          },
        }),
      });

      const result = await PaymentService.getPaymentStatus(mockToken);
      expect(result.status).toBe('active');
      expect(result.plan).toBe('premium');
    });

    it('should return null when token is missing', async () => {
      const result = await PaymentService.getPaymentStatus('');
      expect(result).toBeNull();
    });
  });

  describe('createStripeCheckout', () => {
    it('should create Stripe checkout session', async () => {
      const Linking = require('expo-linking');
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { url: 'https://checkout.stripe.com/session' },
        }),
      });

      const result = await PaymentService.createStripeCheckout('monthly', mockToken);
      expect(result.success).toBe(true);
      expect(Linking.openURL).toHaveBeenCalledWith('https://checkout.stripe.com/session');
    });

    it('should return error for invalid plan type', async () => {
      const result = await PaymentService.createStripeCheckout('invalid', mockToken);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Plan type must be monthly or yearly');
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { message: 'Subscription cancelled' },
        }),
      });

      const result = await PaymentService.cancelSubscription(false, mockToken);
      expect(result.success).toBe(true);
    });

    it('should handle cancellation errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Cannot cancel subscription' }),
      });

      const result = await PaymentService.cancelSubscription(false, mockToken);
      expect(result.success).toBe(false);
    });
  });

  describe('validateAppleReceipt', () => {
    it('should validate Apple receipt successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { valid: true, productId: 'premium_monthly' },
        }),
      });

      const result = await PaymentService.validateAppleReceipt(
        'receipt_data',
        'product_id',
        mockToken
      );
      expect(result.success).toBe(true);
      expect(result.data.valid).toBe(true);
    });
  });

  describe('validateGooglePurchase', () => {
    it('should validate Google purchase successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { valid: true, productId: 'premium_monthly' },
        }),
      });

      const result = await PaymentService.validateGooglePurchase(
        'purchase_token',
        'product_id',
        true,
        mockToken
      );
      expect(result.success).toBe(true);
    });
  });

  describe('getRecommendedPaymentMethod', () => {
    it('should return apple for iOS', () => {
      const Platform = require('react-native').Platform;
      Platform.OS = 'ios';
      expect(PaymentService.getRecommendedPaymentMethod()).toBe('apple');
    });

    it('should return google for Android', () => {
      const Platform = require('react-native').Platform;
      Platform.OS = 'android';
      expect(PaymentService.getRecommendedPaymentMethod()).toBe('google');
    });

    it('should return stripe for web', () => {
      const Platform = require('react-native').Platform;
      Platform.OS = 'web';
      expect(PaymentService.getRecommendedPaymentMethod()).toBe('stripe');
    });
  });

  describe('isIAPAvailable', () => {
    it('should return true for iOS', () => {
      const Platform = require('react-native').Platform;
      Platform.OS = 'ios';
      expect(PaymentService.isIAPAvailable()).toBe(true);
    });

    it('should return true for Android', () => {
      const Platform = require('react-native').Platform;
      Platform.OS = 'android';
      expect(PaymentService.isIAPAvailable()).toBe(true);
    });

    it('should return false for web', () => {
      const Platform = require('react-native').Platform;
      Platform.OS = 'web';
      expect(PaymentService.isIAPAvailable()).toBe(false);
    });
  });
});
