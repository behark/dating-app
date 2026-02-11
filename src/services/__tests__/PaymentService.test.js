import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { PaymentService } from '../PaymentService';
import api from '../api';

jest.mock('expo-linking', () => ({
  openURL: jest.fn(() => Promise.resolve()),
}));

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

describe('PaymentService', () => {
  const mockToken = 'mock-auth-token';

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'web';
  });

  describe('getSubscriptionTiers', () => {
    it('fetches subscription tiers successfully', async () => {
      api.get.mockResolvedValue({
        success: true,
        data: {
          tiers: [
            { id: 'basic', name: 'Basic', price: 9.99 },
            { id: 'premium', name: 'Premium', price: 19.99 },
          ],
          consumables: {},
        },
      });

      const result = await PaymentService.getSubscriptionTiers();

      expect(api.get).toHaveBeenCalledWith('/payment/tiers');
      expect(result.tiers).toHaveLength(2);
      expect(result.tiers[0].id).toBe('basic');
    });

    it('handles API errors gracefully', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      const result = await PaymentService.getSubscriptionTiers();

      expect(result).toEqual({ tiers: [], consumables: {} });
    });
  });

  describe('getPaymentStatus', () => {
    it('fetches payment status successfully', async () => {
      api.get.mockResolvedValue({
        success: true,
        data: {
          status: 'active',
          plan: 'premium',
          expiresAt: '2026-02-01T00:00:00Z',
        },
      });

      const result = await PaymentService.getPaymentStatus(mockToken);

      expect(api.get).toHaveBeenCalledWith('/payment/status', {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result.status).toBe('active');
      expect(result.plan).toBe('premium');
    });

    it('returns null when token is missing', async () => {
      const result = await PaymentService.getPaymentStatus('');
      expect(result).toBeNull();
    });
  });

  describe('createStripeCheckout', () => {
    it('creates Stripe checkout session', async () => {
      api.post.mockResolvedValue({
        success: true,
        data: { url: 'https://checkout.stripe.com/session' },
      });

      const result = await PaymentService.createStripeCheckout('monthly', mockToken);

      expect(result.success).toBe(true);
      expect(Linking.openURL).toHaveBeenCalledWith('https://checkout.stripe.com/session');
    });

    it('returns error for invalid plan type', async () => {
      const result = await PaymentService.createStripeCheckout('invalid', mockToken);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Plan type must be monthly or yearly');
    });
  });

  describe('cancelSubscription', () => {
    it('cancels subscription successfully', async () => {
      api.post.mockResolvedValue({ success: true, data: { message: 'Subscription cancelled' } });

      const result = await PaymentService.cancelSubscription(false, mockToken);

      expect(api.post).toHaveBeenCalledWith(
        '/payment/subscription/cancel',
        { immediately: false },
        { headers: { Authorization: `Bearer ${mockToken}` } }
      );
      expect(result.success).toBe(true);
    });

    it('handles cancellation errors', async () => {
      api.post.mockRejectedValue(new Error('Cannot cancel subscription'));

      const result = await PaymentService.cancelSubscription(false, mockToken);

      expect(result.success).toBe(false);
    });
  });

  describe('validateAppleReceipt', () => {
    it('validates Apple receipt successfully', async () => {
      api.post.mockResolvedValue({
        success: true,
        data: { valid: true, productId: 'premium_monthly' },
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
    it('validates Google purchase successfully', async () => {
      api.post.mockResolvedValue({
        success: true,
        data: { valid: true, productId: 'premium_monthly' },
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
    it('returns apple for iOS', () => {
      Platform.OS = 'ios';
      expect(PaymentService.getRecommendedPaymentMethod()).toBe('apple');
    });

    it('returns google for Android', () => {
      Platform.OS = 'android';
      expect(PaymentService.getRecommendedPaymentMethod()).toBe('google');
    });

    it('returns stripe for web', () => {
      Platform.OS = 'web';
      expect(PaymentService.getRecommendedPaymentMethod()).toBe('stripe');
    });
  });

  describe('isIAPAvailable', () => {
    it('returns true for iOS', () => {
      Platform.OS = 'ios';
      expect(PaymentService.isIAPAvailable()).toBe(true);
    });

    it('returns true for Android', () => {
      Platform.OS = 'android';
      expect(PaymentService.isIAPAvailable()).toBe(true);
    });

    it('returns false for web', () => {
      Platform.OS = 'web';
      expect(PaymentService.isIAPAvailable()).toBe(false);
    });
  });
});
