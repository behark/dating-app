/**
 * Database Test Utilities
 * Provides MongoDB and Redis setup/teardown for integration tests
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const RedisMock = require('ioredis-mock');

let mongoServer;
let redisClient;

/**
 * Connect to in-memory MongoDB for testing
 * @returns {Promise<mongoose.Connection>}
 */
const connectTestDatabase = async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri, {
    maxPoolSize: 10,
  });

  return mongoose.connection;
};

/**
 * Disconnect from test database
 */
const disconnectTestDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }
};

/**
 * Clear all collections in test database
 */
const clearDatabase = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

/**
 * Create mock Redis client
 * @returns {Object}
 */
const createMockRedis = () => {
  redisClient = new RedisMock();
  return redisClient;
};

/**
 * Clear mock Redis
 */
const clearMockRedis = async () => {
  if (redisClient) {
    await redisClient.flushall();
  }
};

/**
 * Close mock Redis
 */
const closeMockRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
  }
};

/**
 * Seed test user in database
 * @param {Object} userData - User data to seed
 * @returns {Promise<Object>} Created user
 */
const seedUser = async (userData) => {
  const User = require('../../src/core/domain/User');
  const bcrypt = require('bcryptjs');

  const hashedPassword = userData.password ? await bcrypt.hash(userData.password, 10) : undefined;

  const user = new User({
    ...userData,
    password: hashedPassword || userData.password,
    isEmailVerified: true,
  });

  await user.save();
  return user;
};

/**
 * Seed multiple test users
 * @param {Array<Object>} usersData - Array of user data
 * @returns {Promise<Array<Object>>} Created users
 */
const seedUsers = async (usersData) => {
  return Promise.all(usersData.map(seedUser));
};

/**
 * Seed a match between two users
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {Promise<Object>} Created match
 */
const seedMatch = async (userId1, userId2) => {
  const Match = require('../../src/core/domain/Match');

  const match = new Match({
    users: [userId1, userId2],
    status: 'active',
    createdAt: new Date(),
  });

  await match.save();
  return match;
};

/**
 * Seed a swipe
 * @param {Object} swipeData - Swipe data
 * @returns {Promise<Object>} Created swipe
 */
const seedSwipe = async (swipeData) => {
  const Swipe = require('../../src/core/domain/Swipe');

  const swipe = new Swipe({
    ...swipeData,
    createdAt: new Date(),
  });

  await swipe.save();
  return swipe;
};

/**
 * Seed a message
 * @param {Object} messageData - Message data
 * @returns {Promise<Object>} Created message
 */
const seedMessage = async (messageData) => {
  const Message = require('../../src/core/domain/Message');

  const message = new Message({
    ...messageData,
    createdAt: new Date(),
  });

  await message.save();
  return message;
};

/**
 * Create a complete test scenario with users, matches, and messages
 * @returns {Promise<Object>} Test scenario data
 */
const createTestScenario = async () => {
  const { users: userFixtures } = require('./fixtures');

  // Create users
  const user1 = await seedUser(userFixtures.validUser);
  const user2 = await seedUser(userFixtures.validUser2);
  const adminUser = await seedUser(userFixtures.adminUser);

  // Create match
  const match = await seedMatch(user1._id, user2._id);

  // Create messages
  const message1 = await seedMessage({
    matchId: match._id,
    senderId: user1._id,
    content: 'Hello!',
  });

  const message2 = await seedMessage({
    matchId: match._id,
    senderId: user2._id,
    content: 'Hi there!',
  });

  return {
    users: { user1, user2, adminUser },
    match,
    messages: [message1, message2],
  };
};

module.exports = {
  connectTestDatabase,
  disconnectTestDatabase,
  clearDatabase,
  createMockRedis,
  clearMockRedis,
  closeMockRedis,
  seedUser,
  seedUsers,
  seedMatch,
  seedSwipe,
  seedMessage,
  createTestScenario,
};
