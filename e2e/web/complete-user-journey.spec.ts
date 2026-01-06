/**
 * Complete User Journey E2E Tests
 * End-to-end tests covering complete user flows from signup to messaging
 */

import { expect, test } from '@playwright/test';

const DATA_TESTID_PREFIX = '[data-testid="';
const DATA_TESTID_SUFFIX = '"]';

test.describe('Complete User Journey', () => {
  test('should complete full user journey: signup -> profile setup -> discover -> match -> chat', async ({
    page,
  }) => {
    // Step 1: Signup
    await page.goto('/');
    await page.click('text=Create Account');

    const timestamp = Date.now();
    const email = `testuser${timestamp}@example.com`;

    await page.fill(`${DATA_TESTID_PREFIX}name-input${DATA_TESTID_SUFFIX}`, 'Test User');
    await page.fill(`${DATA_TESTID_PREFIX}email-input${DATA_TESTID_SUFFIX}`, email);
    await page.fill(`${DATA_TESTID_PREFIX}password-input${DATA_TESTID_SUFFIX}`, 'SecurePass123!');
    await page.fill(
      `${DATA_TESTID_PREFIX}confirm-password-input${DATA_TESTID_SUFFIX}`,
      'SecurePass123!'
    );
    await page.fill(`${DATA_TESTID_PREFIX}age-input${DATA_TESTID_SUFFIX}`, '25');
    await page.check(`${DATA_TESTID_PREFIX}terms-checkbox${DATA_TESTID_SUFFIX}`);
    await page.click(`${DATA_TESTID_PREFIX}register-button${DATA_TESTID_SUFFIX}`);

    // Should redirect to profile setup or discover
    await expect(page).toHaveURL(/.*setup|discover/, { timeout: 10000 });

    // Step 2: Profile Setup (if redirected to setup)
    if (page.url().includes('setup')) {
      const bioInput = `${DATA_TESTID_PREFIX}bio-input${DATA_TESTID_SUFFIX}`;
      if (await page.locator(bioInput).isVisible()) {
        await page.fill(bioInput, 'This is my test bio');
        await page.click(`${DATA_TESTID_PREFIX}save-profile-button${DATA_TESTID_SUFFIX}`);
        await expect(page).toHaveURL(/.*discover/, { timeout: 5000 });
      }
    }

    // Step 3: Discover and Swipe
    await expect(page).toHaveURL(/.*discover/);
    const profileCard = page.locator('[data-testid="profile-card"]');
    if (await profileCard.isVisible()) {
      // Swipe right on a profile
      const likeButton = page.locator('[data-testid="like-button"]');
      await likeButton.click();
      await page.waitForTimeout(1000);
    }

    // Step 4: Navigate to Matches/Chat
    const chatTab = `${DATA_TESTID_PREFIX}chat-tab${DATA_TESTID_SUFFIX}`;
    await page.click(chatTab);

    // Step 5: Open chat if match exists
    const matchItem = `${DATA_TESTID_PREFIX}match-item${DATA_TESTID_SUFFIX}:first-child`;
    const hasMatch = await matchItem.isVisible().catch(() => false);

    if (hasMatch) {
      await page.click(matchItem);

      // Step 6: Send a message
      const messageInput = `${DATA_TESTID_PREFIX}message-input${DATA_TESTID_SUFFIX}`;
      const sendButton = `${DATA_TESTID_PREFIX}send-button${DATA_TESTID_SUFFIX}`;

      if (await page.locator(messageInput).isVisible()) {
        await page.fill(messageInput, 'Hello! This is a test message.');
        await page.click(sendButton);
        await expect(page.getByText('Hello! This is a test message.')).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });

  test('should handle login -> discover -> match -> message flow', async ({ page }) => {
    // Step 1: Login
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/.*discover/, { timeout: 10000 });

    // Step 2: Discover profiles
    const profileCard = page.locator('[data-testid="profile-card"]');
    if (await profileCard.isVisible()) {
      // View profile details
      await profileCard.click();
      await page.waitForTimeout(500);

      // Go back and swipe
      const backButton = page.locator('[data-testid="back-button"]');
      if (await backButton.isVisible()) {
        await backButton.click();
      }

      // Swipe right
      const likeButton = page.locator('[data-testid="like-button"]');
      await likeButton.click();
      await page.waitForTimeout(1000);
    }

    // Step 3: Check for matches
    const chatTab = `${DATA_TESTID_PREFIX}chat-tab${DATA_TESTID_SUFFIX}`;
    await page.click(chatTab);

    const matchItem = `${DATA_TESTID_PREFIX}match-item${DATA_TESTID_SUFFIX}:first-child`;
    const hasMatch = await matchItem.isVisible().catch(() => false);

    if (hasMatch) {
      await page.click(matchItem);

      // Step 4: Send message
      const messageInput = `${DATA_TESTID_PREFIX}message-input${DATA_TESTID_SUFFIX}`;
      const sendButton = `${DATA_TESTID_PREFIX}send-button${DATA_TESTID_SUFFIX}`;

      if (await page.locator(messageInput).isVisible()) {
        await page.fill(messageInput, 'Hi there!');
        await page.click(sendButton);
        await expect(page.getByText('Hi there!')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should handle profile editing flow', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/.*discover/, { timeout: 10000 });

    // Navigate to profile
    const profileTab = `${DATA_TESTID_PREFIX}profile-tab${DATA_TESTID_SUFFIX}`;
    await page.click(profileTab);

    // Edit profile
    const editButton = `${DATA_TESTID_PREFIX}edit-profile-button${DATA_TESTID_SUFFIX}`;
    if (await page.locator(editButton).isVisible()) {
      await page.click(editButton);

      const bioInput = `${DATA_TESTID_PREFIX}bio-input${DATA_TESTID_SUFFIX}`;
      if (await page.locator(bioInput).isVisible()) {
        await page.fill(bioInput, 'Updated bio text');
        await page.click(`${DATA_TESTID_PREFIX}save-button${DATA_TESTID_SUFFIX}`);
        await expect(page.getByText(/updated|saved/i)).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
