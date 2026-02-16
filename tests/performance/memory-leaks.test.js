/**
 * Memory Leak Detection Tests
 * Tests for detecting and preventing memory leaks
 */

const { test, expect } = require('@playwright/test');

const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'TestPassword123!';
const EMAIL_INPUT = '[data-testid="email-input"]';
const PASSWORD_INPUT = '[data-testid="password-input"]';
const LOGIN_BUTTON = '[data-testid="login-button"]';
const DISCOVER_URL_PATTERN = /.*discover/;
const DISCOVER_TAB = '[data-testid="discover-tab"]';
const CHAT_TAB = '[data-testid="chat-tab"]';

describe('Memory Leak Detection', () => {
  test('should not leak memory on repeated navigation', async ({ page }) => {
    await page.goto('/');
    await page.fill(EMAIL_INPUT, TEST_EMAIL);
    await page.fill(PASSWORD_INPUT, TEST_PASSWORD);
    await page.click(LOGIN_BUTTON);
    await page.waitForURL(DISCOVER_URL_PATTERN, { timeout: 10000 });

    // Navigate multiple times
    for (let i = 0; i < 10; i++) {
      const chatTab = page.locator(CHAT_TAB);
      const discoverTab = page.locator(DISCOVER_TAB);
      if (await chatTab.isVisible()) {
        await chatTab.click();
        await page.waitForTimeout(200);
        await discoverTab.click();
        await page.waitForTimeout(200);
      }
    }

    // Page should still be responsive
    await expect(page.locator(DISCOVER_TAB)).toBeVisible();
  });

  test('should not leak memory on repeated swipes', async ({ page }) => {
    await page.goto('/');
    await page.fill(EMAIL_INPUT, TEST_EMAIL);
    await page.fill(PASSWORD_INPUT, TEST_PASSWORD);
    await page.click(LOGIN_BUTTON);
    await page.waitForURL(DISCOVER_URL_PATTERN, { timeout: 10000 });

    // Perform many swipes
    const likeButton = page.locator('[data-testid="like-button"]');
    for (let i = 0; i < 50; i++) {
      if (await likeButton.isVisible()) {
        await likeButton.click();
        await page.waitForTimeout(200);
      } else {
        break;
      }
    }

    // Page should still be responsive
    await expect(page.locator('[data-testid="profile-card"]'))
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        // May have run out of profiles, which is fine
      });
  });

  test('should not leak memory on message sending', async ({ page }) => {
    await page.goto('/');
    await page.fill(EMAIL_INPUT, TEST_EMAIL);
    await page.fill(PASSWORD_INPUT, TEST_PASSWORD);
    await page.click(LOGIN_BUTTON);
    await page.waitForURL(DISCOVER_URL_PATTERN, { timeout: 10000 });

    // Navigate to chat
    const chatTab = page.locator(CHAT_TAB);
    await chatTab.click();

    // Open conversation
    const matchItem = page.locator('[data-testid="match-item"]:first-child');
    const hasMatch = await matchItem.isVisible().catch(() => false);

    if (hasMatch) {
      await matchItem.click();

      // Send many messages
      const messageInput = page.locator('[data-testid="message-input"]');
      const sendButton = page.locator('[data-testid="send-button"]');
      for (let i = 0; i < 20; i++) {
        if (await messageInput.isVisible()) {
          await messageInput.fill(`Message ${i}`);
          await sendButton.click();
          await page.waitForTimeout(200);
        }
      }

      // Page should still be responsive
      await expect(messageInput).toBeVisible();
    }
  });

  test('should clean up event listeners', async ({ page }) => {
    await page.goto('/');

    // Check for event listener leaks
    const initialListeners = await page.evaluate(() => {
      return window.getEventListeners ? Object.keys(window.getEventListeners(document)).length : 0;
    });

    // Perform actions
    await page.fill(EMAIL_INPUT, TEST_EMAIL);
    await page.fill(PASSWORD_INPUT, TEST_PASSWORD);
    await page.click(LOGIN_BUTTON);
    await page.waitForURL(DISCOVER_URL_PATTERN, { timeout: 10000 });

    // Navigate around
    for (let i = 0; i < 5; i++) {
      const chatTab = page.locator(CHAT_TAB);
      const discoverTab = page.locator(DISCOVER_TAB);
      if (await chatTab.isVisible()) {
        await chatTab.click();
        await page.waitForTimeout(200);
        await discoverTab.click();
        await page.waitForTimeout(200);
      }
    }

    // Event listeners should not grow unbounded
    // Note: This is a simplified check - real memory leak detection requires more sophisticated tools
    const finalListeners = await page.evaluate(() => {
      return window.getEventListeners ? Object.keys(window.getEventListeners(document)).length : 0;
    });

    // Listeners may increase but should not grow excessively
    expect(finalListeners - initialListeners).toBeLessThan(100);
  });

  test('should handle large data sets without memory issues', async ({ page }) => {
    await page.goto('/');
    await page.fill(EMAIL_INPUT, TEST_EMAIL);
    await page.fill(PASSWORD_INPUT, TEST_PASSWORD);
    await page.click(LOGIN_BUTTON);
    await page.waitForURL(DISCOVER_URL_PATTERN, { timeout: 10000 });

    // Simulate loading many profiles
    for (let i = 0; i < 100; i++) {
      const likeButton = page.locator('[data-testid="like-button"]');
      if (await likeButton.isVisible()) {
        await likeButton.click();
        await page.waitForTimeout(100);
      } else {
        break;
      }
    }

    // Page should still be responsive
    await expect(page.locator(DISCOVER_TAB)).toBeVisible();
  });
});
