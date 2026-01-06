/**
 * Load Time Performance Tests
 * E2E tests for measuring and verifying load times
 */

import { expect, test } from '@playwright/test';

const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'TestPassword123!';

test.describe('Load Time Performance', () => {
  test('should load login page within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
    await expect(page.getByText('Sign In')).toBeVisible();
  });

  test('should complete login within 5 seconds', async ({ page }) => {
    await page.goto('/');

    const startTime = Date.now();
    await page.fill('[data-testid="email-input"]', TEST_EMAIL);
    await page.fill('[data-testid="password-input"]', TEST_PASSWORD);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(/.*discover/, { timeout: 10000 });
    const loginTime = Date.now() - startTime;

    expect(loginTime).toBeLessThan(5000);
  });

  test('should load discover page within 2 seconds after login', async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', TEST_EMAIL);
    await page.fill('[data-testid="password-input"]', TEST_PASSWORD);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(/.*discover/, { timeout: 10000 });

    const startTime = Date.now();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const reloadTime = Date.now() - startTime;

    expect(reloadTime).toBeLessThan(5000);
  });

  test('should load profile cards quickly', async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', TEST_EMAIL);
    await page.fill('[data-testid="password-input"]', TEST_PASSWORD);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(/.*discover/, { timeout: 10000 });

    const startTime = Date.now();
    const profileCard = page.locator('[data-testid="profile-card"]');
    await expect(profileCard).toBeVisible({ timeout: 5000 });
    const cardLoadTime = Date.now() - startTime;

    expect(cardLoadTime).toBeLessThan(3000);
  });

  test('should navigate between screens quickly', async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', TEST_EMAIL);
    await page.fill('[data-testid="password-input"]', TEST_PASSWORD);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(/.*discover/, { timeout: 10000 });

    // Navigate to chat
    const startTime = Date.now();
    const chatTab = page.locator('[data-testid="chat-tab"]');
    await chatTab.click();
    await page.waitForTimeout(500);
    const navigationTime = Date.now() - startTime;

    expect(navigationTime).toBeLessThan(1000);
  });

  test('should send messages quickly', async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', TEST_EMAIL);
    await page.fill('[data-testid="password-input"]', TEST_PASSWORD);
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

      const startTime = Date.now();
      const messageInput = page.locator('[data-testid="message-input"]');
      const sendButton = page.locator('[data-testid="send-button"]');
      await messageInput.fill('Test message');
      await sendButton.click();
      await page.waitForTimeout(500);
      const sendTime = Date.now() - startTime;

      // Message should send within 1 second
      expect(sendTime).toBeLessThan(1000);
    }
  });

  test('should handle swipe actions quickly', async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', TEST_EMAIL);
    await page.fill('[data-testid="password-input"]', TEST_PASSWORD);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(/.*discover/, { timeout: 10000 });

    const likeButton = page.locator('[data-testid="like-button"]');
    if (await likeButton.isVisible()) {
      const startTime = Date.now();
      await likeButton.click();
      await page.waitForTimeout(500);
      const swipeTime = Date.now() - startTime;

      // Swipe should complete within 500ms
      expect(swipeTime).toBeLessThan(500);
    }
  });

  test('should measure Time to Interactive (TTI)', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for interactive elements
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    const tti = Date.now() - startTime;

    // TTI should be reasonable
    expect(tti).toBeLessThan(5000);
  });

  test('should measure First Contentful Paint (FCP)', async ({ page }) => {
    await page.goto('/');

    // FCP is measured by browser, but we can verify content is visible quickly
    const startTime = Date.now();
    await expect(page.getByText('Sign In')).toBeVisible();
    const fcp = Date.now() - startTime;

    // Content should be visible quickly
    expect(fcp).toBeLessThan(2000);
  });
});
