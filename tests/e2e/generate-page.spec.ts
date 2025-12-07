import { test, expect } from './fixtures';

test.describe('Generate Page', () => {
  test('should load the generate page', async ({ page }) => {
    await page.goto('/generate');

    // Page should load without errors
    await expect(page).toHaveURL('/generate');
  });

  test('should have a page title', async ({ page }) => {
    await page.goto('/generate');

    // Should have some title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should display the image generator interface', async ({ page }) => {
    await page.goto('/generate');

    // Should have a form or interface for generating images
    // Look for common elements that would be on a generate page
    const hasTextarea = await page.locator('textarea').count();
    const hasButton = await page.locator('button').count();

    // At minimum, page should have some interactive elements
    expect(hasTextarea + hasButton).toBeGreaterThan(0);
  });
});

test.describe('Homepage', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL('/');
  });

  test('should have navigation', async ({ page }) => {
    await page.goto('/');

    // Should have a nav element
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });
});
