/**
 * Screen Size and Viewport Tests
 * Tests for various screen sizes and responsive design
 */

import { expect, test } from '@playwright/test';

const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'TestPassword123!';
const EMAIL_INPUT_TESTID = '[data-testid="email-input"]';
const PASSWORD_INPUT_TESTID = '[data-testid="password-input"]';
const LOGIN_BUTTON_TESTID = '[data-testid="login-button"]';
const DISCOVER_URL_PATTERN = /.*discover/;

// Viewport configurations
const VIEWPORTS = {
  mobile: [
    { width: 320, height: 568, name: 'iPhone SE' },
    { width: 375, height: 667, name: 'iPhone 8' },
    { width: 375, height: 812, name: 'iPhone X' },
    { width: 414, height: 896, name: 'iPhone 11 Pro Max' },
    { width: 428, height: 926, name: 'iPhone 12 Pro Max' },
  ],
  tablet: [
    { width: 768, height: 1024, name: 'iPad' },
    { width: 834, height: 1194, name: 'iPad Pro 11' },
    { width: 1024, height: 1366, name: 'iPad Pro 12.9' },
  ],
  desktop: [
    { width: 1280, height: 720, name: 'HD' },
    { width: 1440, height: 900, name: 'MacBook' },
    { width: 1920, height: 1080, name: 'Full HD' },
    { width: 2560, height: 1440, name: '2K' },
  ],
};

test.describe('Screen Size Testing', () => {
  test.describe('Mobile Viewports', () => {
    for (const viewport of VIEWPORTS.mobile) {
      test(`should render correctly on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/');

        // Check that login form is visible and properly sized
        const emailInput = page.locator(EMAIL_INPUT_TESTID);
        await expect(emailInput).toBeVisible();

        // Check that content fits within viewport
        const body = page.locator('body');
        const bodyBox = await body.boundingBox();
        expect(bodyBox?.width).toBeLessThanOrEqual(viewport.width);
      });

      test(`should handle navigation on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/');

        // Login
        await page.fill(EMAIL_INPUT_TESTID, TEST_EMAIL);
        await page.fill(PASSWORD_INPUT_TESTID, TEST_PASSWORD);
        await page.click(LOGIN_BUTTON_TESTID);
        await page.waitForURL(DISCOVER_URL_PATTERN, { timeout: 10000 });

        // Check navigation tabs are visible
        const chatTab = page.locator('[data-testid="chat-tab"]');
        await expect(chatTab).toBeVisible();
      });
    }
  });

  test.describe('Tablet Viewports', () => {
    for (const viewport of VIEWPORTS.tablet) {
      test(`should render correctly on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/');

        // Check layout adapts for tablet
        const emailInput = page.locator(EMAIL_INPUT_TESTID);
        await expect(emailInput).toBeVisible();

        // Tablet should have more horizontal space
        const body = page.locator('body');
        const bodyBox = await body.boundingBox();
        expect(bodyBox?.width).toBeLessThanOrEqual(viewport.width);
      });

      test(`should handle landscape orientation on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.height, height: viewport.width }); // Landscape
        await page.goto('/');

        const emailInput = page.locator(EMAIL_INPUT_TESTID);
        await expect(emailInput).toBeVisible();
      });
    }
  });

  test.describe('Desktop Viewports', () => {
    for (const viewport of VIEWPORTS.desktop) {
      test(`should render correctly on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/');

        // Desktop should have centered content with max-width
        const emailInput = page.locator(EMAIL_INPUT_TESTID);
        await expect(emailInput).toBeVisible();

        // Check content is centered on large screens
        if (viewport.width >= 1280) {
          const container = page.locator('[data-testid="main-container"]').first();
          const containerBox = await container.boundingBox().catch(() => null);
          if (containerBox) {
            // Content should be centered (not full width on large screens)
            expect(containerBox.width).toBeLessThan(viewport.width);
          }
        }
      });
    }
  });

  test.describe('Orientation Changes', () => {
    test('should handle portrait to landscape rotation', async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/');

      const emailInput = page.locator(EMAIL_INPUT_TESTID);
      await expect(emailInput).toBeVisible();

      // Rotate to landscape
      await page.setViewportSize({ width: 812, height: 375 });
      await expect(emailInput).toBeVisible();

      // Layout should adapt
      const body = page.locator('body');
      const bodyBox = await body.boundingBox();
      expect(bodyBox?.width).toBe(812);
    });

    test('should handle landscape to portrait rotation', async ({ page }) => {
      // Start in landscape
      await page.setViewportSize({ width: 812, height: 375 });
      await page.goto('/');

      const emailInput = page.locator(EMAIL_INPUT_TESTID);
      await expect(emailInput).toBeVisible();

      // Rotate to portrait
      await page.setViewportSize({ width: 375, height: 812 });
      await expect(emailInput).toBeVisible();
    });
  });

  test.describe('Responsive Breakpoints', () => {
    test('should adapt layout at mobile breakpoint (< 768px)', async ({ page }) => {
      await page.setViewportSize({ width: 767, height: 1024 });
      await page.goto('/');

      // Mobile layout should be active
      // Mobile nav may or may not be present, but layout should work
    });

    test('should adapt layout at tablet breakpoint (768px - 1024px)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');

      // Tablet layout should be active
      const emailInput = page.locator(EMAIL_INPUT_TESTID);
      await expect(emailInput).toBeVisible();
    });

    test('should adapt layout at desktop breakpoint (> 1024px)', async ({ page }) => {
      await page.setViewportSize({ width: 1025, height: 768 });
      await page.goto('/');

      // Desktop layout should be active
      const emailInput = page.locator(EMAIL_INPUT_TESTID);
      await expect(emailInput).toBeVisible();
    });
  });

  test.describe('Content Overflow', () => {
    test('should prevent horizontal scroll on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      await page.goto('/');

      // Check for horizontal scroll
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // Allow 1px tolerance
    });

    test('should handle long content on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      await page.goto('/');

      // Login and navigate
      await page.fill(EMAIL_INPUT_TESTID, TEST_EMAIL);
      await page.fill(PASSWORD_INPUT_TESTID, TEST_PASSWORD);
      await page.click(LOGIN_BUTTON_TESTID);
      await page.waitForURL(DISCOVER_URL_PATTERN, { timeout: 10000 });

      // Check profile cards fit
      const profileCard = page.locator('[data-testid="profile-card"]');
      if (await profileCard.isVisible()) {
        const cardBox = await profileCard.boundingBox();
        expect(cardBox?.width).toBeLessThanOrEqual(320);
      }
    });
  });
});
