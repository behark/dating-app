module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  roots: ['<rootDir>'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/integration/',
    '/__tests__/edge-cases/',
    '/__tests__/error-scenarios/',
  ],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  globalTeardown: '<rootDir>/__tests__/global-teardown.js',
  transform: {},
  moduleDirectories: ['node_modules'],
  bail: false,
  verbose: false,
  testTimeout: 120000,
};
