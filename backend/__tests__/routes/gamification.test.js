const express = require('express');
const request = require('supertest');

const ok = (name) =>
  jest.fn((req, res) =>
    res.status(200).json({ success: true, route: name, userId: req.params.userId || null })
  );

const gamificationController = {
  trackSwipe: ok('trackSwipe'),
  getSwipeStreak: ok('getSwipeStreak'),
  getStreakLeaderboard: ok('getStreakLeaderboard'),
  getLongestStreakLeaderboard: ok('getLongestStreakLeaderboard'),
  awardBadge: ok('awardBadge'),
  getUserBadges: ok('getUserBadges'),
  updateUserBadges: ok('updateUserBadges'),
  getDailyReward: ok('getDailyReward'),
  claimReward: ok('claimReward'),
  getUserStats: ok('getUserStats'),
  getUserLevel: ok('getUserLevel'),
  addXP: ok('addXP'),
  getLevelRewards: ok('getLevelRewards'),
  getDailyChallenges: ok('getDailyChallenges'),
  updateChallengeProgress: ok('updateChallengeProgress'),
  trackChallengeAction: ok('trackChallengeAction'),
  claimChallengeReward: ok('claimChallengeReward'),
  getCompletionBonus: ok('getCompletionBonus'),
  claimCompletionBonus: ok('claimCompletionBonus'),
  getUserAchievements: ok('getUserAchievements'),
  checkAchievements: ok('checkAchievements'),
  unlockAchievement: ok('unlockAchievement'),
  getAchievementProgress: ok('getAchievementProgress'),
  getRecentAchievements: ok('getRecentAchievements'),
};

jest.mock('../../src/api/controllers/gamificationController', () => gamificationController);

jest.mock('../../src/api/middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    req.user = { _id: 'user_1' };
    next();
  }),
}));

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/gamification', require('../../routes/gamification'));
  return app;
};

describe('gamification routes', () => {
  let app;
  const auth = { Authorization: 'Bearer token' };

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/gamification/stats/u1');
    expect(res.status).toBe(401);
  });

  it('serves streak and leaderboard endpoints', async () => {
    const streak = await request(app).get('/api/gamification/streaks/u1').set(auth);
    const track = await request(app).post('/api/gamification/streaks/track').set(auth).send({});
    const leaderboard = await request(app).get('/api/gamification/leaderboards/streaks').set(auth);

    expect(streak.status).toBe(200);
    expect(track.status).toBe(200);
    expect(leaderboard.status).toBe(200);
    expect(gamificationController.getSwipeStreak).toHaveBeenCalled();
    expect(gamificationController.trackSwipe).toHaveBeenCalled();
  });

  it('serves badges, rewards, stats and levels endpoints', async () => {
    const badges = await request(app).get('/api/gamification/badges/u1').set(auth);
    const rewards = await request(app).get('/api/gamification/rewards/u1').set(auth);
    const stats = await request(app).get('/api/gamification/stats/u1').set(auth);
    const level = await request(app).get('/api/gamification/levels/u1').set(auth);

    expect(badges.status).toBe(200);
    expect(rewards.status).toBe(200);
    expect(stats.status).toBe(200);
    expect(level.status).toBe(200);
  });

  it('serves challenge and achievement endpoints', async () => {
    const challenges = await request(app).get('/api/gamification/challenges/daily/u1').set(auth);
    const claimBonus = await request(app)
      .post('/api/gamification/challenges/bonus/u1/claim')
      .set(auth);
    const achievements = await request(app).get('/api/gamification/achievements/u1').set(auth);
    const progress = await request(app)
      .get('/api/gamification/achievements/u1/a1/progress')
      .set(auth);

    expect(challenges.status).toBe(200);
    expect(claimBonus.status).toBe(200);
    expect(achievements.status).toBe(200);
    expect(progress.status).toBe(200);
  });
});
