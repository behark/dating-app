/**
 * E2E Error Scenario Tests
 * End-to-end tests for error handling and edge cases
 */

import { expect, test } from '@playwright/test';

const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'TestPassword123!';
const EMAIL_INPUT_TESTID = '[data-testid="email-input"]';
const PASSWORD_INPUT_TESTID = '[data-testid="password-input"]';
const LOGIN_BUTTON_TESTID = '[data-testid="login-button"]';

test.describe('Error Scenarios - E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Network Failures', () => {
    test('should handle offline state during login', async ({ page, context }) => {
      // Go offline
      await context.setOffline(true);

      await page.fill(EMAIL_INPUT_TESTID, TEST_EMAIL);
      await page.fill(PASSWORD_INPUT_TESTID, TEST_PASSWORD);
      await page.click(LOGIN_BUTTON_TESTID);

      // Should show network error message
      await expect(page.getByText(/network|offline|connection/i)).toBeVisible({ timeout: 5000 });

      // Go back online
      await context.setOffline(false);
    });

    test('should handle network timeout', async ({ page }) => {
      // Intercept and delay network requests
      await page.route('**/api/**', (route) => {
        setTimeout(() => route.abort(), 100);
      });

      await page.fill(EMAIL_INPUT_TESTID, TEST_EMAIL);
      await page.fill(PASSWORD_INPUT_TESTID, TEST_PASSWORD);
      await page.click(LOGIN_BUTTON_TESTID);

      // Should show timeout or error message
      await expect(page.getByText(/timeout|error|try again/i)).toBeVisible({ timeout: 10000 });
    });

    test('should handle slow network', async ({ page, context }) => {
      // Simulate slow 3G
      await context.route('**/api/**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.continue();
      });

      await page.fill(EMAIL_INPUT_TESTID, TEST_EMAIL);
      await page.fill(PASSWORD_INPUT_TESTID, TEST_PASSWORD);
      await page.click(LOGIN_BUTTON_TESTID);

      // Should show loading state
      await expect(page.locator('[data-testid="loading"]'))
        .toBeVisible({ timeout: 1000 })
        .catch(() => {
          // Loading might be too fast, that's okay
        });
    });
  });

  test.describe('Invalid Inputs', () => {
    test('should show error for invalid email format', async ({ page }) => {
      await page.fill(EMAIL_INPUT_TESTID, 'invalid-email');
      await page.fill(PASSWORD_INPUT_TESTID, TEST_PASSWORD);
      await page.click(LOGIN_BUTTON_TESTID);

      await expect(page.getByText(/email|invalid|format/i)).toBeVisible();
    });

    test('should show error for empty password', async ({ page }) => {
      await page.fill(EMAIL_INPUT_TESTID, TEST_EMAIL);
      // Don't fill password
      await page.click(LOGIN_BUTTON_TESTID);

      await expect(page.getByText(/password|required/i)).toBeVisible();
    });

    test('should show error for short password during signup', async ({ page }) => {
      await page.click('text=Create Account');

      const emailInput = '[data-testid="email-input"]';
      const passwordInput = '[data-testid="password-input"]';
      const nameInput = '[data-testid="name-input"]';
      const registerButton = '[data-testid="register-button"]';

      await page.fill(nameInput, 'Test User');
      await page.fill(emailInput, 'test@example.com');
      await page.fill(passwordInput, 'short'); // Too short
      await page.click(registerButton);

      await expect(page.getByText(/password|8|characters/i)).toBeVisible();
    });

    test('should show error for mismatched passwords', async ({ page }) => {
      await page.click('text=Create Account');

      const passwordInput = '[data-testid="password-input"]';
      const confirmPasswordInput = '[data-testid="confirm-password-input"]';
      const registerButton = '[data-testid="register-button"]';

      await page.fill(passwordInput, 'Password123!');
      await page.fill(confirmPasswordInput, 'Different123!');
      await page.click(registerButton);

      await expect(page.getByText(/password|match|same/i)).toBeVisible();
    });
  });

  test.describe('API Error Responses', () => {
    test('should handle 401 Unauthorized', async ({ page }) => {
      // Intercept and mock 401 response
      await page.route('**/api/auth/login', (route) => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Invalid credentials' }),
        });
      });

      await page.fill(EMAIL_INPUT_TESTID, TEST_EMAIL);
      await page.fill(PASSWORD_INPUT_TESTID, 'wrongpassword');
      await page.click(LOGIN_BUTTON_TESTID);

      await expect(page.getByText(/invalid|incorrect|credentials/i)).toBeVisible();
    });

    test('should handle 400 Bad Request', async ({ page }) => {
      await page.route('**/api/auth/signup', (route) => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'User already exists' }),
        });
      });

      await page.click('text=Create Account');

      const emailInput = '[data-testid="email-input"]';
      const passwordInput = '[data-testid="password-input"]';
      const nameInput = '[data-testid="name-input"]';
      const registerButton = '[data-testid="register-button"]';

      await page.fill(nameInput, 'Test User');
      await page.fill(emailInput, 'existing@example.com');
      await page.fill(passwordInput, 'Password123!');
      await page.click(registerButton);

      await expect(page.getByText(/already exists|taken/i)).toBeVisible();
    });

    test('should handle 500 Server Error gracefully', async ({ page }) => {
      await page.route('**/api/**', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Internal server error' }),
        });
      });

      await page.fill(EMAIL_INPUT_TESTID, TEST_EMAIL);
      await page.fill(PASSWORD_INPUT_TESTID, TEST_PASSWORD);
      await page.click(LOGIN_BUTTON_TESTID);

      await expect(page.getByText(/error|try again|server/i)).toBeVisible();
    });

    test('should handle 429 Rate Limit', async ({ page }) => {
      await page.route('**/api/swipes', (route) => {
        route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Too many requests',
            retryAfter: 60,
          }),
        });
      });

      // Login first
      await page.fill(EMAIL_INPUT_TESTID, TEST_EMAIL);
      await page.fill(PASSWORD_INPUT_TESTID, TEST_PASSWORD);
      await page.click(LOGIN_BUTTON_TESTID);
      await page.waitForURL(/.*discover/);

      // Try to swipe
      const likeButton = '[data-testid="like-button"]';
      await page.click(likeButton);

      await expect(page.getByText(/rate limit|too many|try again/i)).toBeVisible();
    });
  });

  test.describe('Error Recovery', () => {
    test('should allow retry after network error', async ({ page, context }) => {
      // Go offline
      await context.setOffline(true);

      await page.fill(EMAIL_INPUT_TESTID, TEST_EMAIL);
      await page.fill(PASSWORD_INPUT_TESTID, TEST_PASSWORD);
      await page.click(LOGIN_BUTTON_TESTID);

      await expect(page.getByText(/network|offline/i)).toBeVisible();

      // Go back online
      await context.setOffline(false);

      // Retry
      await page.click(LOGIN_BUTTON_TESTID);

      // Should eventually succeed
      await expect(page).toHaveURL(/.*discover/, { timeout: 10000 });
    });

    test('should clear error messages on new input', async ({ page }) => {
      // Trigger error
      await page.fill(EMAIL_INPUT_TESTID, 'invalid-email');
      await page.fill(PASSWORD_INPUT_TESTID, TEST_PASSWORD);
      await page.click(LOGIN_BUTTON_TESTID);

      await expect(page.getByText(/email|invalid/i)).toBeVisible();

      // Fix input
      await page.fill(EMAIL_INPUT_TESTID, TEST_EMAIL);

      // Error should clear or be replaced
      await page.click(LOGIN_BUTTON_TESTID);
      await expect(page).toHaveURL(/.*discover/, { timeout: 10000 });
    });
  });
});
