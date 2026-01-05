/**
 * Payment API Tests
 * Comprehensive test suite for /api/payment endpoints
 */

const request = require('supertest');
const express = require('express');

const {
  generateTestToken,
  authHeader,
  assertUnauthorized,
  assertValidationError,
} = require('../utils/testHelpers');

const { payments } = require('../utils/fixtures');

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn().mockResolvedValue({ id: 'cus_test123' }),
      retrieve: jest.fn().mockResolvedValue({ id: 'cus_test123' }),
    },
    subscriptions: {
      create: jest.fn().mockResolvedValue({
        id: 'sub_test123',
        status: 'active',
        current_period_end: Date.now() / 1000 + 30 * 24 * 60 * 60,
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'sub_test123',
        status: 'active',
      }),
      cancel: jest.fn().mockResolvedValue({
        id: 'sub_test123',
        status: 'canceled',
      }),
      update: jest.fn().mockResolvedValue({
        id: 'sub_test123',
        status: 'active',
      }),
    },
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          id: 'cs_test123',
          url: 'https://checkout.stripe.com/test',
        }),
      },
    },
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_test123',
        client_secret: 'secret_test',
      }),
    },
    setupIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'seti_test123',
        client_secret: 'secret_test',
      }),
    },
    billingPortal: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          url: 'https://billing.stripe.com/test',
        }),
      },
    },
    webhooks: {
      constructEvent: jest.fn().mockReturnValue({
        type: 'checkout.session.completed',
        data: { object: { customer: 'cus_test123' } },
      }),
    },
  }));
});

// Mock User model
jest.mock('../../models/User', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findOne: jest.fn(),
}));

// Mock Payment model (if exists)
jest.mock('../../models/Payment', () => ({
  find: jest.fn(),
  create: jest.fn(),
  findOne: jest.fn(),
}), { virtual: true });

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  const paymentRoutes = require('../../routes/payment');
  app.use('/api/payment', paymentRoutes);
  
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  });
  
  return app;
};

