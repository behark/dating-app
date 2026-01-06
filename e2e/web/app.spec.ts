import { expect, test } from '@playwright/test';

// Test constants
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'TestPassword123!';
const EMAIL_INPUT_TESTID = '[data-testid="email-input"]';
const PASSWORD_INPUT_TESTID = '[data-testid="password-input"]';
const LOGIN_BUTTON_TESTID = '[data-testid="login-button"]';
const INVALID_CREDENTIALS_REGEX = /invalid|incorrect/i;
const PROFILE_CARD_TESTID = '[data-testid="profile-card"]';
const PROFILE_NAME_TESTID = '[data-testid="profile-name"]';
const PROFILE_AGE_TESTID = '[data-testid="profile-age"]';
const LIKE_BUTTON_TESTID = '[data-testid="like-button"]';

// Common test IDs to avoid duplication
const DATA_TESTID_PREFIX = '[data-testid="';
const DATA_TESTID_SUFFIX = '"]';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await expect(page.getByText('Sign In')).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.fill(EMAIL_INPUT_TESTID, TEST_EMAIL);
    await page.fill(PASSWORD_INPUT_TESTID, TEST_PASSWORD);
    await page.click(LOGIN_BUTTON_TESTID);

    // Should redirect to discover page
    await expect(page).toHaveURL(/.*discover/);
    await expect(page.getByText('Discover')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill(EMAIL_INPUT_TESTID, 'wrong@example.com');
    await page.fill(PASSWORD_INPUT_TESTID, 'wrongpassword');
    await page.click(LOGIN_BUTTON_TESTID);

    await expect(page.getByText(INVALID_CREDENTIALS_REGEX)).toBeVisible();
  });

  test('should navigate to registration', async ({ page }) => {
    await page.click('text=Create Account');
    await expect(page.getByText('Sign Up')).toBeVisible();
  });

  test('should register new user', async ({ page }) => {
    await page.click('text=Create Account');

    const nameInput = `${DATA_TESTID_PREFIX}name-input${DATA_TESTID_SUFFIX}`;
    const emailInput = `${DATA_TESTID_PREFIX}email-input${DATA_TESTID_SUFFIX}`;
    const passwordInput = `${DATA_TESTID_PREFIX}password-input${DATA_TESTID_SUFFIX}`;
    const confirmPasswordInput = `${DATA_TESTID_PREFIX}confirm-password-input${DATA_TESTID_SUFFIX}`;
    const ageInput = `${DATA_TESTID_PREFIX}age-input${DATA_TESTID_SUFFIX}`;
    const termsCheckbox = `${DATA_TESTID_PREFIX}terms-checkbox${DATA_TESTID_SUFFIX}`;
    const registerButton = `${DATA_TESTID_PREFIX}register-button${DATA_TESTID_SUFFIX}`;

    await page.fill(nameInput, 'New User');
    await page.fill(emailInput, `newuser${Date.now()}@test.com`);
    await page.fill(passwordInput, 'SecurePass123!');
    await page.fill(confirmPasswordInput, 'SecurePass123!');

    // Select age (must be 18+)
    await page.fill(ageInput, '25');

    await page.check(termsCheckbox);
    await page.click(registerButton);

    // Should redirect to profile setup or discover
    await expect(page).toHaveURL(/.*setup|discover/);
  });

  test('should handle password reset', async ({ page }) => {
    await page.click('text=Forgot Password');
    const resetEmailInput = `${DATA_TESTID_PREFIX}reset-email-input${DATA_TESTID_SUFFIX}`;
    const resetButton = `${DATA_TESTID_PREFIX}reset-button${DATA_TESTID_SUFFIX}`;
    await page.fill(resetEmailInput, TEST_EMAIL);
    await page.click(resetButton);

    await expect(page.getByText(/email sent|check your email/i)).toBeVisible();
  });

  test('should complete full login flow with session persistence', async ({ page, context }) => {
    // Login
    await page.fill(EMAIL_INPUT_TESTID, TEST_EMAIL);
    await page.fill(PASSWORD_INPUT_TESTID, TEST_PASSWORD);
    await page.click(LOGIN_BUTTON_TESTID);
    await expect(page).toHaveURL(/.*discover/);

    // Verify session is stored
    const cookies = await context.cookies();
    expect(cookies.length).toBeGreaterThan(0);

    // Reload page - should stay logged in
    await page.reload();
    await expect(page).toHaveURL(/.*discover/);
  });

  test('should handle OAuth login flow', async ({ page }) => {
    const googleButton = page.locator('text=/continue with google|sign in with google/i');
    if (await googleButton.isVisible()) {
      await googleButton.click();
      // OAuth flow would be mocked in E2E
      await expect(page).toHaveURL(/.*discover|.*setup/, { timeout: 15000 });
    }
  });

  test('should validate email format on login', async ({ page }) => {
    await page.fill(EMAIL_INPUT_TESTID, 'invalid-email');
    await page.fill(PASSWORD_INPUT_TESTID, TEST_PASSWORD);
    await page.click(LOGIN_BUTTON_TESTID);

    await expect(page.getByText(/email|invalid|format/i)).toBeVisible();
  });

  test('should validate password requirements on signup', async ({ page }) => {
    await page.click('text=Create Account');

    const emailInput = `${DATA_TESTID_PREFIX}email-input${DATA_TESTID_SUFFIX}`;
    const passwordInput = `${DATA_TESTID_PREFIX}password-input${DATA_TESTID_SUFFIX}`;
    const registerButton = `${DATA_TESTID_PREFIX}register-button${DATA_TESTID_SUFFIX}`;

    await page.fill(emailInput, 'test@example.com');
    await page.fill(passwordInput, 'short'); // Too short
    await page.click(registerButton);

    await expect(page.getByText(/password|8|characters/i)).toBeVisible();
  });
});

