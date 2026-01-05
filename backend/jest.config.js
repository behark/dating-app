module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  roots: ['<rootDir>'],
  testPathIgnorePatterns: ['/node_modules/'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  globalTeardown: '<rootDir>/__tests__/global-teardown.js',
  transform: {},
  moduleDirectories: ['node_modules'],
  bail: false,
  verbose: false,
  testTimeout: 10000,
};
