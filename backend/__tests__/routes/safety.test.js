const express = require('express');
const request = require('supertest');
const net = require('net');

jest.mock('../../src/api/controllers/safetyController', () => ({
  reportUser: jest.fn((req, res) => res.status(201).json({ success: true })),
  getReports: jest.fn((req, res) => res.status(200).json({ success: true })),
  reviewReport: jest.fn((req, res) => res.status(200).json({ success: true })),
  blockUser: jest.fn((req, res) => res.status(200).json({ success: true })),
  unblockUser: jest.fn((req, res) => res.status(200).json({ success: true })),
  getBlockedUsers: jest.fn((req, res) => res.status(200).json({ success: true })),
  checkIfBlocked: jest.fn((req, res) => res.status(200).json({ success: true })),
  flagContent: jest.fn((req, res) => res.status(200).json({ success: true })),
  getSafetyScore: jest.fn((req, res) => res.status(200).json({ success: true })),
  getSafetyTips: jest.fn((req, res) => res.status(200).json({ success: true, tips: [] })),
  suspendUser: jest.fn((req, res) => res.status(200).json({ success: true })),
  unsuspendUser: jest.fn((req, res) => res.status(200).json({ success: true })),
  getAccountStatus: jest.fn((req, res) => res.status(200).json({ success: true })),
  appealSuspension: jest.fn((req, res) => res.status(200).json({ success: true })),
}));

jest.mock('../../src/api/controllers/safetyAdvancedController', () => ({
  shareDatePlan: jest.fn((req, res) => res.status(201).json({ success: true })),
  getActiveDatePlans: jest.fn((req, res) => res.status(200).json({ success: true })),
  getSharedDatePlans: jest.fn((req, res) => res.status(200).json({ success: true })),
  updateDatePlan: jest.fn((req, res) => res.status(200).json({ success: true })),
  startCheckIn: jest.fn((req, res) => res.status(201).json({ success: true })),
  getActiveCheckIns: jest.fn((req, res) => res.status(200).json({ success: true })),
  completeCheckIn: jest.fn((req, res) => res.status(200).json({ success: true })),
  sendEmergencySOS: jest.fn((req, res) => res.status(201).json({ success: true })),
  getActiveSOS: jest.fn((req, res) => res.status(200).json({ success: true })),
  respondToSOS: jest.fn((req, res) => res.status(200).json({ success: true })),
  resolveSOS: jest.fn((req, res) => res.status(200).json({ success: true })),
  initiateBackgroundCheck: jest.fn((req, res) => res.status(201).json({ success: true })),
  getBackgroundCheckStatus: jest.fn((req, res) => res.status(200).json({ success: true })),
  updateBackgroundCheck: jest.fn((req, res) => res.status(200).json({ success: true })),
  addEmergencyContact: jest.fn((req, res) => res.status(201).json({ success: true })),
  getEmergencyContacts: jest.fn((req, res) => res.status(200).json({ success: true })),
  deleteEmergencyContact: jest.fn((req, res) => res.status(200).json({ success: true })),
  submitAdvancedPhotoVerification: jest.fn((req, res) => res.status(200).json({ success: true })),
  getPhotoVerificationStatus: jest.fn((req, res) => res.status(200).json({ success: true })),
}));

jest.mock('../../src/api/middleware/auth', () => ({
  authenticateToken: jest.fn((req, res, next) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ success: false });
    }
    req.user = { _id: 'user_1', role: req.headers['x-role'] || 'user' };
    next();
  }),
  isAdmin: jest.fn((req, res, next) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false });
    }
    next();
  }),
}));

const safetyController = require('../../src/api/controllers/safetyController');
const safetyAdvancedController = require('../../src/api/controllers/safetyAdvancedController');

// Detect whether this environment allows binding sockets (sandbox-safe skip)
let canListen = true;
const skipIfNoListen = () => {
  if (!canListen) {
    pending('Port binding not permitted in this environment; skipping route tests.');
    return true;
  }
  return false;
};

beforeAll(async () => {
  canListen = await new Promise((resolve) => {
    const srv = net.createServer();
    srv.once('error', () => resolve(false));
    srv.listen(0, '127.0.0.1', () => srv.close(() => resolve(true)));
  });
});