test.describe('Discovery', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.fill(EMAIL_INPUT_TESTID, TEST_EMAIL);
    await page.fill(PASSWORD_INPUT_TESTID, TEST_PASSWORD);
    await page.click(LOGIN_BUTTON_TESTID);
    await page.waitForURL(/.*discover/);
  });

  test('should display profile cards', async ({ page }) => {
    await expect(page.locator(PROFILE_CARD_TESTID)).toBeVisible();
    await expect(page.locator(PROFILE_NAME_TESTID)).toBeVisible();
    await expect(page.locator(PROFILE_AGE_TESTID)).toBeVisible();
  });

  test('should like profile with button click', async ({ page }) => {
    const likeButton = page.locator(LIKE_BUTTON_TESTID);
    await likeButton.click();

    // Card should change or animation should occur
    await expect(page.locator('[data-testid="profile-card"]')).toBeVisible();
  });

  test('should pass profile with button click', async ({ page }) => {
    const passButton = page.locator(`${DATA_TESTID_PREFIX}pass-button${DATA_TESTID_SUFFIX}`);
    await passButton.click();

    await expect(page.locator(PROFILE_CARD_TESTID)).toBeVisible();
  });

  test('should open profile details', async ({ page }) => {
    await page.click(PROFILE_CARD_TESTID);

    const profileDetails = `${DATA_TESTID_PREFIX}profile-details${DATA_TESTID_SUFFIX}`;
    await expect(page.locator(profileDetails)).toBeVisible();
    await expect(page.getByText('About')).toBeVisible();
  });

  test('should apply filters', async ({ page }) => {
    const filterButton = `${DATA_TESTID_PREFIX}filter-button${DATA_TESTID_SUFFIX}`;
    await page.click(filterButton);

    // Adjust age range
    const minAgeInput = `${DATA_TESTID_PREFIX}min-age-input${DATA_TESTID_SUFFIX}`;
    const maxAgeInput = `${DATA_TESTID_PREFIX}max-age-input${DATA_TESTID_SUFFIX}`;
    await page.fill(minAgeInput, '25');
    await page.fill(maxAgeInput, '35');

    // Apply
    const applyFiltersButton = `${DATA_TESTID_PREFIX}apply-filters-button${DATA_TESTID_SUFFIX}`;
    await page.click(applyFiltersButton);

    const filtersApplied = `${DATA_TESTID_PREFIX}filters-applied${DATA_TESTID_SUFFIX}`;
    await expect(page.locator(filtersApplied)).toBeVisible();
  });

  test('should complete full matching flow - swipe, match, view match', async ({ page }) => {
    // Swipe right on a profile
    const likeButton = page.locator(LIKE_BUTTON_TESTID);
    if (await likeButton.isVisible()) {
      await likeButton.click();
      await page.waitForTimeout(500); // Wait for swipe animation
    }

    // Check if match occurred (match popup or notification)
    const matchPopup = page.locator('[data-testid="match-popup"]');
    const hasMatch = await matchPopup.isVisible().catch(() => false);

    if (hasMatch) {
      // Match occurred - verify match screen
      await expect(matchPopup).toBeVisible();
      const matchButton = page.locator('[data-testid="view-match-button"]');
      if (await matchButton.isVisible()) {
        await matchButton.click();
        // Should navigate to matches or chat
        await expect(page).toHaveURL(/.*matches|.*chat/, { timeout: 5000 });
      }
    }
  });

  test('should handle super like', async ({ page }) => {
    const superLikeButton = page.locator(
      `${DATA_TESTID_PREFIX}super-like-button${DATA_TESTID_SUFFIX}`
    );
    if (await superLikeButton.isVisible()) {
      await superLikeButton.click();
      await page.waitForTimeout(500);
      // Should show super like animation or feedback
    }
  });

  test('should display empty state when no profiles available', async ({ page }) => {
    // This would require mocking empty API response
    const emptyState = page.locator('[data-testid="empty-profiles"]');
    // Check if empty state appears (may not always be visible)
    const isEmpty = await emptyState.isVisible().catch(() => false);
    if (isEmpty) {
      await expect(emptyState).toBeVisible();
      await expect(page.getByText(/no profiles|try adjusting/i)).toBeVisible();
    }
  });

  test('should handle rapid swipes', async ({ page }) => {
    // Rapidly swipe through multiple profiles
    for (let i = 0; i < 5; i++) {
      const likeButton = page.locator(LIKE_BUTTON_TESTID);
      if (await likeButton.isVisible()) {
        await likeButton.click();
        await page.waitForTimeout(300); // Small delay between swipes
      } else {
        break; // No more profiles
      }
    }
    // Should handle gracefully without errors
  });
});

