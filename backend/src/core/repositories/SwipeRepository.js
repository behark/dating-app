const Swipe = require('../domain/Swipe');

class SwipeRepository {
  async findById(id) {
    return Swipe.findById(id);
  }

  async findByUsers(swiperId, swipedId) {
    return Swipe.findOne({ swiperId, swipedId });
  }

  async createAtomic(swipeData) {
    return Swipe.createSwipeAtomic(swipeData);
  }

  async create(swipeData) {
    const swipe = new Swipe(swipeData);
    return swipe.save();
  }

  async getSwipedUserIds(userId) {
    const swipes = await Swipe.find({ swiperId: userId }).select('swipedId');
    return swipes.map(s => s.swipedId);
  }

  async getUsersWhoLiked(userId, options = {}) {
    const { limit = 50, skip = 0 } = options;
    return Swipe.find({
      swipedId: userId,
      action: { $in: ['like', 'superlike'] },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('swiperId', 'name photos age bio');
  }

  async checkMutualLike(userId1, userId2) {
    const [swipe1, swipe2] = await Promise.all([
      Swipe.findOne({ swiperId: userId1, swipedId: userId2, action: { $in: ['like', 'superlike'] } }),
      Swipe.findOne({ swiperId: userId2, swipedId: userId1, action: { $in: ['like', 'superlike'] } }),
    ]);
    return { swipe1, swipe2, isMutual: !!(swipe1 && swipe2) };
  }

  async getSwipeStats(userId) {
    const [totalLikes, totalPasses, receivedLikes] = await Promise.all([
      Swipe.countDocuments({ swiperId: userId, action: 'like' }),
      Swipe.countDocuments({ swiperId: userId, action: 'pass' }),
      Swipe.countDocuments({ swipedId: userId, action: { $in: ['like', 'superlike'] } }),
    ]);
    return { totalLikes, totalPasses, receivedLikes };
  }

  async deleteByUser(userId) {
    return Swipe.deleteMany({
      $or: [{ swiperId: userId }, { swipedId: userId }],
    });
  }

  async getSuperLikeCount(userId, since = null) {
    const query = { swiperId: userId, action: 'superlike' };
    if (since) query.createdAt = { $gte: since };
    return Swipe.countDocuments(query);
  }
}

module.exports = new SwipeRepository();
