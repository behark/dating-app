const express = require('express');
const request = require('supertest');

jest.mock('../../src/api/controllers/paymentController', () => ({
  getSubscriptionTiers: jest.fn((req, res) => res.status(200).json({ success: true })),
  stripeWebhook: jest.fn((req, res) => res.status(200).json({ received: true })),
  paypalWebhook: jest.fn((req, res) => res.status(200).json({ received: true })),
  appleWebhook: jest.fn((req, res) => res.status(200).json({ received: true })),
  googleWebhook: jest.fn((req, res) => res.status(200).json({ received: true })),
  getPaymentStatus: jest.fn((req, res) => res.status(200).json({ success: true })),
  getBillingHistory: jest.fn((req, res) => res.status(200).json({ success: true })),
  createStripeCheckout: jest.fn((req, res) => res.status(200).json({ success: true })),
  createStripePaymentIntent: jest.fn((req, res) => res.status(200).json({ success: true })),
  createStripeSetupIntent: jest.fn((req, res) => res.status(200).json({ success: true })),
  getStripePortal: jest.fn((req, res) => res.status(200).json({ success: true })),
  createPayPalSubscription: jest.fn((req, res) => res.status(200).json({ success: true })),
  activatePayPalSubscription: jest.fn((req, res) => res.status(200).json({ success: true })),
  createPayPalOrder: jest.fn((req, res) => res.status(200).json({ success: true })),
  capturePayPalOrder: jest.fn((req, res) => res.status(200).json({ success: true })),
  validateAppleReceipt: jest.fn((req, res) => res.status(200).json({ success: true })),
  restoreApplePurchases: jest.fn((req, res) => res.status(200).json({ success: true })),
  validateGooglePurchase: jest.fn((req, res) => res.status(200).json({ success: true })),
  restoreGooglePurchases: jest.fn((req, res) => res.status(200).json({ success: true })),
  cancelSubscription: jest.fn((req, res) => res.status(200).json({ success: true })),
  resumeSubscription: jest.fn((req, res) => res.status(200).json({ success: true })),
  requestRefund: jest.fn((req, res) => res.status(200).json({ success: true })),
}));

jest.mock('../../src/api/middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    req.user = { _id: 'user_1' };
    next();
  }),
}));

const paymentController = require('../../src/api/controllers/paymentController');

const createAppAndAgent = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/payment', require('../../routes/payment'));
  const agent = request.agent(app);
  return { app, agent };
};

describe('payment routes', () => {
  let agent;

  beforeAll(() => {
    const setup = createAppAndAgent();
    agent = setup.agent;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('serves public tiers endpoint', async () => {
    const res = await agent.get('/api/payment/tiers');
    expect(res.status).toBe(200);
    expect(paymentController.getSubscriptionTiers).toHaveBeenCalled();
  });

  it('routes webhook endpoints without auth', async () => {
    const stripe = await agent
      .post('/api/payment/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .send({ id: 'evt_1' });
    const paypal = await agent.post('/api/payment/webhooks/paypal').send({ id: 'evt_2' });
    const apple = await agent.post('/api/payment/webhooks/apple').send({ id: 'evt_3' });
    const google = await agent.post('/api/payment/webhooks/google').send({ id: 'evt_4' });

    expect(stripe.status).toBe(200);
    expect(paypal.status).toBe(200);
    expect(apple.status).toBe(200);
    expect(google.status).toBe(200);
  });

  it('protects authenticated endpoints', async () => {
    const noAuth = await agent.get('/api/payment/status');
    expect(noAuth.status).toBe(401);

    const withAuth = await agent
      .get('/api/payment/status')
      .set('Authorization', 'Bearer token');
    expect(withAuth.status).toBe(200);
    expect(paymentController.getPaymentStatus).toHaveBeenCalled();
  });

  it('routes stripe endpoints', async () => {
    const checkout = await agent
      .post('/api/payment/stripe/checkout')
      .set('Authorization', 'Bearer token')
      .send({ planId: 'gold' });
    const intent = await agent
      .post('/api/payment/stripe/payment-intent')
      .set('Authorization', 'Bearer token')
      .send({ amount: 999 });
    const setup = await agent
      .post('/api/payment/stripe/setup-intent')
      .set('Authorization', 'Bearer token')
      .send({});
    const portal = await agent
      .get('/api/payment/stripe/portal')
      .set('Authorization', 'Bearer token');

    expect(checkout.status).toBe(200);
    expect(intent.status).toBe(200);
    expect(setup.status).toBe(200);
    expect(portal.status).toBe(200);
  });

  it('routes paypal/apple/google endpoints', async () => {
    const authHeader = { Authorization: 'Bearer token' };

    const paypalSub = await agent
      .post('/api/payment/paypal/subscription')
      .set(authHeader)
      .send({});
    const paypalOrder = await agent
      .post('/api/payment/paypal/order')
      .set(authHeader)
      .send({});
    const appleValidate = await agent
      .post('/api/payment/apple/validate')
      .set(authHeader)
      .send({});
    const googleValidate = await agent
      .post('/api/payment/google/validate')
      .set(authHeader)
      .send({});

    expect(paypalSub.status).toBe(200);
    expect(paypalOrder.status).toBe(200);
    expect(appleValidate.status).toBe(200);
    expect(googleValidate.status).toBe(200);
  });

  it('routes subscription management and refunds', async () => {
    const authHeader = { Authorization: 'Bearer token' };

    const cancel = await agent
      .post('/api/payment/subscription/cancel')
      .set(authHeader)
      .send({});
    const resume = await agent
      .post('/api/payment/subscription/resume')
      .set(authHeader)
      .send({});
    const refund = await agent.post('/api/payment/refund/request').set(authHeader).send({});

    expect(cancel.status).toBe(200);
    expect(resume.status).toBe(200);
    expect(refund.status).toBe(200);
    expect(paymentController.cancelSubscription).toHaveBeenCalled();
    expect(paymentController.resumeSubscription).toHaveBeenCalled();
    expect(paymentController.requestRefund).toHaveBeenCalled();
  });
});
