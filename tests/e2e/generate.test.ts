import { test, expect } from './fixtures';
import { MODELS } from '../../src/lib/image-generator';

test.describe('Generator Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the Google GenAI API
    await page.route(
      'https://generativelanguage.googleapis.com/**',
      async (route) => {
        const url = route.request().url();
        if (url.includes('generateContent') || url.includes('generateImages')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              candidates: [
                {
                  finishReason: 'STOP',
                  content: {
                    parts: [
                      {
                        inlineData: {
                          data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
                        },
                      },
                    ],
                  },
                },
              ],
              generatedImages: [
                {
                  // For Imagen
                  image: {
                    imageBytes:
                      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
                  },
                },
              ],
            }),
          });
        } else {
          await route.continue();
        }
      },
    );
  });

  test('loads successfully', async ({ page }) => {
    await page.goto('/generate');
    await expect(
      page.getByRole('heading', { name: 'Image Generator' }),
    ).toBeVisible();
    await expect(page.getByLabel('API Key')).toBeVisible();
  });

  test('can generate an image with mocked API', async ({ page }) => {
    await page.goto('/generate');

    // Enter API Key (mocked, but UI requires it)
    await page.getByLabel('API Key').fill('fake-key');
    await page.getByRole('button', { name: 'Save API Key' }).click();

    // Check if generator form is visible
    await expect(page.getByLabel('System Prompt')).toBeVisible();

    // Enter prompt
    await page.getByLabel('Your Prompt').fill('A cute monster');

    // Click generate
    await page.getByRole('button', { name: 'Generate' }).click();

    // Verify result
    await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible();
    await expect(page.locator('.image-grid img')).toHaveCount(4); // Default is 4
  });
});
