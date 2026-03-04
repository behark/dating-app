/**
 * Jest Setup File
 * Runs before all tests to configure the test environment
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ||= 'test-jwt-secret-that-is-long-enough-for-validation';
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret-that-is-long-enough-for-validation';
process.env.HASH_SALT ||= 'test-hash-salt';
process.env.PORT ||= '0';
process.env.LOG_LEVEL = 'error'; // reduce noise in tests

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

// Suppress noisy logging during tests (winston + console)
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
};

beforeAll(() => {
  try {
    const { logger, requestLogger } = require('../src/infrastructure/external/LoggingService');
    if (logger?.logger?.transports) {
      logger.logger.transports.forEach((t) => (t.silent = true));
    }
    if (logger?.requestLogger?.transports) {
      logger.requestLogger.transports.forEach((t) => (t.silent = true));
    }
    if (requestLogger?.transports) {
      requestLogger.transports.forEach((t) => (t.silent = true));
    }
  } catch (/** @type {any} */ _e) {
    // best-effort
  }

  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  console.info = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.info = originalConsole.info;
});
