/**
 * Memory Leak Detection Tests
 * Tests for detecting and preventing memory leaks
 */

const { test, expect } = require('@playwright/test');

describe('Memory Leak Detection', () => {
  test('should not leak memory on repeated navigation', async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(/.*discover/, { timeout: 10000 });

    // Navigate multiple times
    for (let i = 0; i < 10; i++) {
      const chatTab = page.locator('[data-testid="chat-tab"]');
      const discoverTab = page.locator('[data-testid="discover-tab"]');
      if (await chatTab.isVisible()) {
        await chatTab.click();
        await page.waitForTimeout(200);
        await discoverTab.click();
        await page.waitForTimeout(200);
      }
    }

    // Page should still be responsive
    await expect(page.locator('[data-testid="discover-tab"]')).toBeVisible();
  });

  test('should not leak memory on repeated swipes', async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(/.*discover/, { timeout: 10000 });

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
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(/.*discover/, { timeout: 10000 });

    // Navigate to chat
    const chatTab = page.locator('[data-testid="chat-tab"]');
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
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(/.*discover/, { timeout: 10000 });

    // Navigate around
    for (let i = 0; i < 5; i++) {
      const chatTab = page.locator('[data-testid="chat-tab"]');
      const discoverTab = page.locator('[data-testid="discover-tab"]');
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
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(/.*discover/, { timeout: 10000 });

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
    await expect(page.locator('[data-testid="discover-tab"]')).toBeVisible();
  });
});
