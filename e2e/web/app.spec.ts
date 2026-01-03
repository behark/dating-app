import { expect, test } from '@playwright/test';

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
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');

    // Should redirect to discover page
    await expect(page).toHaveURL(/.*discover/);
    await expect(page.getByText('Discover')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('[data-testid="email-input"]', 'wrong@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');

    await expect(page.getByText(/invalid|incorrect/i)).toBeVisible();
  });

  test('should navigate to registration', async ({ page }) => {
    await page.click('text=Create Account');
    await expect(page.getByText('Sign Up')).toBeVisible();
  });

  test('should register new user', async ({ page }) => {
    await page.click('text=Create Account');
    
    await page.fill('[data-testid="name-input"]', 'New User');
    await page.fill('[data-testid="email-input"]', `newuser${Date.now()}@test.com`);
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.fill('[data-testid="confirm-password-input"]', 'SecurePass123!');
    
    // Select age (must be 18+)
    await page.fill('[data-testid="age-input"]', '25');
    
    await page.check('[data-testid="terms-checkbox"]');
    await page.click('[data-testid="register-button"]');

    // Should redirect to profile setup or discover
    await expect(page).toHaveURL(/.*setup|discover/);
  });

  test('should handle password reset', async ({ page }) => {
    await page.click('text=Forgot Password');
    await page.fill('[data-testid="reset-email-input"]', 'test@example.com');
    await page.click('[data-testid="reset-button"]');

    await expect(page.getByText(/email sent|check your email/i)).toBeVisible();
  });
});

test.describe('Discovery', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(/.*discover/);
  });

  test('should display profile cards', async ({ page }) => {
    await expect(page.locator('[data-testid="profile-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="profile-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="profile-age"]')).toBeVisible();
  });

  test('should like profile with button click', async ({ page }) => {
    const likeButton = page.locator('[data-testid="like-button"]');
    await likeButton.click();

    // Card should change or animation should occur
    await expect(page.locator('[data-testid="profile-card"]')).toBeVisible();
  });

  test('should pass profile with button click', async ({ page }) => {
    const passButton = page.locator('[data-testid="pass-button"]');
    await passButton.click();

    await expect(page.locator('[data-testid="profile-card"]')).toBeVisible();
  });

  test('should open profile details', async ({ page }) => {
    await page.click('[data-testid="profile-card"]');
    
    await expect(page.locator('[data-testid="profile-details"]')).toBeVisible();
    await expect(page.getByText('About')).toBeVisible();
  });

  test('should apply filters', async ({ page }) => {
    await page.click('[data-testid="filter-button"]');
    
    // Adjust age range
    await page.fill('[data-testid="min-age-input"]', '25');
    await page.fill('[data-testid="max-age-input"]', '35');
    
    // Apply
    await page.click('[data-testid="apply-filters-button"]');
    
    await expect(page.locator('[data-testid="filters-applied"]')).toBeVisible();
  });
});

test.describe('Chat', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(/.*discover/);
    
    // Navigate to chat
    await page.click('[data-testid="chat-tab"]');
  });

  test('should display matches list', async ({ page }) => {
    await expect(page.locator('[data-testid="matches-list"]')).toBeVisible();
  });

  test('should open chat conversation', async ({ page }) => {
    await page.click('[data-testid="match-item"]:first-child');
    
    await expect(page.locator('[data-testid="chat-messages"]')).toBeVisible();
    await expect(page.locator('[data-testid="message-input"]')).toBeVisible();
  });

  test('should send message', async ({ page }) => {
    await page.click('[data-testid="match-item"]:first-child');
    
    const messageText = `Test message ${Date.now()}`;
    await page.fill('[data-testid="message-input"]', messageText);
    await page.click('[data-testid="send-button"]');

    await expect(page.getByText(messageText)).toBeVisible();
  });
});

test.describe('Profile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(/.*discover/);
    
    // Navigate to profile
    await page.click('[data-testid="profile-tab"]');
  });

  test('should display user profile', async ({ page }) => {
    await expect(page.locator('[data-testid="user-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-photos"]')).toBeVisible();
  });

  test('should edit profile', async ({ page }) => {
    await page.click('[data-testid="edit-profile-button"]');
    
    await page.fill('[data-testid="bio-input"]', 'Updated bio text');
    await page.click('[data-testid="save-button"]');

    await expect(page.getByText('Profile updated')).toBeVisible();
  });

  test('should update settings', async ({ page }) => {
    await page.click('[data-testid="settings-button"]');
    
    await expect(page.getByText('Settings')).toBeVisible();
    await expect(page.getByText('Notifications')).toBeVisible();
    await expect(page.getByText('Privacy')).toBeVisible();
  });
});

test.describe('Premium Features', () => {
  test('should show premium upgrade prompt', async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(/.*discover/);

    // Try to access premium feature
    await page.click('[data-testid="see-likes-button"]');
    
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
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
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
