import { test, expect } from '@playwright/test';

test.describe('API Key Sharing', () => {
  test.beforeEach(async ({ page }) => {
    // Clear key to start fresh
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('apikey'));
  });

  test('should share key from /generate to /build-a-monster', async ({
    page,
  }) => {
    // 1. Visit /generate and set key
    await page.goto('/generate');

    // Check we are asked for key
    const keyInput = page.locator('input[id="apikey"]');
    await expect(keyInput).toBeVisible();

    await keyInput.fill('shared-key-A');
    await page.click('button:has-text("Save API Key")');

    // Verify /generate is now ready (shows prompt input)
    await expect(page.locator('textarea[id="user-prompt"]')).toBeVisible();

    // 2. Visit /build-a-monster
    await page.goto('/build-a-monster');

    // Open generator
    await page.getByRole('button', { name: 'Generate an Image' }).click();

    // Verify it shows prompt input immediately (key shared)
    await expect(page.locator('textarea[name="prompt"]')).toBeVisible();

    // Ensure key input is NOT visible
    await expect(page.locator('input[name="apikey"]')).not.toBeVisible();
  });

  test('should share key from /build-a-monster to /generate', async ({
    page,
  }) => {
    // 1. Visit /build-a-monster and set key
    await page.goto('/build-a-monster');
    await page.getByRole('button', { name: 'Generate an Image' }).click();

    // Check we are asked for key
    const keyInput = page.locator('input[name="apikey"]');
    await expect(keyInput).toBeVisible();

    await keyInput.fill('shared-key-B');
    await page.click('input[value="Add API Key"]');

    // Verify /build-a-monster is now ready
    await expect(page.locator('textarea[name="prompt"]')).toBeVisible();

    // 2. Visit /generate
    await page.goto('/generate');

    // Verify it shows prompt input immediately (key shared)
    const genPrompt = page.locator('textarea[id="user-prompt"]');
    await expect(genPrompt).toBeVisible();

    // Ensure key input is NOT visible
    await expect(page.locator('input[id="apikey"]')).not.toBeVisible();
  });
});
