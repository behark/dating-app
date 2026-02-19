/**
 * Jest Setup File
 * Runs before all tests to configure the test environment
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ||= 'test-jwt-secret-that-is-long-enough-for-validation';
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret-that-is-long-enough-for-validation';
process.env.HASH_SALT ||= 'test-hash-salt';
process.env.PORT ||= '0';

// Mock ioredis to use ioredis-mock instead of trying to connect to a real Redis server
// This prevents ECONNREFUSED errors and hanging connections during tests
jest.mock('ioredis', () => {
  const RedisMock = require('ioredis-mock');

  // Return the mock class
  return RedisMock;
});

// Ensure MongoMemoryServer binds to localhost in restricted environments.
try {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const originalCreate = MongoMemoryServer.create.bind(MongoMemoryServer);
  MongoMemoryServer.create = (options = {}) =>
    originalCreate({
      ...options,
      instance: {
        ip: '127.0.0.1',
        ...(options.instance || {}),
      },
    });
} catch (/** @type {any} */ _error) {
  // Some suites do not use mongodb-memory-server.
}

// Suppress console logs during tests to reduce noise
// Uncomment if you want to silence Redis connection logs during tests
// const originalConsoleLog = console.log;
// const originalConsoleError = console.error;
//
// beforeAll(() => {
//   console.log = jest.fn();
//   console.error = jest.fn();
// });
//
// afterAll(() => {
//   console.log = originalConsoleLog;
//   console.error = originalConsoleError;
// });
