/**
 * Socket.io Authentication Test Runner
 * Simple test runner for Socket.io JWT authentication
 */

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

function createMockUser(overrides = {}) {
  return {
    _id: new mongoose.Types.ObjectId(),
    name: 'Test User',
    email: 'test@example.com',
    isActive: true,
    isVerified: true,
    ...overrides,
  };
}

function generateTestToken(userId) {
  return jwt.sign({ userId: userId.toString(), id: userId.toString() }, JWT_SECRET, {
    expiresIn: '1h',
  });
}

function generateExpiredToken(userId) {
  return jwt.sign({ userId: userId.toString(), id: userId.toString() }, JWT_SECRET, {
    expiresIn: '-1h',
  });
}

function generateInvalidToken() {
  return 'invalid-token';
}

const testCases = [
  {
    name: 'Valid JWT token',
    getToken: (userId) => generateTestToken(userId),
    expectSuccess: true,
  },
  {
    name: 'Expired JWT token',
    getToken: (userId) => generateExpiredToken(userId),
    expectSuccess: false,
  },
  {
    name: 'Invalid token',
    getToken: () => generateInvalidToken(),
    expectSuccess: false,
  },
  {
    name: 'No token',
    getToken: () => null,
    expectSuccess: false,
  },
];

function validateToken(token) {
  if (!token) {
    return { valid: false, error: 'No token provided' };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, decoded };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token validation failed';
    return { valid: false, error: message };
  }
}

async function runTests() {
  console.log('Running Socket.io Authentication Tests...\n');

  const user = createMockUser();
  const results = [];

  for (const testCase of testCases) {
    const token = testCase.getToken(user._id);
    const result = validateToken(token);
    const passed = result.valid === testCase.expectSuccess;

    results.push({
      name: testCase.name,
      passed,
      result,
    });

    console.log(`${passed ? '✓' : '✗'} ${testCase.name}`);
    if (!passed) {
      console.log(`  Expected: ${testCase.expectSuccess ? 'valid' : 'invalid'}`);
      console.log(`  Got: ${result.valid ? 'valid' : 'invalid'}`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    }
  }

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  console.log(`\nResults: ${passed}/${total} tests passed`);

  return { passed, total, results };
}

module.exports = {
  createMockUser,
  generateTestToken,
  generateExpiredToken,
  generateInvalidToken,
  validateToken,
  testCases,
  runTests,
};
