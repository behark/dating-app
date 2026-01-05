module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  roots: ['<rootDir>'],
  testPathIgnorePatterns: ['/node_modules/'],
  setupFilesAfterEnv: [],
  transform: {},
  moduleDirectories: ['node_modules'],
  bail: false,
  verbose: false,
  testTimeout: 10000,
};