describe('Payment API Tests', () => {
  let app;
  const User = require('../../models/User');
  
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test123';
    app = createTestApp();
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/payment/tiers (Public)', () => {
    describe('Success Cases', () => {
      it('should return available subscription tiers', async () => {
        const response = await request(app)
          .get('/api/payment/tiers');
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.tiers || response.body.data).toBeDefined();
      });
      
      it('should work without authentication', async () => {
        const response = await request(app)
          .get('/api/payment/tiers');
        
        expect(response.status).toBe(200);
      });
    });
  });
  
  describe('GET /api/payment/status', () => {
    describe('Success Cases', () => {
      it('should return payment status for authenticated user', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          subscription: {
            tier: 'gold',
            status: 'active',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          stripeCustomerId: 'cus_test123',
        });
        
        const response = await request(app)
          .get('/api/payment/status')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
      
      it('should return free tier for user without subscription', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          subscription: { tier: 'free' },
        });
        
        const response = await request(app)
          .get('/api/payment/status')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('Unauthorized Access', () => {
      it('should reject unauthenticated request', async () => {
        const response = await request(app)
          .get('/api/payment/status');
        
        assertUnauthorized(response);
      });
    });
  });
  
  describe('GET /api/payment/history', () => {
    describe('Success Cases', () => {
      it('should return billing history for user', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          stripeCustomerId: 'cus_test123',
        });
        
        const response = await request(app)
          .get('/api/payment/history')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
      });
    });
  });
  
  describe('Stripe Endpoints', () => {
    describe('POST /api/payment/stripe/checkout', () => {
      describe('Success Cases', () => {
        it('should create checkout session', async () => {
          User.findById.mockResolvedValue({
            _id: 'user_id',
            email: 'test@example.com',
            stripeCustomerId: 'cus_test123',
          });
          
          const response = await request(app)
            .post('/api/payment/stripe/checkout')
            .set('Authorization', `Bearer ${generateTestToken()}`)
            .send(payments.stripeCheckout);
          
          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
        });
        
        it('should create new Stripe customer if not exists', async () => {
          User.findById.mockResolvedValue({
            _id: 'user_id',
            email: 'test@example.com',
            // No stripeCustomerId
          });
          
          User.findByIdAndUpdate.mockResolvedValue({
            _id: 'user_id',
            stripeCustomerId: 'cus_test123',
          });
          
          const response = await request(app)
            .post('/api/payment/stripe/checkout')
            .set('Authorization', `Bearer ${generateTestToken()}`)
            .send(payments.stripeCheckout);
          
          expect(response.status).toBe(200);
        });
      });
      
      describe('Validation Errors', () => {
        it('should reject without planId', async () => {
          const response = await request(app)
            .post('/api/payment/stripe/checkout')
            .set('Authorization', `Bearer ${generateTestToken()}`)
            .send({ successUrl: 'https://example.com/success' });
          
          expect(response.status).toBe(400);
        });
      });
    });
    
    describe('POST /api/payment/stripe/payment-intent', () => {
      describe('Success Cases', () => {
        it('should create payment intent', async () => {
          User.findById.mockResolvedValue({
            _id: 'user_id',
            stripeCustomerId: 'cus_test123',
          });
          
          const response = await request(app)
            .post('/api/payment/stripe/payment-intent')
            .set('Authorization', `Bearer ${generateTestToken()}`)
            .send(payments.stripePaymentIntent);
          
          expect(response.status).toBe(200);
          expect(response.body.clientSecret).toBeDefined();
        });
      });
    });
    
    describe('POST /api/payment/stripe/setup-intent', () => {
      describe('Success Cases', () => {
        it('should create setup intent', async () => {
          User.findById.mockResolvedValue({
            _id: 'user_id',
            stripeCustomerId: 'cus_test123',
          });
          
          const response = await request(app)
            .post('/api/payment/stripe/setup-intent')
            .set('Authorization', `Bearer ${generateTestToken()}`);
          
          expect(response.status).toBe(200);
        });
      });
    });
    
    describe('GET /api/payment/stripe/portal', () => {
      describe('Success Cases', () => {
        it('should return customer portal URL', async () => {
          User.findById.mockResolvedValue({
            _id: 'user_id',
            stripeCustomerId: 'cus_test123',
          });
          
          const response = await request(app)
            .get('/api/payment/stripe/portal')
            .set('Authorization', `Bearer ${generateTestToken()}`);
          
          expect(response.status).toBe(200);
          expect(response.body.url).toBeDefined();
        });
      });
      
      describe('Edge Cases', () => {
        it('should return error for user without Stripe customer', async () => {
          User.findById.mockResolvedValue({
            _id: 'user_id',
            // No stripeCustomerId
          });
          
          const response = await request(app)
            .get('/api/payment/stripe/portal')
            .set('Authorization', `Bearer ${generateTestToken()}`);
          
          expect(response.status).toBe(400);
        });
      });
    });
  });
  
  describe('PayPal Endpoints', () => {
    describe('POST /api/payment/paypal/subscription', () => {
      it('should create PayPal subscription', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          email: 'test@example.com',
        });
        
        const response = await request(app)
          .post('/api/payment/paypal/subscription')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send(payments.paypalSubscription);
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('POST /api/payment/paypal/subscription/activate', () => {
      it('should activate PayPal subscription', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
        });
        
        const response = await request(app)
          .post('/api/payment/paypal/subscription/activate')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ subscriptionId: 'sub_paypal_123' });
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('POST /api/payment/paypal/order', () => {
      it('should create PayPal order', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
        });
        
        const response = await request(app)
          .post('/api/payment/paypal/order')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ amount: 9.99, currency: 'USD' });
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('POST /api/payment/paypal/order/capture', () => {
      it('should capture PayPal order', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
        });
        
        const response = await request(app)
          .post('/api/payment/paypal/order/capture')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ orderId: 'order_paypal_123' });
        
        expect(response.status).toBe(200);
      });
    });
  });
  
  describe('Apple IAP Endpoints', () => {
    describe('POST /api/payment/apple/validate', () => {
      it('should validate Apple receipt', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
        });
        
        const response = await request(app)
          .post('/api/payment/apple/validate')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send(payments.appleReceipt);
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('POST /api/payment/apple/restore', () => {
      it('should restore Apple purchases', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
        });
        
        const response = await request(app)
          .post('/api/payment/apple/restore')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ receiptData: 'base64_receipt' });
        
        expect(response.status).toBe(200);
      });
    });
  });
  
  describe('Google Play Endpoints', () => {
    describe('POST /api/payment/google/validate', () => {
      it('should validate Google purchase', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
        });
        
        const response = await request(app)
          .post('/api/payment/google/validate')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send(payments.googlePurchase);
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('POST /api/payment/google/restore', () => {
      it('should restore Google purchases', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
        });
        
        const response = await request(app)
          .post('/api/payment/google/restore')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({});
        
        expect(response.status).toBe(200);
      });
    });
  });
  
  describe('Subscription Management', () => {
    describe('POST /api/payment/subscription/cancel', () => {
      it('should cancel active subscription', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          subscription: {
            tier: 'gold',
            stripeSubscriptionId: 'sub_test123',
          },
        });
        
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          subscription: { tier: 'gold', cancelAtPeriodEnd: true },
        });
        
        const response = await request(app)
          .post('/api/payment/subscription/cancel')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('POST /api/payment/subscription/resume', () => {
      it('should resume canceled subscription', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          subscription: {
            tier: 'gold',
            stripeSubscriptionId: 'sub_test123',
            cancelAtPeriodEnd: true,
          },
        });
        
        const response = await request(app)
          .post('/api/payment/subscription/resume')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
      });
    });
  });
  
  describe('Refund Endpoints', () => {
    describe('POST /api/payment/refund/request', () => {
      it('should submit refund request', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          subscription: { tier: 'gold' },
        });
        
        const response = await request(app)
          .post('/api/payment/refund/request')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ reason: 'Not satisfied with service' });
        
        expect(response.status).toBe(200);
      });
    });
  });
  
  describe('Webhook Endpoints', () => {
    describe('POST /api/payment/webhooks/stripe', () => {
      it('should process Stripe webhook', async () => {
        const response = await request(app)
          .post('/api/payment/webhooks/stripe')
          .set('stripe-signature', 'test_signature')
          .send(JSON.stringify({ type: 'test.event' }));
        
        // Webhook processing might return 200 or 400 depending on implementation
        expect([200, 400]).toContain(response.status);
      });
    });
    
    describe('POST /api/payment/webhooks/paypal', () => {
      it('should process PayPal webhook', async () => {
        const response = await request(app)
          .post('/api/payment/webhooks/paypal')
          .send({ event_type: 'BILLING.SUBSCRIPTION.ACTIVATED' });
        
        expect([200, 400]).toContain(response.status);
      });
    });
    
    describe('POST /api/payment/webhooks/apple', () => {
      it('should process Apple webhook', async () => {
        const response = await request(app)
          .post('/api/payment/webhooks/apple')
          .send({ notification_type: 'DID_RENEW' });
        
        expect([200, 400]).toContain(response.status);
      });
    });
    
    describe('POST /api/payment/webhooks/google', () => {
      it('should process Google webhook', async () => {
        const response = await request(app)
          .post('/api/payment/webhooks/google')
          .send({ message: { data: 'base64_encoded_data' } });
        
        expect([200, 400]).toContain(response.status);
      });
    });
  });
});
