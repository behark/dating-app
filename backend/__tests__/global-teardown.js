/**
 * Global Teardown for Jest
 * Runs once after all test suites have completed
 * Ensures Redis connections are properly closed
 */

let closeRedis = async () => {};
let mongoose;

try {
  ({ closeRedis } = require('../src/config/redis'));
} catch (/** @type {any} */ error) {
  try {
    ({ closeRedis } = require('../config/redis'));
  } catch (/** @type {any} */ _legacyPathError) {
    // Redis config may not exist in older/newer test layouts.
  }
}

try {
  mongoose = require('mongoose');
} catch (/** @type {any} */ _error) {
  mongoose = null;
}

module.exports = async () => {
  // Close any remaining Redis connections
  await closeRedis();

  // Close any lingering mongoose connections
  if (mongoose && mongoose.connection && mongoose.connection.readyState !== 0) {
    try {
      await mongoose.disconnect();
    } catch (/** @type {any} */ _e) {
      // ignore
    }
  }
};
