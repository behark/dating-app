/**
 * Test Helpers and Utilities
 * Provides reusable functions for API testing
 */

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Test constants
const TEST_JWT_SECRET = 'test-jwt-secret-for-testing-only';
const TEST_USER_ID = new mongoose.Types.ObjectId().toString();
const TEST_ADMIN_ID = new mongoose.Types.ObjectId().toString();

/**
 * Generate a valid JWT token for testing
 * @param {Object} options - Token options
 * @param {string} [options.userId] - User ID
 * @param {string} [options.role] - User role (user/admin)
 * @param {number} [options.expiresIn] - Token expiration in seconds
 * @returns {string} JWT token
 */
const generateTestToken = (options = {}) => {
  const {
    userId = TEST_USER_ID,
    role = 'user',
    expiresIn = 3600,
  } = options;

  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || TEST_JWT_SECRET,
    { expiresIn }
  );
};

/**
 * Generate an expired JWT token
 * @param {string} [userId] - User ID
 * @returns {string} Expired JWT token
 */
const generateExpiredToken = (userId = TEST_USER_ID) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || TEST_JWT_SECRET,
    { expiresIn: -1 }
  );
};

/**
 * Generate an invalid JWT token (wrong secret)
 * @param {string} [userId] - User ID
 * @returns {string} Invalid JWT token
 */
const generateInvalidToken = (userId = TEST_USER_ID) => {
  return jwt.sign({ userId }, 'wrong-secret', { expiresIn: 3600 });
};

/**
 * Generate admin token
 * @returns {string} Admin JWT token
 */
const generateAdminToken = () => {
  return generateTestToken({ userId: TEST_ADMIN_ID, role: 'admin' });
};

/**
 * Wait for a specified duration
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry a function until it succeeds or max attempts reached
 * @param {Function} fn - Function to retry
 * @param {number} [maxAttempts=3] - Maximum attempts
 * @param {number} [delay=100] - Delay between attempts in ms
 * @returns {Promise<any>}
 */
const retry = async (fn, maxAttempts = 3, delay = 100) => {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await wait(delay);
      }
    }
  }
  throw lastError;
};

/**
 * Create authorization header
 * @param {string} token - JWT token
 * @returns {Object} Authorization header
 */
const authHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});

/**
 * Validate API response structure
 * @param {Object} response - API response
 * @param {Object} options - Validation options
 * @returns {boolean}
 */
const validateResponseStructure = (response, options = {}) => {
  const { expectSuccess = true, requiredFields = [] } = options;

  if (expectSuccess) {
    expect(response.body.success).toBe(true);
  }

  for (const field of requiredFields) {
    expect(response.body).toHaveProperty(field);
  }

  return true;
};

/**
 * Generate random string
 * @param {number} [length=10] - String length
 * @returns {string}
 */
const randomString = (length = 10) => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate random email
 * @returns {string}
 */
const randomEmail = () => `test-${randomString(8)}@example.com`;

/**
 * Generate random phone number
 * @returns {string}
 */
const randomPhone = () => `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;

/**
 * Create a mock request object
 * @param {Object} overrides - Property overrides
 * @returns {Object}
 */
const createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: null,
  ...overrides,
});

/**
 * Create a mock response object
 * @returns {Object}
 */
const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Assert rate limit response
 * @param {Object} response - API response
 * @param {number} [expectedStatus=429] - Expected status code
 */
const assertRateLimited = (response, expectedStatus = 429) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body.success).toBe(false);
  expect(response.headers['retry-after']).toBeDefined();
};

/**
 * Assert unauthorized response
 * @param {Object} response - API response
 */
const assertUnauthorized = (response) => {
  expect(response.status).toBe(401);
  expect(response.body.success).toBe(false);
};

/**
 * Assert forbidden response
 * @param {Object} response - API response
 */
const assertForbidden = (response) => {
  expect(response.status).toBe(403);
  expect(response.body.success).toBe(false);
};

/**
 * Assert validation error response
 * @param {Object} response - API response
 */
const assertValidationError = (response) => {
  expect(response.status).toBe(400);
  expect(response.body.success).toBe(false);
  expect(response.body.errors || response.body.message).toBeDefined();
};

/**
 * Assert not found response
 * @param {Object} response - API response
 */
const assertNotFound = (response) => {
  expect(response.status).toBe(404);
  expect(response.body.success).toBe(false);
};

module.exports = {
  TEST_JWT_SECRET,
  TEST_USER_ID,
  TEST_ADMIN_ID,
  generateTestToken,
  generateExpiredToken,
  generateInvalidToken,
  generateAdminToken,
  wait,
  retry,
  authHeader,
  validateResponseStructure,
  randomString,
  randomEmail,
  randomPhone,
  createMockRequest,
  createMockResponse,
  assertRateLimited,
  assertUnauthorized,
  assertForbidden,
  assertValidationError,
  assertNotFound,
};
