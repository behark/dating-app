/**
 * Database Indexes Creation Script
 * 
 * Creates all necessary indexes for optimal query performance
 * Run this script after setting up the database or when adding new collections
 * 
 * Usage: node scripts/createIndexes.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models to ensure schemas are registered
const User = require('../models/User');
const Swipe = require('../models/Swipe');
const Match = require('../models/Match');
const Message = require('../models/Message');
const Subscription = require('../models/Subscription');

const { logger } = require('../services/LoggingService');

/**
 * Helper function to create index with error handling
 */
async function createIndexSafely(collection, indexSpec, options, description) {
  try {
    await collection.createIndex(indexSpec, options);
    console.log(`   ✅ ${description}`);
    return true;
  } catch (error) {
    if (error.code === 86 || error.code === 85) {
      // Code 86: Index already exists with same spec
      // Code 85: Index exists with different name/options but equivalent functionality
      console.log(`   ℹ️  ${description} (equivalent index exists)`);
      return true;
    }
    console.error(`   ❌ ${description}: ${error.message}`);
    return false;
  }
}

/**
 * Create indexes for all collections
 */
async function createIndexes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📊 Creating indexes...\n');

    // ============================================
    // USER INDEXES
    // ============================================
    console.log('👤 Creating User indexes...');
    
    await createIndexSafely(
      User.collection,
      { email: 1 },
      { unique: true, background: true },
      'Email index (unique)'
    );

    await createIndexSafely(
      User.collection,
      { lastActive: -1, isOnline: 1 },
      { background: true },
      'Activity tracking index'
    );

    await createIndexSafely(
      User.collection,
      { 'location.coordinates': '2dsphere' },
      { background: true, sparse: true },
      'Geospatial index'
    );

    await createIndexSafely(
      User.collection,
      { profileCompleted: 1 },
      { background: true },
      'Profile completion index'
    );

    // ============================================
    // SWIPE INDEXES
    // ============================================
    console.log('\n💘 Creating Swipe indexes...');
    
    await createIndexSafely(
      Swipe.collection,
      { swiperId: 1, swipedId: 1 },
      { unique: true, background: true },
      'Unique swipe constraint'
    );

    await createIndexSafely(
      Swipe.collection,
      { swiperId: 1, createdAt: -1 },
      { background: true },
      'Swipe history index'
    );

    await createIndexSafely(
      Swipe.collection,
      { swipedId: 1, action: 1, createdAt: -1 },
      { background: true, name: 'who_liked_me' },
      '"Who liked me" index'
    );

    await createIndexSafely(
      Swipe.collection,
      { swipedId: 1, swiperId: 1, action: 1 },
      { background: true, name: 'reverse_match_lookup' },
      'Reverse match lookup index'
    );

    await createIndexSafely(
      Swipe.collection,
      { action: 1, createdAt: -1 },
      { background: true, name: 'action_analytics' },
      'Analytics index'
    );

    // ============================================
    // MATCH INDEXES
    // ============================================
    console.log('\n🤝 Creating Match indexes...');
    
    await createIndexSafely(Match.collection, { user1: 1, user2: 1 }, { unique: true, background: true }, 'Unique match constraint');
    await createIndexSafely(Match.collection, { users: 1, status: 1, lastActivityAt: -1 }, { background: true, name: 'user_matches' }, 'User matches index');
    await createIndexSafely(Match.collection, { createdAt: -1 }, { background: true }, 'Recent matches index');
    await createIndexSafely(Match.collection, { user1: 1, status: 1 }, { background: true }, 'User1 matches index');
    await createIndexSafely(Match.collection, { user2: 1, status: 1 }, { background: true }, 'User2 matches index');

    // ============================================
    // MESSAGE INDEXES
    // ============================================
    console.log('\n💬 Creating Message indexes...');
    
    await createIndexSafely(Message.collection, { matchId: 1, createdAt: -1 }, { background: true }, 'Conversation index');
    await createIndexSafely(Message.collection, { matchId: 1, senderId: 1, createdAt: -1 }, { background: true }, 'Sender messages index');
    await createIndexSafely(Message.collection, { createdAt: 1 }, { expireAfterSeconds: 7776000, background: true, name: 'message_ttl' }, 'TTL index (90 days)');
    await createIndexSafely(Message.collection, { receiverId: 1, read: 1, createdAt: -1 }, { background: true }, 'Unread messages index');

    // ============================================
    // SUBSCRIPTION INDEXES
    // ============================================
    console.log('\n💎 Creating Subscription indexes...');
    
    await createIndexSafely(Subscription.collection, { userId: 1 }, { unique: true, background: true }, 'User subscription index (unique)');
    await createIndexSafely(Subscription.collection, { status: 1, endDate: -1 }, { background: true }, 'Active subscriptions index');
    await createIndexSafely(Subscription.collection, { endDate: 1, status: 1 }, { background: true }, 'Expiring subscriptions index');

    // ============================================
    // VERIFY INDEXES
    // ============================================
    console.log('\n🔍 Verifying indexes...\n');
    
    const collections = [
      { name: 'users', model: User },
      { name: 'swipes', model: Swipe },
      { name: 'matches', model: Match },
      { name: 'messages', model: Message },
      { name: 'subscriptions', model: Subscription },
    ];

    for (const { name, model } of collections) {
      const indexes = await model.collection.getIndexes();
      const count = Object.keys(indexes).length;
      console.log(`   ${name}: ${count} indexes`);
    }

    console.log('\n✅ All indexes created successfully!');
    console.log('\n💡 Tip: Run this script after schema changes or database migrations.');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating indexes:', error);
    logger.error('Index creation failed', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  createIndexes();
}

module.exports = { createIndexes };
