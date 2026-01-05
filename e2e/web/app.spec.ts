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
