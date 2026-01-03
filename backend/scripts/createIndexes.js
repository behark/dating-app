/**
 * Database Indexes Script
 * Creates optimized indexes for MongoDB collections
 * Run: npm run db:indexes
 */

const mongoose = require('mongoose');
require('dotenv').config();

const createIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dating-app');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // ==================== USER COLLECTION INDEXES ====================
    console.log('\n📊 Creating User indexes...');

    const usersCollection = db.collection('users');

    // Geospatial index for location-based discovery (most critical)
    await usersCollection.createIndex(
      { location: '2dsphere' },
      { name: 'location_2dsphere' }
    );

    // Compound index for discovery queries
    await usersCollection.createIndex(
      {
        isActive: 1,
        gender: 1,
        age: 1,
        location: '2dsphere'
      },
      { 
        name: 'discovery_compound',
        partialFilterExpression: { isActive: true }
      }
    );

    // Index for finding users by activity
    await usersCollection.createIndex(
      { lastActivityAt: -1, isActive: 1 },
      { name: 'activity_recent' }
    );

    // Index for premium users discovery
    await usersCollection.createIndex(
      { isPremium: 1, isVerified: 1, location: '2dsphere' },
      { name: 'premium_discovery' }
    );

    // Email lookup (unique)
    await usersCollection.createIndex(
      { email: 1 },
      { unique: true, name: 'email_unique' }
    );

    // Phone lookup (sparse unique)
    await usersCollection.createIndex(
      { phoneNumber: 1 },
      { unique: true, sparse: true, name: 'phone_unique' }
    );

    // OAuth provider lookups
    await usersCollection.createIndex(
      { googleId: 1 },
      { sparse: true, name: 'google_oauth' }
    );
    await usersCollection.createIndex(
      { facebookId: 1 },
      { sparse: true, name: 'facebook_oauth' }
    );
    await usersCollection.createIndex(
      { appleId: 1 },
      { sparse: true, name: 'apple_oauth' }
    );

    // Top picks scoring
    await usersCollection.createIndex(
      { activityScore: -1, isActive: 1, isPremium: 1 },
      { name: 'top_picks_score' }
    );

    // Verification status queries
    await usersCollection.createIndex(
      { verificationStatus: 1, isActive: 1 },
      { name: 'verification_lookup' }
    );

    // Received likes queries (for premium feature)
    await usersCollection.createIndex(
      { 'receivedLikes.receivedAt': -1 },
      { name: 'received_likes_recent' }
    );

    console.log('✅ User indexes created');

    // ==================== SWIPE COLLECTION INDEXES ====================
    console.log('\n📊 Creating Swipe indexes...');

    const swipesCollection = db.collection('swipes');

    // Primary swipe lookup (unique per user pair)
    await swipesCollection.createIndex(
      { swiperId: 1, swipedId: 1 },
      { unique: true, name: 'swipe_pair_unique' }
    );

    // Finding all swipes by a user
    await swipesCollection.createIndex(
      { swiperId: 1, createdAt: -1 },
      { name: 'swiper_recent' }
    );

    // Finding who swiped on a user
    await swipesCollection.createIndex(
      { swipedId: 1, action: 1, createdAt: -1 },
      { name: 'swiped_action' }
    );

    // Match detection (mutual likes)
    await swipesCollection.createIndex(
      { swiperId: 1, swipedId: 1, action: 1 },
      { name: 'match_detection' }
    );

    // SuperLike queries
    await swipesCollection.createIndex(
      { action: 1, swipedId: 1, createdAt: -1 },
      { 
        name: 'superlike_lookup',
        partialFilterExpression: { action: 'superlike' }
      }
    );

    // Priority likes
    await swipesCollection.createIndex(
      { isPriority: 1, swipedId: 1, createdAt: -1 },
      { 
        name: 'priority_likes',
        partialFilterExpression: { isPriority: true }
      }
    );

    // TTL index for auto-expiry
    await swipesCollection.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 2592000, name: 'swipe_ttl' }
    );

    console.log('✅ Swipe indexes created');

    // ==================== MESSAGE COLLECTION INDEXES ====================
    console.log('\n📊 Creating Message indexes...');

    const messagesCollection = db.collection('messages');

    // Conversation messages lookup
    await messagesCollection.createIndex(
      { matchId: 1, createdAt: -1 },
      { name: 'conversation_messages' }
    );

    // Unread messages count
    await messagesCollection.createIndex(
      { receiverId: 1, isRead: 1, matchId: 1 },
      { 
        name: 'unread_messages',
        partialFilterExpression: { isRead: false }
      }
    );

    // User's messages (sent and received)
    await messagesCollection.createIndex(
      { senderId: 1, createdAt: -1 },
      { name: 'sender_messages' }
    );
    await messagesCollection.createIndex(
      { receiverId: 1, createdAt: -1 },
      { name: 'receiver_messages' }
    );

    // Media messages
    await messagesCollection.createIndex(
      { type: 1, matchId: 1, createdAt: -1 },
      { 
        name: 'media_messages',
        partialFilterExpression: { type: { $in: ['image', 'gif', 'voice', 'video_call'] } }
      }
    );

    // Message search (text index)
    await messagesCollection.createIndex(
      { content: 'text' },
      { name: 'message_text_search' }
    );

    console.log('✅ Message indexes created');

    // ==================== SUBSCRIPTION COLLECTION INDEXES ====================
    console.log('\n📊 Creating Subscription indexes...');

    const subscriptionsCollection = db.collection('subscriptions');

    // Active subscriptions lookup
    await subscriptionsCollection.createIndex(
      { userId: 1, status: 1 },
      { name: 'user_subscription_status' }
    );

    // Expiring subscriptions
    await subscriptionsCollection.createIndex(
      { expiresAt: 1, status: 1 },
      { name: 'expiring_subscriptions' }
    );

    console.log('✅ Subscription indexes created');

    // ==================== REPORT COLLECTION INDEXES ====================
    console.log('\n📊 Creating Report indexes...');

    const reportsCollection = db.collection('reports');

    // Reported user lookup
    await reportsCollection.createIndex(
      { reportedUserId: 1, status: 1, createdAt: -1 },
      { name: 'reported_user_lookup' }
    );

    // Reporter lookup
    await reportsCollection.createIndex(
      { reporterId: 1, createdAt: -1 },
      { name: 'reporter_history' }
    );

    // Pending reports for moderation
    await reportsCollection.createIndex(
      { status: 1, createdAt: 1 },
      { 
        name: 'pending_reports',
        partialFilterExpression: { status: 'pending' }
      }
    );

    console.log('✅ Report indexes created');

    // ==================== BLOCK COLLECTION INDEXES ====================
    console.log('\n📊 Creating Block indexes...');

    const blocksCollection = db.collection('blocks');

    // Block lookup
    await blocksCollection.createIndex(
      { blockerId: 1, blockedId: 1 },
      { unique: true, name: 'block_pair_unique' }
    );

    // User's blocked list
    await blocksCollection.createIndex(
      { blockerId: 1, createdAt: -1 },
      { name: 'blocker_list' }
    );

    console.log('✅ Block indexes created');

    // ==================== USER ACTIVITY COLLECTION INDEXES ====================
    console.log('\n📊 Creating UserActivity indexes...');

    const userActivityCollection = db.collection('useractivities');

    // User activity timeline
    await userActivityCollection.createIndex(
      { userId: 1, createdAt: -1 },
      { name: 'user_activity_timeline' }
    );

    // Activity type lookup
    await userActivityCollection.createIndex(
      { userId: 1, activityType: 1, createdAt: -1 },
      { name: 'user_activity_type' }
    );

    // TTL for old activities
    await userActivityCollection.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 7776000, name: 'activity_ttl' } // 90 days
    );

    console.log('✅ UserActivity indexes created');

    // ==================== EVENT COLLECTION INDEXES ====================
    console.log('\n📊 Creating Event indexes...');

    const eventsCollection = db.collection('events');

    // Location-based event discovery
    await eventsCollection.createIndex(
      { location: '2dsphere', date: 1 },
      { name: 'event_location' }
    );

    // Upcoming events
    await eventsCollection.createIndex(
      { date: 1, isActive: 1 },
      { name: 'upcoming_events' }
    );

    // User's events
    await eventsCollection.createIndex(
      { creatorId: 1, date: -1 },
      { name: 'creator_events' }
    );

    console.log('✅ Event indexes created');

    // ==================== SUPERLIKE COLLECTION INDEXES ====================
    console.log('\n📊 Creating SuperLike indexes...');

    const superlikesCollection = db.collection('superlikes');

    await superlikesCollection.createIndex(
      { fromUserId: 1, createdAt: -1 },
      { name: 'superlike_sent' }
    );

    await superlikesCollection.createIndex(
      { toUserId: 1, isRead: 1, createdAt: -1 },
      { name: 'superlike_received' }
    );

    console.log('✅ SuperLike indexes created');

    // ==================== BOOST PROFILE COLLECTION INDEXES ====================
    console.log('\n📊 Creating BoostProfile indexes...');

    const boostsCollection = db.collection('boostprofiles');

    // Active boosts
    await boostsCollection.createIndex(
      { userId: 1, isActive: 1, expiresAt: 1 },
      { name: 'active_boosts' }
    );

    // Expiring boosts
    await boostsCollection.createIndex(
      { expiresAt: 1, isActive: 1 },
      { name: 'expiring_boosts' }
    );

    console.log('✅ BoostProfile indexes created');

    // ==================== TOP PICKS COLLECTION INDEXES ====================
    console.log('\n📊 Creating TopPicks indexes...');

    const topPicksCollection = db.collection('toppicks');

    await topPicksCollection.createIndex(
      { forUserId: 1, generatedAt: -1 },
      { name: 'user_top_picks' }
    );

    await topPicksCollection.createIndex(
      { generatedAt: 1 },
      { expireAfterSeconds: 86400, name: 'top_picks_ttl' } // 24 hours
    );

    console.log('✅ TopPicks indexes created');

    // ==================== PRINT INDEX STATS ====================
    console.log('\n📊 Index Statistics:');
    
    const collections = ['users', 'swipes', 'messages', 'subscriptions', 'reports', 'blocks', 'useractivities', 'events', 'superlikes', 'boostprofiles', 'toppicks'];
    
    for (const collName of collections) {
      try {
        const coll = db.collection(collName);
        const indexes = await coll.indexes();
        console.log(`  ${collName}: ${indexes.length} indexes`);
      } catch (e) {
        console.log(`  ${collName}: Collection does not exist yet`);
      }
    }

    console.log('\n✅ All indexes created successfully!');
    
  } catch (error) {
    console.error('Error creating indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

// Run if called directly
if (require.main === module) {
  createIndexes();
}

module.exports = { createIndexes };