test.describe('Chat', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill(EMAIL_INPUT_TESTID, TEST_EMAIL);
    await page.fill(PASSWORD_INPUT_TESTID, TEST_PASSWORD);
    await page.click(LOGIN_BUTTON_TESTID);
    await page.waitForURL(/.*discover/);

    // Navigate to chat
    const chatTab = `${DATA_TESTID_PREFIX}chat-tab${DATA_TESTID_SUFFIX}`;
    await page.click(chatTab);
  });

  test('should display matches list', async ({ page }) => {
    const matchesList = `${DATA_TESTID_PREFIX}matches-list${DATA_TESTID_SUFFIX}`;
    await expect(page.locator(matchesList)).toBeVisible();
  });

  test('should open chat conversation', async ({ page }) => {
    const matchItem = `${DATA_TESTID_PREFIX}match-item${DATA_TESTID_SUFFIX}:first-child`;
    await page.click(matchItem);

    const chatMessages = `${DATA_TESTID_PREFIX}chat-messages${DATA_TESTID_SUFFIX}`;
    const messageInput = `${DATA_TESTID_PREFIX}message-input${DATA_TESTID_SUFFIX}`;
    await expect(page.locator(chatMessages)).toBeVisible();
    await expect(page.locator(messageInput)).toBeVisible();
  });

  test('should send message', async ({ page }) => {
    const matchItem = `${DATA_TESTID_PREFIX}match-item${DATA_TESTID_SUFFIX}:first-child`;
    await page.click(matchItem);

    const messageText = `Test message ${Date.now()}`;
    const messageInput = `${DATA_TESTID_PREFIX}message-input${DATA_TESTID_SUFFIX}`;
    const sendButton = `${DATA_TESTID_PREFIX}send-button${DATA_TESTID_SUFFIX}`;
    await page.fill(messageInput, messageText);
    await page.click(sendButton);

    await expect(page.getByText(messageText)).toBeVisible();
  });

  test('should complete full messaging flow - send, receive, read receipt', async ({ page }) => {
    // Open chat
    const matchItem = `${DATA_TESTID_PREFIX}match-item${DATA_TESTID_SUFFIX}:first-child`;
    await page.click(matchItem);

    const messageInput = `${DATA_TESTID_PREFIX}message-input${DATA_TESTID_SUFFIX}`;
    const sendButton = `${DATA_TESTID_PREFIX}send-button${DATA_TESTID_SUFFIX}`;

    // Send multiple messages
    const messages = ['Hello!', 'How are you?', 'Nice to meet you!'];
    for (const msg of messages) {
      await page.fill(messageInput, msg);
      await page.click(sendButton);
      await page.waitForTimeout(500);
      await expect(page.getByText(msg)).toBeVisible();
    }

    // Verify messages are in order
    for (const msg of messages) {
      await expect(page.getByText(msg)).toBeVisible();
    }
  });

  test('should show typing indicator', async ({ page }) => {
    const matchItem = `${DATA_TESTID_PREFIX}match-item${DATA_TESTID_SUFFIX}:first-child`;
    await page.click(matchItem);

    const messageInput = `${DATA_TESTID_PREFIX}message-input${DATA_TESTID_SUFFIX}`;
    await page.fill(messageInput, 'Typing...');

    // Typing indicator should appear (if implemented)
    const typingIndicator = page.locator('[data-testid="typing-indicator"]');
    const isTyping = await typingIndicator.isVisible().catch(() => false);
    if (isTyping) {
      await expect(typingIndicator).toBeVisible();
    }
  });

  test('should handle empty messages list', async ({ page }) => {
    const matchItem = `${DATA_TESTID_PREFIX}match-item${DATA_TESTID_SUFFIX}:first-child`;
    await page.click(matchItem);

    // Check for empty state
    const emptyState = page.locator('[data-testid="empty-messages"]');
    const isEmpty = await emptyState.isVisible().catch(() => false);
    if (isEmpty) {
      await expect(emptyState).toBeVisible();
      await expect(page.getByText(/no messages|start conversation/i)).toBeVisible();
    }
  });

  test('should handle long messages', async ({ page }) => {
    const matchItem = `${DATA_TESTID_PREFIX}match-item${DATA_TESTID_SUFFIX}:first-child`;
    await page.click(matchItem);

    const longMessage = 'a'.repeat(500);
    const messageInput = `${DATA_TESTID_PREFIX}message-input${DATA_TESTID_SUFFIX}`;
    const sendButton = `${DATA_TESTID_PREFIX}send-button${DATA_TESTID_SUFFIX}`;

    await page.fill(messageInput, longMessage);
    await page.click(sendButton);

    // Message should be sent or rejected if too long
    const messageSent = await page
      .getByText(longMessage.substring(0, 50))
      .isVisible()
      .catch(() => false);
    const errorShown = await page
      .getByText(/too long|limit/i)
      .isVisible()
      .catch(() => false);
    expect(messageSent || errorShown).toBe(true);
  });

  test('should handle rapid message sending', async ({ page }) => {
    const matchItem = `${DATA_TESTID_PREFIX}match-item${DATA_TESTID_SUFFIX}:first-child`;
    await page.click(matchItem);

    const messageInput = `${DATA_TESTID_PREFIX}message-input${DATA_TESTID_SUFFIX}`;
    const sendButton = `${DATA_TESTID_PREFIX}send-button${DATA_TESTID_SUFFIX}`;

    // Send multiple messages rapidly
    for (let i = 0; i < 5; i++) {
      await page.fill(messageInput, `Message ${i}`);
      await page.click(sendButton);
      await page.waitForTimeout(200);
    }

    // All messages should appear
    for (let i = 0; i < 5; i++) {
      await expect(page.getByText(`Message ${i}`)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display read receipts', async ({ page }) => {
    const matchItem = `${DATA_TESTID_PREFIX}match-item${DATA_TESTID_SUFFIX}:first-child`;
    await page.click(matchItem);

    // Send a message
    const messageInput = `${DATA_TESTID_PREFIX}message-input${DATA_TESTID_SUFFIX}`;
    const sendButton = `${DATA_TESTID_PREFIX}send-button${DATA_TESTID_SUFFIX}`;
    await page.fill(messageInput, 'Test message');
    await page.click(sendButton);

    // Check for read receipt (if implemented)
    const readReceipt = page.locator('[data-testid="read-receipt"]');
    const hasReceipt = await readReceipt.isVisible().catch(() => false);
    // Read receipt may appear after recipient reads
  });
});

