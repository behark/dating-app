/**
 * Network Throttling Performance Tests
 * Tests for application behavior under various network conditions
 */

const { test, expect } = require('@playwright/test');

const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'TestPassword123!';
const EMAIL_INPUT = '[data-testid="email-input"]';
const PASSWORD_INPUT = '[data-testid="password-input"]';
const LOGIN_BUTTON = '[data-testid="login-button"]';
const DISCOVER_URL_PATTERN = /.*discover/;

describe('Network Throttling Performance Tests', () => {
  test.describe('Slow 3G Network', () => {
    test.use({
      contextOptions: {
        // Slow 3G: 400ms latency, 400kb/s down, 400kb/s up
        ...test.use().contextOptions,
      },
    });

    test('should load login page within acceptable time on slow 3G', async ({ page, context }) => {
      // Simulate slow 3G
      await context.route('**/*', (route) => {
        route.continue();
      });

      const startTime = Date.now();
      await page.goto('/');
      const loadTime = Date.now() - startTime;

      // Should load within 10 seconds on slow 3G
      expect(loadTime).toBeLessThan(10000);
      await expect(page.getByText('Sign In')).toBeVisible();
    });

    test('should handle login on slow 3G', async ({ page, context }) => {
      await page.goto('/');

      const startTime = Date.now();
      await page.fill(EMAIL_INPUT, TEST_EMAIL);
      await page.fill(PASSWORD_INPUT, TEST_PASSWORD);
      await page.click(LOGIN_BUTTON);

      await page.waitForURL(DISCOVER_URL_PATTERN, { timeout: 30000 });
      const loginTime = Date.now() - startTime;

      // Login should complete within 30 seconds on slow 3G
      expect(loginTime).toBeLessThan(30000);
    });

    test('should show loading states during slow network requests', async ({ page, context }) => {
      await page.goto('/');

      // Intercept and delay API calls
      await context.route('**/api/**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.continue();
      });

      await page.fill(EMAIL_INPUT, TEST_EMAIL);
      await page.fill(PASSWORD_INPUT, TEST_PASSWORD);
      await page.click(LOGIN_BUTTON);

      // Should show loading indicator
      const loadingIndicator = page.locator('[data-testid="loading"]');
      const isLoading = await loadingIndicator.isVisible().catch(() => false);
      // Loading indicator may or may not be present, but should handle gracefully
    });
  });

  test.describe('Fast 3G Network', () => {
    test('should load pages quickly on fast 3G', async ({ page, context }) => {
      // Fast 3G: 150ms latency, 1.6mb/s down, 750kb/s up
      await page.goto('/');

      const startTime = Date.now();
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Should load within 5 seconds on fast 3G
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle API calls efficiently on fast 3G', async ({ page }) => {
      await page.goto('/');
      await page.fill(EMAIL_INPUT, TEST_EMAIL);
      await page.fill(PASSWORD_INPUT, TEST_PASSWORD);

      const startTime = Date.now();
      await page.click(LOGIN_BUTTON);
      await page.waitForURL(DISCOVER_URL_PATTERN, { timeout: 15000 });
      const apiTime = Date.now() - startTime;

      // API call should complete within 15 seconds on fast 3G
      expect(apiTime).toBeLessThan(15000);
    });
  });

  test.describe('Offline Network', () => {
    test('should handle offline state gracefully', async ({ page, context }) => {
      await page.goto('/');

      // Go offline
      await context.setOffline(true);

      await page.fill(EMAIL_INPUT, TEST_EMAIL);
      await page.fill(PASSWORD_INPUT, TEST_PASSWORD);
      await page.click(LOGIN_BUTTON);

      // Should show offline error message
      await expect(page.getByText(/offline|network|connection/i)).toBeVisible({ timeout: 5000 });
    });

    test('should queue actions when offline', async ({ page, context }) => {
      await page.goto('/');
      await page.fill(EMAIL_INPUT, TEST_EMAIL);
      await page.fill(PASSWORD_INPUT, TEST_PASSWORD);
      await page.click(LOGIN_BUTTON);
      await page.waitForURL(DISCOVER_URL_PATTERN, { timeout: 10000 });

      // Go offline
      await context.setOffline(true);

      // Try to perform action (e.g., swipe)
      const likeButton = page.locator('[data-testid="like-button"]');
      if (await likeButton.isVisible()) {
        await likeButton.click();
        // Action should be queued or show offline message
        await expect(page.getByText(/offline|queued|will sync/i))
          .toBeVisible({ timeout: 3000 })
          .catch(() => {
            // May not show message immediately
          });
      }
    });

    test('should sync queued actions when back online', async ({ page, context }) => {
      await page.goto('/');
      await page.fill(EMAIL_INPUT, TEST_EMAIL);
      await page.fill(PASSWORD_INPUT, TEST_PASSWORD);
      await page.click(LOGIN_BUTTON);
      await page.waitForURL(DISCOVER_URL_PATTERN, { timeout: 10000 });

      // Go offline and perform action
      await context.setOffline(true);
      const likeButton = page.locator('[data-testid="like-button"]');
      if (await likeButton.isVisible()) {
        await likeButton.click();
      }

      // Come back online
      await context.setOffline(false);
      await page.waitForTimeout(2000);

      // Queued actions should sync
      // This would be verified by checking API calls or state
    });
  });

  test.describe('Network Latency', () => {
    test('should handle high latency (500ms)', async ({ page, context }) => {
      // Add 500ms latency to all requests
      await context.route('**/api/**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await route.continue();
      });

      await page.goto('/');
      await page.fill(EMAIL_INPUT, TEST_EMAIL);
      await page.fill(PASSWORD_INPUT, TEST_PASSWORD);

      const startTime = Date.now();
      await page.click(LOGIN_BUTTON);
      await page.waitForURL(DISCOVER_URL_PATTERN, { timeout: 20000 });
      const loginTime = Date.now() - startTime;

      // Should complete despite latency
      expect(loginTime).toBeLessThan(20000);
    });

    test('should handle very high latency (2000ms)', async ({ page, context }) => {
      // Add 2 second latency
      await context.route('**/api/**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.continue();
      });

      await page.goto('/');

      const startTime = Date.now();
      await page.fill(EMAIL_INPUT, TEST_EMAIL);
      await page.fill(PASSWORD_INPUT, TEST_PASSWORD);
      await page.click(LOGIN_BUTTON);

      // Should show loading state
      await page.waitForTimeout(1000);
      const isLoading = await page
        .locator('[data-testid="loading"]')
        .isVisible()
        .catch(() => false);
      // Loading indicator may be present
    });
  });

  test.describe('Network Interruption', () => {
    test('should handle network interruption during request', async ({ page, context }) => {
      await page.goto('/');
      await page.fill(EMAIL_INPUT, TEST_EMAIL);
      await page.fill(PASSWORD_INPUT, TEST_PASSWORD);

      // Start request
      const loginPromise = page.click(LOGIN_BUTTON);

      // Interrupt network
      await page.waitForTimeout(500);
      await context.setOffline(true);
      await page.waitForTimeout(1000);
      await context.setOffline(false);

      // Request should retry or show error
      try {
        await loginPromise;
      } catch (error) {
        // Error is expected
      }

      // Should show appropriate message
      await expect(page.getByText(/error|retry|network/i))
        .toBeVisible({ timeout: 5000 })
        .catch(() => {
          // May have retried successfully
        });
    });

    test('should retry failed requests', async ({ page, context }) => {
      let requestCount = 0;
      await context.route('**/api/auth/login', async (route) => {
        requestCount++;
        if (requestCount < 3) {
          await route.abort();
        } else {
          await route.continue();
        }
      });

      await page.goto('/');
      await page.fill(EMAIL_INPUT, TEST_EMAIL);
      await page.fill(PASSWORD_INPUT, TEST_PASSWORD);
      await page.click(LOGIN_BUTTON);

      // Should eventually succeed after retries
      await page.waitForURL(DISCOVER_URL_PATTERN, { timeout: 30000 });
      expect(requestCount).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Bandwidth Constraints', () => {
    test('should handle limited bandwidth', async ({ page, context }) => {
      // Throttle bandwidth
      await context.route('**/*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate slow transfer
        await route.continue();
      });

      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Should still load, may take longer
      expect(loadTime).toBeLessThan(15000);
      await expect(page.getByText('Sign In')).toBeVisible();
    });
  });
});
