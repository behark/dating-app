/**
 * Swipe Controller Tests
 * Tests swipe endpoint: validation, limit checks, match detection
 */

jest.mock('../src/core/domain/User', () => {
  const User = jest.fn();
  User.findById = jest.fn();
  return User;
});

jest.mock('../src/core/domain/Swipe', () => {
  const Swipe = jest.fn();
  Swipe.canSwipe = jest.fn();
  return Swipe;
});

jest.mock('../src/core/domain/Match', () => {
  const Match = jest.fn();
  return Match;
});

jest.mock('../src/core/domain/Subscription', () => {
  const Subscription = jest.fn();
  Subscription.findOne = jest.fn();
  return Subscription;
});

jest.mock('../src/core/services/SwipeService', () => ({
  processSwipe: jest.fn(),
}));

jest.mock('../src/infrastructure/queues/QueueService', () => ({
  sendPushNotification: jest.fn(),
}));

jest.mock('../src/infrastructure/cache/CacheService', () => ({
  invalidate: jest.fn(),
}));

jest.mock('../src/infrastructure/external/LoggingService', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('mongoose', () => ({
  Types: {
    ObjectId: {
      isValid: jest.fn((id) => /^[a-f0-9]{24}$/.test(id)),
    },
  },
}));

const swipeController = require('../src/api/controllers/swipeController');
const User = require('../src/core/domain/User');
const Swipe = require('../src/core/domain/Swipe');
const Subscription = require('../src/core/domain/Subscription');
const SwipeService = require('../src/core/services/SwipeService');

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// The controller exports may vary; find the createSwipe handler
const createSwipe = swipeController.createSwipe || swipeController;

describe('swipeController.createSwipe', () => {
  const validSwiperId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
  const validTargetId = 'bbbbbbbbbbbbbbbbbbbbbbbb';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 when targetId is missing', async () => {
    const req = {
      body: { action: 'like' },
      user: { id: validSwiperId },
    };
    const res = mockResponse();

    await createSwipe(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 when action is missing', async () => {
    const req = {
      body: { targetId: validTargetId },
      user: { id: validSwiperId },
    };
    const res = mockResponse();

    await createSwipe(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 for invalid action type', async () => {
    const req = {
      body: { targetId: validTargetId, action: 'love' },
      user: { id: validSwiperId },
    };
    const res = mockResponse();

    await createSwipe(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 for invalid targetId format', async () => {
    const req = {
      body: { targetId: 'invalid-id', action: 'like' },
      user: { id: validSwiperId },
    };
    const res = mockResponse();

    await createSwipe(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 404 when target user does not exist', async () => {
    User.findById.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    });

    const req = {
      body: { targetId: validTargetId, action: 'like' },
      user: { id: validSwiperId },
    };
    const res = mockResponse();

    await createSwipe(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should return 429 when daily swipe limit is reached', async () => {
    User.findById.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: validTargetId }),
      }),
    });
    Subscription.findOne.mockResolvedValueOnce(null); // not premium
    Swipe.canSwipe.mockResolvedValueOnce({ canSwipe: false, remaining: 0 });

    const req = {
      body: { targetId: validTargetId, action: 'like' },
      user: { id: validSwiperId },
    };
    const res = mockResponse();

    await createSwipe(req, res);

    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('should process a valid like swipe and detect match', async () => {
    User.findById.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: validTargetId }),
      }),
    });
    Subscription.findOne.mockResolvedValueOnce(null);
    Swipe.canSwipe.mockResolvedValueOnce({ canSwipe: true, remaining: 49 });
    SwipeService.processSwipe.mockResolvedValueOnce({
      swipe: { id: 'swipe1', action: 'like' },
      isMatch: true,
      match: { _id: 'match1', users: [validSwiperId, validTargetId] },
      alreadyProcessed: false,
    });
    // Mock User.findById for swiperUser and swipedUser names
    User.findById
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ name: 'Alice' }),
        }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ name: 'Bob' }),
        }),
      });

    const req = {
      body: { targetId: validTargetId, action: 'like' },
      user: { id: validSwiperId },
    };
    const res = mockResponse();

    await createSwipe(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          isMatch: true,
        }),
      })
    );
  });
});
