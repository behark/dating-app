/**
 * Jest Setup File
 * Runs before all tests to configure the test environment
 */

// Mock ioredis to use ioredis-mock instead of trying to connect to a real Redis server
// This prevents ECONNREFUSED errors and hanging connections during tests
jest.mock('ioredis', () => {
  const RedisMock = require('ioredis-mock');

  // Return the mock class
  return RedisMock;
});

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
