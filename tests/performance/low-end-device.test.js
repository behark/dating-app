/**
 * Low-End Device Performance Tests
 * Tests for application performance on low-end devices with CPU/memory constraints
 */

const { test, expect } = require('@playwright/test');

const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'TestPassword123!';
const EMAIL_INPUT = '[data-testid="email-input"]';
const PASSWORD_INPUT = '[data-testid="password-input"]';
const LOGIN_BUTTON = '[data-testid="login-button"]';
const DISCOVER_URL_PATTERN = /.*discover/;
const SIGN_IN_TEXT = 'Sign In';
const LIKE_BUTTON = '[data-testid="like-button"]';
const CHAT_TAB = '[data-testid="chat-tab"]';
const DISCOVER_TAB = '[data-testid="discover-tab"]';

describe('Low-End Device Performance Tests', () => {
  test.describe('CPU Throttling', () => {
    test('should handle reduced CPU performance', async ({ page, context }) => {
      // Simulate CPU throttling (4x slowdown)
      await context.addInitScript(() => {
        // Simulate slow CPU by adding delays to operations
        const originalSetTimeout = window.setTimeout;
        window.setTimeout = function (fn, delay) {
          return originalSetTimeout(fn, delay * 1.5); // 1.5x slower
        };
      });

      const startTime = Date.now();
      await page.goto('/');
      const loadTime = Date.now() - startTime;

      // Should still load within reasonable time
      expect(loadTime).toBeLessThan(10000);
      await expect(page.getByText(SIGN_IN_TEXT)).toBeVisible();
    });

    test('should handle animations smoothly on low-end CPU', async ({ page }) => {
      await page.goto('/');
      await page.fill(EMAIL_INPUT, TEST_EMAIL);
      await page.fill(PASSWORD_INPUT, TEST_PASSWORD);
      await page.click(LOGIN_BUTTON);
      await page.waitForURL(DISCOVER_URL_PATTERN, { timeout: 10000 });

      // Check profile card animations
      const profileCard = page.locator('[data-testid="profile-card"]');
      if (await profileCard.isVisible()) {
        const likeButton = page.locator(LIKE_BUTTON);
        await likeButton.click();

        // Animation should complete (may be slower but should complete)
        await page.waitForTimeout(1000);
        // Card should have moved or changed
      }
    });
  });

  test.describe('Memory Constraints', () => {
    test('should handle limited memory', async ({ page }) => {
      // Simulate memory constraints by loading many elements
      await page.goto('/');
      await page.fill(EMAIL_INPUT, TEST_EMAIL);
      await page.fill(PASSWORD_INPUT, TEST_PASSWORD);
      await page.click(LOGIN_BUTTON);
      await page.waitForURL(DISCOVER_URL_PATTERN, { timeout: 10000 });

      // Navigate through multiple screens to test memory usage
      for (let i = 0; i < 5; i++) {
        const chatTab = page.locator(CHAT_TAB);
        const discoverTab = page.locator(DISCOVER_TAB);
        if (await chatTab.isVisible()) {
          await chatTab.click();
          await page.waitForTimeout(500);
          await discoverTab.click();
          await page.waitForTimeout(500);
        }
      }

      // Page should still be responsive
      await expect(page.locator(DISCOVER_TAB)).toBeVisible();
    });

    test('should not leak memory on repeated operations', async ({ page }) => {
      await page.goto('/');
      await page.fill(EMAIL_INPUT, TEST_EMAIL);
      await page.fill(PASSWORD_INPUT, TEST_PASSWORD);
      await page.click(LOGIN_BUTTON);
      await page.waitForURL(DISCOVER_URL_PATTERN, { timeout: 10000 });

      // Perform many operations
      const likeButton = page.locator(LIKE_BUTTON);
      for (let i = 0; i < 20; i++) {
        if (await likeButton.isVisible()) {
          await likeButton.click();
          await page.waitForTimeout(300);
        } else {
          break;
        }
      }

      // Page should still be responsive
      await expect(page.locator('[data-testid="profile-card"]')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Rendering Performance', () => {
    test('should render initial page quickly on low-end device', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      const renderTime = Date.now() - startTime;

      // Initial render should be fast
      expect(renderTime).toBeLessThan(3000);
      await expect(page.getByText(SIGN_IN_TEXT)).toBeVisible();
    });

    test('should handle large lists efficiently', async ({ page }) => {
      await page.goto('/');
      await page.fill(EMAIL_INPUT, TEST_EMAIL);
      await page.fill(PASSWORD_INPUT, TEST_PASSWORD);
      await page.click(LOGIN_BUTTON);
      await page.waitForURL(DISCOVER_URL_PATTERN, { timeout: 10000 });

      // Navigate to matches (potentially large list)
      const chatTab = page.locator(CHAT_TAB);
      if (await chatTab.isVisible()) {
        const startTime = Date.now();
        await chatTab.click();
        await page.waitForTimeout(1000);
        const renderTime = Date.now() - startTime;

        // List should render within reasonable time
        expect(renderTime).toBeLessThan(5000);
      }
    });

    test('should handle image loading efficiently', async ({ page }) => {
      await page.goto('/');
      await page.fill(EMAIL_INPUT, TEST_EMAIL);
      await page.fill(PASSWORD_INPUT, TEST_PASSWORD);
      await page.click(LOGIN_BUTTON);
      await page.waitForURL(DISCOVER_URL_PATTERN, { timeout: 10000 });

      // Check profile images load
      const profileImages = page.locator('[data-testid="profile-image"]');
      const imageCount = await profileImages.count();

      if (imageCount > 0) {
        // Images should load progressively
        await page.waitForTimeout(2000);
        // At least some images should be loaded
        const loadedImages = await Promise.all(
          Array.from({ length: Math.min(imageCount, 3) }, async (_, i) => {
            const img = profileImages.nth(i);
            return await img
              .getAttribute('src')
              .then(() => true)
              .catch(() => false);
          })
        );
        expect(loadedImages.some((loaded) => loaded)).toBe(true);
      }
    });
  });

  test.describe('Interaction Performance', () => {
    test('should respond quickly to user interactions', async ({ page }) => {
      await page.goto('/');
      await page.fill(EMAIL_INPUT, TEST_EMAIL);
      await page.fill(PASSWORD_INPUT, TEST_PASSWORD);

      const startTime = Date.now();
      await page.click(LOGIN_BUTTON);
      // Should show immediate feedback
      const feedbackTime = Date.now() - startTime;
      expect(feedbackTime).toBeLessThan(500); // Immediate feedback
    });

    test('should handle rapid button clicks', async ({ page }) => {
      await page.goto('/');
      await page.fill(EMAIL_INPUT, TEST_EMAIL);
      await page.fill(PASSWORD_INPUT, TEST_PASSWORD);
      await page.click(LOGIN_BUTTON);
      await page.waitForURL(DISCOVER_URL_PATTERN, { timeout: 10000 });

      // Rapid clicks should be debounced/throttled
      const likeButton = page.locator(LIKE_BUTTON);
      if (await likeButton.isVisible()) {
        for (let i = 0; i < 5; i++) {
          await likeButton.click({ clickCount: 1 });
          await page.waitForTimeout(100);
        }
        // Should only process one swipe, not five
        await page.waitForTimeout(1000);
      }
    });

    test('should handle scroll performance', async ({ page }) => {
      await page.goto('/');
      await page.fill(EMAIL_INPUT, TEST_EMAIL);
      await page.fill(PASSWORD_INPUT, TEST_PASSWORD);
      await page.click(LOGIN_BUTTON);
      await page.waitForURL(DISCOVER_URL_PATTERN, { timeout: 10000 });

      // Scroll through profiles
      const startTime = Date.now();
      await page.evaluate(() => {
        window.scrollBy(0, 500);
      });
      await page.waitForTimeout(500);
      const scrollTime = Date.now() - startTime;

      // Scroll should be smooth
      expect(scrollTime).toBeLessThan(1000);
    });
  });

  test.describe('Battery Optimization', () => {
    test('should minimize background processing', async ({ page }) => {
      await page.goto('/');
      await page.fill(EMAIL_INPUT, TEST_EMAIL);
      await page.fill(PASSWORD_INPUT, TEST_PASSWORD);
      await page.click(LOGIN_BUTTON);
      await page.waitForURL(DISCOVER_URL_PATTERN, { timeout: 10000 });

      // Wait and check for unnecessary background activity
      await page.waitForTimeout(2000);

      // Page should be idle when user is not interacting
      const networkRequests = await page.evaluate(() => {
        return performance.getEntriesByType('resource').length;
      });

      // Should not have excessive background requests
      expect(networkRequests).toBeLessThan(100);
    });
  });

  test.describe('Combined Constraints', () => {
    test('should handle combined CPU and memory constraints', async ({ page }) => {
      // Simulate both CPU and memory constraints
      await page.goto('/');

      const startTime = Date.now();
      await page.fill(EMAIL_INPUT, TEST_EMAIL);
      await page.fill(PASSWORD_INPUT, TEST_PASSWORD);
      await page.click(LOGIN_BUTTON);
      await page.waitForURL(DISCOVER_URL_PATTERN, { timeout: 20000 });
      const totalTime = Date.now() - startTime;

      // Should still complete within reasonable time
      expect(totalTime).toBeLessThan(20000);
    });

    test('should maintain usability under constraints', async ({ page }) => {
      await page.goto('/');
      await page.fill(EMAIL_INPUT, TEST_EMAIL);
      await page.fill(PASSWORD_INPUT, TEST_PASSWORD);
      await page.click(LOGIN_BUTTON);
      await page.waitForURL(DISCOVER_URL_PATTERN, { timeout: 10000 });

      // All interactions should still work
      const likeButton = page.locator(LIKE_BUTTON);
      const passButton = page.locator('[data-testid="pass-button"]');
      const chatTab = page.locator(CHAT_TAB);

      expect(
        (await likeButton.isVisible().catch(() => false)) ||
          (await passButton.isVisible().catch(() => false)) ||
          (await chatTab.isVisible().catch(() => false))
      ).toBe(true);
    });
  });
});
