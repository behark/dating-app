/**
 * SwipeController Tests
 * Tests swipe actions (like, pass, superlike) and match detection
 */
import { SwipeController } from '../SwipeController';
import api from '../api';
import { Swipe } from '../../types/models/Swipe';

// Mock the api module
jest.mock('../api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
}));

describe('SwipeController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Swipe Validation (via Swipe.validate)', () => {
    it('should reject swipe on yourself', () => {
      const result = Swipe.validate('user1', 'user1', 'like');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('same user');
    });

    it('should reject invalid swipe type', () => {
      const result = Swipe.validate('user1', 'user2', 'invalid');
      expect(result.isValid).toBe(false);
    });

    it('should accept valid like swipe', () => {
      const result = Swipe.validate('user1', 'user2', 'like');
      expect(result.isValid).toBe(true);
    });

    it('should accept valid superlike swipe', () => {
      const result = Swipe.validate('user1', 'user2', 'superlike');
      expect(result.isValid).toBe(true);
    });

    it('should accept valid dislike swipe', () => {
      const result = Swipe.validate('user1', 'user2', 'dislike');
      expect(result.isValid).toBe(true);
    });
  });

  describe('saveSwipe', () => {
    // Mock checkSwipeLimit to always allow
    beforeEach(() => {
      jest.spyOn(SwipeController, 'checkSwipeLimit').mockResolvedValue({
        canSwipe: true,
        remaining: 99,
      });
    });

    it('should save a like swipe successfully', async () => {
      api.post.mockResolvedValueOnce({
        success: true,
        data: {
          swipeId: 'swipe123',
          isMatch: false,
          matchId: null,
        },
      });

      const result = await SwipeController.saveSwipe('user1', 'user2', 'like');

      expect(result.success).toBe(true);
      expect(result.match).toBe(false);
      expect(api.post).toHaveBeenCalledWith('/swipes', {
        targetId: 'user2',
        action: 'like',
      });
    });

    it('should map dislike to pass for backend', async () => {
      api.post.mockResolvedValueOnce({
        success: true,
        data: { swipeId: 'swipe124', isMatch: false },
      });

      await SwipeController.saveSwipe('user1', 'user2', 'dislike');

      expect(api.post).toHaveBeenCalledWith('/swipes', {
        targetId: 'user2',
        action: 'pass',
      });
    });

    it('should detect a match on mutual like', async () => {
      api.post.mockResolvedValueOnce({
        success: true,
        data: {
          swipeId: 'swipe125',
          isMatch: true,
          matchId: 'match456',
        },
      });

      const result = await SwipeController.saveSwipe('user1', 'user2', 'like');

      expect(result.success).toBe(true);
      expect(result.match).toBe(true);
      expect(result.matchId).toBe('match456');
    });

    it('should handle superlike action', async () => {
      api.post.mockResolvedValueOnce({
        success: true,
        data: { swipeId: 'swipe126', isMatch: false },
      });

      await SwipeController.saveSwipe('user1', 'user2', 'superlike');

      expect(api.post).toHaveBeenCalledWith('/swipes', {
        targetId: 'user2',
        action: 'superlike',
      });
    });

    it('should return error when daily swipe limit is reached', async () => {
      SwipeController.checkSwipeLimit.mockResolvedValueOnce({
        canSwipe: false,
        remaining: 0,
      });

      const result = await SwipeController.saveSwipe('user1', 'user2', 'like');

      expect(result.success).toBe(false);
      expect(result.limitExceeded).toBe(true);
      expect(api.post).not.toHaveBeenCalled();
    });

    it('should return validation error for invalid input', async () => {
      const result = await SwipeController.saveSwipe('user1', 'user1', 'like');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(api.post).not.toHaveBeenCalled();
    });

    it('should handle API failure gracefully', async () => {
      api.post.mockRejectedValueOnce(new Error('Network error'));

      const result = await SwipeController.saveSwipe('user1', 'user2', 'like');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });
});
