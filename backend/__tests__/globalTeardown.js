/**
 * Global Teardown for Jest Tests
 * Runs once after all test suites complete
 */

module.exports = async () => {
  console.log('\n================================');
  console.log('🏁 API Test Suite Complete');
  console.log('================================\n');
  
  // Give time for any pending operations to complete
  await new Promise((resolve) => setTimeout(resolve, 500));
};
