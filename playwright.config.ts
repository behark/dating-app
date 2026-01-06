import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/web',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:19006',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'edge',
      use: { ...devices['Desktop Edge'] },
    },
    // Mobile devices
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'Mobile Chrome Android',
      use: { ...devices['Galaxy S20'] },
    },
    {
      name: 'iPhone SE',
      use: { ...devices['iPhone SE'] },
    },
    // Tablets
    {
      name: 'Tablet iPad',
      use: { ...devices['iPad Pro 11'] },
    },
    {
      name: 'Tablet Android',
      use: { ...devices['Galaxy Tab S4'] },
    },
    // Performance testing with network throttling
    {
      name: 'chromium-slow-3g',
      use: {
        ...devices['Desktop Chrome'],
        // Slow 3G: 400ms latency, 400kb/s down, 400kb/s up
        contextOptions: {
          offline: false,
        },
      },
    },
    {
      name: 'chromium-fast-3g',
      use: {
        ...devices['Desktop Chrome'],
        // Fast 3G: 150ms latency, 1.6mb/s down, 750kb/s up
      },
    },
    // Device testing projects
    {
      name: 'device-testing',
      testMatch: /.*device-testing.*/,
      use: { ...devices['Desktop Chrome'] },
    },
    // Performance testing projects
    {
      name: 'performance',
      testMatch: /.*performance.*/,
      use: { ...devices['Desktop Chrome'] },
    },
    // Error scenario testing
    {
      name: 'error-scenarios',
      testMatch: /.*error-scenarios.*/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run web',
    url: 'http://localhost:19006',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  expect: {
    timeout: 10000,
  },

  timeout: 30000,

  globalSetup: require.resolve('./e2e/global-setup.ts'),
  globalTeardown: require.resolve('./e2e/global-teardown.ts'),
});
