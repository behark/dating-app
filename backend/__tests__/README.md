# Dating App API Test Suite

Comprehensive automated API test suite for the dating app backend, providing full coverage of all API endpoints with success cases, validation, authentication, and edge case testing.

## 📋 Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [CI/CD Integration](#cicd-integration)
- [Writing New Tests](#writing-new-tests)
- [Test Utilities](#test-utilities)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

This test suite covers **21 API route modules** with comprehensive testing including:

- ✅ Success cases for all endpoints
- ✅ Input validation testing
- ✅ Authentication & authorization checks
- ✅ Edge cases and error handling
- ✅ Rate limiting scenarios
- ✅ Database interaction tests

### Technologies Used

- **Jest** - Test runner and assertion library
- **Supertest** - HTTP assertions for Express APIs
- **mongodb-memory-server** - In-memory MongoDB for isolated testing
- **ioredis-mock** - Redis mock for caching tests

## 📁 Test Structure

```
backend/
├── __tests__/
│   ├── routes/                    # API route tests
│   │   ├── auth.test.js           # Authentication endpoints
│   │   ├── profile.test.js        # Profile management
│   │   ├── swipe.test.js          # Swipe actions
│   │   ├── chat.test.js           # Messaging system
│   │   ├── discovery.test.js      # User discovery
│   │   ├── payment.test.js        # Payment processing
│   │   ├── premium.test.js        # Premium features
│   │   ├── safety.test.js         # Safety & reporting
│   │   ├── notifications.test.js  # Push notifications
│   │   ├── ai.test.js             # AI features
│   │   ├── activity.test.js       # Activity tracking
│   │   ├── privacy.test.js        # GDPR/Privacy
│   │   ├── gamification.test.js   # Gamification system
│   │   ├── socialFeatures.test.js # Social features
│   │   ├── mediaMessages.test.js  # Media messaging
│   │   ├── metrics.test.js        # Analytics
│   │   └── advancedInteractions.test.js # Advanced features
│   │
│   ├── utils/                     # Test utilities
│   │   ├── testHelpers.js         # Helper functions
│   │   ├── fixtures.js            # Test data fixtures
│   │   └── database.js            # Database utilities
│   │
│   ├── setup.enhanced.js          # Jest setup with mocks
│   ├── globalSetup.js             # Global test setup
│   └── globalTeardown.js          # Global teardown
│
├── jest.config.api.js             # Jest configuration
└── package.json                   # Scripts and dependencies
```

## 🚀 Running Tests

### Prerequisites

```bash
# Install dependencies
cd backend
npm install
```

### Run All Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

### Run Specific Test Files

```bash
# Run a specific test file
npm test -- __tests__/routes/auth.test.js

# Run tests matching a pattern
npm test -- --testNamePattern="POST /api/auth/register"

# Run tests for a specific route
npm test -- --testPathPattern=auth
```

### Watch Mode

```bash
# Run tests in watch mode
npm test -- --watch

# Watch specific files
npm test -- --watch --testPathPattern=profile
```

### Verbose Output

```bash
# Run with verbose output
npm test -- --verbose
```

## 📊 Test Coverage

### Generate Coverage Report

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

### Coverage Targets

| Metric | Target | Current |
|--------|--------|---------|
| Statements | 60% | - |
| Branches | 50% | - |
| Functions | 50% | - |
| Lines | 60% | - |

## 🔄 CI/CD Integration

### GitHub Actions

The test suite is automatically run on:
- Push to `main`, `develop`, or `feature/*` branches
- Pull requests to `main` or `develop`

Workflow file: `.github/workflows/api-tests.yml`

### Pipeline Jobs

1. **Lint** - ESLint validation
2. **Unit Tests** - Run across Node 18.x, 20.x, 22.x
3. **Integration Tests** - With MongoDB and Redis services
4. **API Tests with Coverage** - Full coverage report
5. **Security Scan** - npm audit and Snyk

### Environment Variables for CI

```yaml
env:
  JWT_SECRET: test-jwt-secret-for-ci
  MONGODB_URI: mongodb://localhost:27017/test
  REDIS_URL: redis://localhost:6379
  STRIPE_SECRET_KEY: sk_test_fake
  # ... other variables
```

## ✍️ Writing New Tests

### Test File Template

```javascript
const request = require('supertest');
const express = require('express');
const { generateTestToken, assertUnauthorized } = require('../utils/testHelpers');

// Mock dependencies
jest.mock('../../models/User', () => ({
  findById: jest.fn(),
}));

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  const myRoutes = require('../../routes/myRoutes');
  app.use('/api/myroutes', myRoutes);
  
  return app;
};

describe('MyRoutes API Tests', () => {
  let app;
  
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    app = createTestApp();
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/myroutes', () => {
    it('should return data successfully', async () => {
      const response = await request(app)
        .get('/api/myroutes')
        .set('Authorization', `Bearer ${generateTestToken()}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    it('should reject unauthenticated request', async () => {
      const response = await request(app).get('/api/myroutes');
      assertUnauthorized(response);
    });
  });
});
```

### Best Practices

1. **Group tests logically** - Use `describe` blocks for endpoints
2. **Test success cases first** - Then validation, auth, edge cases
3. **Mock external services** - Never call real APIs in tests
4. **Use fixtures** - Consistent test data from `fixtures.js`
5. **Clean up after tests** - Clear mocks in `beforeEach`

## 🛠️ Test Utilities

### testHelpers.js

```javascript
// Generate test JWT token
const token = generateTestToken({ userId: 'user_123' });

// Generate admin token
const adminToken = generateAdminToken();

// Assert responses
assertUnauthorized(response);   // Expects 401
assertForbidden(response);      // Expects 403
assertValidationError(response); // Expects 400 with errors
```

### fixtures.js

```javascript
const { users, profile, swipe } = require('./utils/fixtures');

// Use predefined test data
const validUser = users.valid;
const invalidUser = users.invalid;
```

### database.js

```javascript
const { connect, close, clear } = require('./utils/database');

// For integration tests
await connect();
await seedUsers([user1, user2]);
await clear();
await close();
```

## 🔧 Troubleshooting

### Common Issues

#### Tests Timing Out
```bash
# Increase timeout
npm test -- --testTimeout=60000
```

#### MongoDB Connection Issues
```bash
# Ensure mongodb-memory-server is installed
npm install mongodb-memory-server --save-dev

# Or use local MongoDB
export MONGODB_URI=mongodb://localhost:27017/test
```

#### Mock Not Working
```javascript
// Ensure mocks are at the top of the file, before imports
jest.mock('../../models/User', () => ({...}));

// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
```

#### Open Handles Warning
```bash
# Detect open handles
npm test -- --detectOpenHandles

# Force exit (use with caution)
npm test -- --forceExit
```

### Debug Mode

```bash
# Run with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# Run single test in debug
npm test -- --runInBand --testNamePattern="specific test name"
```

## 📦 Dependencies

```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "mongodb-memory-server": "^9.0.0",
    "ioredis-mock": "^8.0.0",
    "jest-junit": "^16.0.0"
  }
}
```

## 📈 Test Metrics

Run `npm test -- --coverage` to see:

- Total tests: 400+
- Test suites: 15+
- Execution time: ~30s
- Coverage: See report for details

---

For questions or issues, please open a GitHub issue or contact the development team.
