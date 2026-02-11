/**
 * Global Teardown for Jest
 * Runs once after all test suites have completed
 * Ensures Redis connections are properly closed
 */

let closeRedis = async () => {};

try {
  ({ closeRedis } = require('../src/config/redis'));
} catch (error) {
  try {
    ({ closeRedis } = require('../config/redis'));
  } catch (_legacyPathError) {
    // Redis config may not exist in older/newer test layouts.
  }
}

module.exports = async () => {
  // Close any remaining Redis connections
  await closeRedis();
};
