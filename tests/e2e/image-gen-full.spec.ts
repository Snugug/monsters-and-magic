import { test, expect } from './fixtures';

test.describe('Image Generator Full Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear state
    await page.goto('/generate');
    await page.evaluate(async () => {
      const dbs = await window.indexedDB.databases();
      for (const db of dbs) {
        if (db.name) window.indexedDB.deleteDatabase(db.name);
      }
      window.localStorage.removeItem('apikey');
    });
    await page.reload();
  });

  test('should require API Key', async ({ page }) => {
    await expect(page.locator('form.api-key-form')).toBeVisible();
    await expect(page.locator('form.generator-form')).not.toBeVisible();

    await page.locator('input#apikey').fill('test-api-key');
    await page.getByRole('button', { name: 'Save API Key' }).click();

    await expect(page.locator('form.api-key-form')).not.toBeVisible();
    await expect(page.locator('form.generator-form')).toBeVisible();
  });

  test('should handle successful image generation', async ({ page }) => {
    // 1. Setup API Key
    await page.evaluate(() => localStorage.setItem('apikey', 'test-key'));
    await page.reload();

    // 2. Mock API Response
    await page.route(
      'https://generativelanguage.googleapis.com/**/*',
      async (route) => {
        const json = {
          candidates: [
            {
              finishReason: 'STOP',
              content: {
                parts: [
                  {
                    inlineData: {
                      mimeType: 'image/png',
                      data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', // 1x1 red pixel
                    },
                  },
                ],
              },
            },
          ],
        };
        await route.fulfill({ json });
      },
    );

    // 3. Fill Prompt
    await page.getByLabel('Your Prompt').fill('A red dot');

    // 4. Generate
    await page.getByRole('button', { name: 'Generate' }).click();

    // 5. Verify Result (Loader check implies timing, skipping to result check)

    // 6. Verify Result and Persistence check implicitly
    // 6. Verify Result and Persistence check implicitly
    const images = page.locator('.image-grid img');
    await expect(images).toHaveCount(4);
    for (const img of await images.all()) {
      await expect(img).toBeVisible();
      await expect(img).toHaveAttribute('src', /data:image\/png;base64/);
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // 1. Setup
    await page.evaluate(() => localStorage.setItem('apikey', 'test-key'));
    await page.reload();

    // 2. Mock Error Response
    await page.route(
      'https://generativelanguage.googleapis.com/**/*',
      async (route) => {
        await route.fulfill({
          status: 400,
          json: { error: { message: 'Invalid API Key' } },
        });
      },
    );

    // 3. Generate
    await page.getByLabel('Your Prompt').fill('Error test');
    await page.getByRole('button', { name: 'Generate' }).click();

    // 4. Verify Error Message
    await expect(page.locator('.error')).toBeVisible();
    await expect(page.locator('.error')).toContainText(
      'Error generating image',
    );
  });
});
