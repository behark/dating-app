const Match = require('../domain/Match');

class MatchRepository {
  async findById(id) {
    return Match.findById(id);
  }

  async findByIdWithUsers(id) {
    return Match.findById(id).populate('users', 'name photos age bio lastActive');
  }

  async findByUsers(userId1, userId2) {
    const [user1, user2] = [userId1, userId2].sort();
    return Match.findOne({ user1, user2 });
  }

  async create(matchData) {
    const match = new Match(matchData);
    return match.save();
  }

  async createMatch(userId1, userId2, matchType = 'regular', initiatorId) {
    const [user1, user2] = [userId1, userId2].sort((a, b) => a.toString().localeCompare(b.toString()));
    
    const existingMatch = await Match.findOne({ user1, user2 });
    if (existingMatch) return { match: existingMatch, isNew: false };

    const match = new Match({
      users: [user1, user2],
      user1,
      user2,
      matchType,
      matchInitiator: initiatorId,
      status: 'active',
    });

    await match.save();
    return { match, isNew: true };
  }

  async getUserMatches(userId, options = {}) {
    const { status = 'active', limit = 50, skip = 0, sortBy = 'lastActivityAt' } = options;
    
    return Match.find({
      users: userId,
      status,
    })
      .sort({ [sortBy]: -1 })
      .skip(skip)
      .limit(limit)
      .populate('users', 'name photos age bio lastActive');
  }

  async getActiveMatchCount(userId) {
    return Match.countDocuments({ users: userId, status: 'active' });
  }

  async unmatch(matchId, userId) {
    return Match.findByIdAndUpdate(
      matchId,
      {
        status: 'unmatched',
        unmatchedBy: userId,
        unmatchedAt: new Date(),
      },
      { new: true }
    );
  }

  async updateConversationStarted(matchId, userId) {
    return Match.findByIdAndUpdate(
      matchId,
      {
        conversationStarted: true,
        firstMessageAt: new Date(),
        firstMessageBy: userId,
        lastActivityAt: new Date(),
      },
      { new: true }
    );
  }

  async incrementMessageCount(matchId) {
    return Match.findByIdAndUpdate(
      matchId,
      {
        $inc: { messageCount: 1 },
        lastActivityAt: new Date(),
      },
      { new: true }
    );
  }

  async getMatchStats(userId) {
    const [totalMatches, activeMatches, conversationsStarted] = await Promise.all([
      Match.countDocuments({ users: userId }),
      Match.countDocuments({ users: userId, status: 'active' }),
      Match.countDocuments({ users: userId, conversationStarted: true }),
    ]);
    return { totalMatches, activeMatches, conversationsStarted };
  }

  async deleteByUser(userId) {
    return Match.deleteMany({ users: userId });
  }
}

module.exports = new MatchRepository();