const createServerAndAgent = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/safety', require('../../routes/safety'));
  const server = app.listen(0, '127.0.0.1');
  const agent = request.agent(server);
  return { server, agent };
};

describe('safety routes', () => {
  let server;
  let agent;

  beforeAll(() => {
    const setup = createServerAndAgent();
    server = setup.server;
    agent = setup.agent;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  it('serves public safety tips', async () => {
    if (skipIfNoListen()) return;
    const res = await agent.get('/api/safety/tips');
    expect(res.status).toBe(200);
    expect(safetyController.getSafetyTips).toHaveBeenCalled();
  });

  it('requires auth for protected endpoints', async () => {
    if (skipIfNoListen()) return;
    const res = await agent.post('/api/safety/report').send({});
    expect(res.status).toBe(401);
  });

  it('routes core safety endpoints', async () => {
    if (skipIfNoListen()) return;
    const auth = { Authorization: 'Bearer token' };

    const report = await agent.post('/api/safety/report').set(auth).send({});
    const block = await agent.post('/api/safety/block').set(auth).send({});
    const unblock = await agent.delete('/api/safety/block/u2').set(auth);
    const blocked = await agent.get('/api/safety/blocked').set(auth);
    const blockedOne = await agent.get('/api/safety/blocked/u2').set(auth);
    const flag = await agent.post('/api/safety/flag').set(auth).send({});
    const status = await agent.get('/api/safety/account-status').set(auth);
    const appeal = await agent.post('/api/safety/appeal').set(auth).send({});

    expect(report.status).toBe(201);
    expect(block.status).toBe(200);
    expect(unblock.status).toBe(200);
    expect(blocked.status).toBe(200);
    expect(blockedOne.status).toBe(200);
    expect(flag.status).toBe(200);
    expect(status.status).toBe(200);
    expect(appeal.status).toBe(200);
  });

  it('enforces admin-only endpoints', async () => {
    if (skipIfNoListen()) return;
    const userRes = await agent
      .get('/api/safety/reports')
      .set('Authorization', 'Bearer token');
    expect(userRes.status).toBe(403);

    const adminHeaders = { Authorization: 'Bearer token', 'x-role': 'admin' };
    const reports = await agent.get('/api/safety/reports').set(adminHeaders);
    const review = await agent
      .put('/api/safety/reports/r1/review')
      .set(adminHeaders)
      .send({});
    const score = await agent.get('/api/safety/safety-score/u1').set(adminHeaders);
    const suspend = await agent.put('/api/safety/suspend/u1').set(adminHeaders).send({});
    const unsuspend = await agent.put('/api/safety/unsuspend/u1').set(adminHeaders).send({});

    expect(reports.status).toBe(200);
    expect(review.status).toBe(200);
    expect(score.status).toBe(200);
    expect(suspend.status).toBe(200);
    expect(unsuspend.status).toBe(200);
  });

  it('routes advanced safety endpoints', async () => {
    if (skipIfNoListen()) return;
    const auth = { Authorization: 'Bearer token' };

    const datePlan = await agent.post('/api/safety/date-plan').set(auth).send({});
    const datePlanActive = await agent.get('/api/safety/date-plans/active').set(auth);
    const checkin = await request(app).post('/api/safety/checkin/start').set(auth).send({});
    const sos = await request(app).post('/api/safety/sos').set(auth).send({});
    const bg = await request(app).post('/api/safety/background-check').set(auth).send({});
    const contact = await request(app).post('/api/safety/emergency-contact').set(auth).send({});
    const verification = await request(app)
      .post('/api/safety/photo-verification/advanced')
      .set(auth)
      .send({});

    expect(datePlan.status).toBe(201);
    expect(datePlanActive.status).toBe(200);
    expect(checkin.status).toBe(201);
    expect(sos.status).toBe(201);
    expect(bg.status).toBe(201);
    expect(contact.status).toBe(201);
    expect(verification.status).toBe(200);
    expect(safetyAdvancedController.shareDatePlan).toHaveBeenCalled();
  });
});
