/**
 * Global teardown for Playwright E2E tests
 */
import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global E2E test teardown...');

  try {
    // Clean up test data
    // await fetch('http://localhost:3001/api/test/cleanup');
    
    // Reset any global state
    
  } catch (error) {
    console.error('Error in global teardown:', error);
  }

  console.log('✅ Global teardown complete');
}

export default globalTeardown;
