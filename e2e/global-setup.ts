/**
 * Global setup for Playwright E2E tests
 */
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global E2E test setup...');

  // Create test user if needed
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Check if API is available
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:19006';
    
    // Wait for app to be ready
    let retries = 10;
    while (retries > 0) {
      try {
        await page.goto(baseURL, { timeout: 5000 });
        console.log('✅ App is ready');
        break;
      } catch (e) {
        retries--;
        if (retries === 0) {
          console.warn('⚠️ App may not be ready, continuing anyway...');
        } else {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }

    // Set up test data via API if needed
    // await fetch('http://localhost:3001/api/test/seed');

  } catch (error) {
    console.error('Error in global setup:', error);
  } finally {
    await browser.close();
  }

  console.log('✅ Global setup complete');
}

export default globalSetup;