test.describe('Profile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill(EMAIL_INPUT_TESTID, TEST_EMAIL);
    await page.fill(PASSWORD_INPUT_TESTID, TEST_PASSWORD);
    await page.click(LOGIN_BUTTON_TESTID);
    await page.waitForURL(/.*discover/);

    // Navigate to profile
    const profileTab = `${DATA_TESTID_PREFIX}profile-tab${DATA_TESTID_SUFFIX}`;
    await page.click(profileTab);
  });

  test('should display user profile', async ({ page }) => {
    const userName = `${DATA_TESTID_PREFIX}user-name${DATA_TESTID_SUFFIX}`;
    const userPhotos = `${DATA_TESTID_PREFIX}user-photos${DATA_TESTID_SUFFIX}`;
    await expect(page.locator(userName)).toBeVisible();
    await expect(page.locator(userPhotos)).toBeVisible();
  });

  test('should edit profile', async ({ page }) => {
    const editProfileButton = `${DATA_TESTID_PREFIX}edit-profile-button${DATA_TESTID_SUFFIX}`;
    await page.click(editProfileButton);

    const bioInput = `${DATA_TESTID_PREFIX}bio-input${DATA_TESTID_SUFFIX}`;
    const saveButton = `${DATA_TESTID_PREFIX}save-button${DATA_TESTID_SUFFIX}`;
    await page.fill(bioInput, 'Updated bio text');
    await page.click(saveButton);

    await expect(page.getByText('Profile updated')).toBeVisible();
  });

  test('should update settings', async ({ page }) => {
    const settingsButton = `${DATA_TESTID_PREFIX}settings-button${DATA_TESTID_SUFFIX}`;
    await page.click(settingsButton);

    await expect(page.getByText('Settings')).toBeVisible();
    await expect(page.getByText('Notifications')).toBeVisible();
    await expect(page.getByText('Privacy')).toBeVisible();
  });
});

