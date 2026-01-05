/**
 * Global Teardown for Jest
 * Runs once after all test suites have completed
 * Ensures Redis connections are properly closed
 */

const { closeRedis } = require('../config/redis');

module.exports = async () => {
  // Close any remaining Redis connections
  await closeRedis();
};
