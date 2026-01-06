/**
 * Database Migration: Add Indexes for Retention Queries
 * TD-003: Add database indexes for retention queries
 *
 * This script adds optimized indexes for analytics and retention queries
 * to improve query performance significantly.
 *
 * Run: node backend/scripts/add-retention-indexes.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Index definitions for retention and analytics queries
const INDEXES_TO_CREATE = [
  // UserActivity collection indexes for retention queries
  {
    collection: 'useractivities',
    indexes: [
      // Optimized index for DAU/WAU/MAU queries
      // Supports: UserActivity.distinct('userId', { createdAt: { $gte, $lte } })
      {
        name: 'createdAt_userId_compound',
        keys: { createdAt: -1, userId: 1 },
        options: { background: true },
      },
      // Index for retention cohort queries
      // Supports: UserActivity.distinct('userId', { userId: { $in }, createdAt: { $gte, $lte } })
      {
        name: 'userId_createdAt_retention',
        keys: { userId: 1, createdAt: 1 },
        options: { background: true },
      },
    ],
  },
  // User collection indexes for cohort registration queries
  {
    collection: 'users',
    indexes: [
      // Index for cohort registration date queries
      // Supports: User.find({ createdAt: { $gte, $lte } })
      {
        name: 'createdAt_desc',
        keys: { createdAt: -1 },
        options: { background: true },
      },
      // Compound index for retention eligible users query
      // Supports: User.countDocuments({ _id: { $in }, createdAt: { $lt } })
      {
        name: 'createdAt_id_retention',
        keys: { createdAt: 1, _id: 1 },
        options: { background: true },
      },
    ],
  },
  // Subscription collection indexes for premium metrics
  {
    collection: 'subscriptions',
    indexes: [
      // Index for premium conversion queries
      {
        name: 'createdAt_status',
        keys: { createdAt: -1, status: 1 },
        options: { background: true },
      },
      // Index for churn rate queries
      {
        name: 'cancelledAt_status',
        keys: { cancelledAt: -1, status: 1 },
        options: { background: true, sparse: true },
      },
    ],
  },
  // Swipe collection indexes for match metrics
  {
    collection: 'swipes',
    indexes: [
      // Index for match rate queries
      {
        name: 'action_createdAt',
        keys: { action: 1, createdAt: -1 },
        options: { background: true },
      },
      // Compound index for mutual like lookup (match detection)
      {
        name: 'swiperId_swipedId_action',
        keys: { swiperId: 1, swipedId: 1, action: 1 },
        options: { background: true },
      },
    ],
  },
  // Message collection indexes for messaging metrics
  {
    collection: 'messages',
    indexes: [
      // Index for message response rate queries
      {
        name: 'matchId_createdAt',
        keys: { matchId: 1, createdAt: 1 },
        options: { background: true },
      },
      // Index for date range queries
      {
        name: 'createdAt_matchId',
        keys: { createdAt: -1, matchId: 1 },
        options: { background: true },
      },
    ],
  },
];

async function createIndexes() {
  console.log('🚀 Starting database index migration for retention queries...\n');

  const mongoUri =
    process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/dating-app';

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    let totalCreated = 0;
    let totalSkipped = 0;
    let totalFailed = 0;

    for (const collectionDef of INDEXES_TO_CREATE) {
      console.log(`📁 Processing collection: ${collectionDef.collection}`);

      if (!db) {
        console.error('Database connection is undefined');
        continue;
      }

      // Check if collection exists
      const collections = await db.listCollections({ name: collectionDef.collection }).toArray();
      if (collections.length === 0) {
        console.log(`   ⚠️  Collection ${collectionDef.collection} does not exist, skipping...\n`);
        continue;
      }

      const collection = db.collection(collectionDef.collection);

      // Get existing indexes
      const existingIndexes = await collection.indexes();
      const existingIndexNames = existingIndexes.map((idx) => idx.name);

      for (const indexDef of collectionDef.indexes) {
        try {
          // Check if index already exists
          if (existingIndexNames.includes(indexDef.name)) {
            console.log(`   ⏭️  Index '${indexDef.name}' already exists, skipping...`);
            totalSkipped++;
            continue;
          }

          // Create the index
          console.log(`   🔧 Creating index '${indexDef.name}'...`);
          // @ts-ignore - MongoDB driver types may be strict about index keys
          await collection.createIndex(indexDef.keys, {
            ...indexDef.options,
            name: indexDef.name,
          });
          console.log(`   ✅ Index '${indexDef.name}' created successfully`);
          totalCreated++;
        } catch (error) {
          console.error(
            `   ❌ Failed to create index '${indexDef.name}': ${error instanceof Error ? error.message : String(error)}`
          );
          totalFailed++;
        }
      }
      console.log('');
    }

    // Print summary
    console.log('═'.repeat(50));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Indexes created: ${totalCreated}`);
    console.log(`   ⏭️  Indexes skipped: ${totalSkipped}`);
    console.log(`   ❌ Indexes failed:  ${totalFailed}`);
    console.log('═'.repeat(50));

    // Verify indexes
    console.log('\n🔍 Verifying indexes on key collections:\n');

    if (!db) {
      console.error('Database connection is undefined, skipping verification');
    } else {
      for (const collectionDef of INDEXES_TO_CREATE) {
        const collections = await db.listCollections({ name: collectionDef.collection }).toArray();
        if (collections.length === 0) continue;

        const collection = db.collection(collectionDef.collection);
        const indexes = await collection.indexes();
        console.log(`📁 ${collectionDef.collection}:`);
        indexes.forEach((idx) => {
          if (idx.name !== '_id_') {
            console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
          }
        });
        console.log('');
      }
    }

    console.log('✅ Migration completed successfully!\n');
  } catch (error) {
    console.error('❌ Migration failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

// Run migration
createIndexes();