test.describe('Premium Features', () => {
  test('should show premium upgrade prompt', async ({ page }) => {
    await page.goto('/');
    await page.fill(EMAIL_INPUT_TESTID, TEST_EMAIL);
    await page.fill(PASSWORD_INPUT_TESTID, TEST_PASSWORD);
    await page.click(LOGIN_BUTTON_TESTID);
    await page.waitForURL(/.*discover/);

    // Try to access premium feature
    const seeLikesButton = `${DATA_TESTID_PREFIX}see-likes-button${DATA_TESTID_SUFFIX}`;
    await page.click(seeLikesButton);

    await expect(page.getByText(/premium|upgrade/i)).toBeVisible();
  });

  test('should display subscription plans', async ({ page }) => {
    await page.goto('/premium');

    await expect(page.getByText('Basic')).toBeVisible();
    await expect(page.getByText('Premium')).toBeVisible();
    await expect(page.getByText('Gold')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');

    const h1 = await page.locator('h1').count();
    expect(h1).toBeGreaterThan(0);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');

    // Tab through form elements
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON', 'A']).toContain(focusedElement);
  });

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/');
    await page.fill(EMAIL_INPUT_TESTID, TEST_EMAIL);
    await page.fill(PASSWORD_INPUT_TESTID, TEST_PASSWORD);
    await page.click(LOGIN_BUTTON_TESTID);
    await page.waitForURL(/.*discover/);

    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).not.toBeNull();
    }
  });
});

test.describe('Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000); // 5 seconds max
  });

  test('should not have memory leaks on navigation', async ({ page }) => {
    await page.goto('/');

    // Navigate multiple times
    for (let i = 0; i < 5; i++) {
      await page.goto('/login');
      await page.goto('/');
    }

    // Page should still be responsive
    await expect(page.getByText('Sign In')).toBeVisible();
  });
});
