import { test, expect } from './fixtures';

test.describe('ImagePicker Bug Fixes', () => {
  // Setup: Ensure we are on the page with a clean slate
  test.beforeEach(async ({ page }) => {
    await page.goto('/build-a-monster');
    // Ensure API Key logic doesn't block us (sharing test covered this, but let's be safe)
    await page.evaluate(() => localStorage.setItem('apikey', 'dummy-key'));
    // Reload to pick up key
    await page.reload();
  });

  test('should use generated image without blanking it', async ({ page }) => {
    // 1. Open Generator
    await page.getByRole('button', { name: 'Generate an Image' }).click();

    // 2. Mock generation result by manipulating state directly or mocking `ImageGenerator`?
    // Mocking the generator class is hard in E2E.
    // Instead, we can simulate the "success" state by setting `preview` variable if possible?
    // Or we can just use the "Change Image" flow which uses similar logic?
    // Wait, the bug is specific to the "Use" button flow in the popover.

    // Let's populate the prompt and click generate, but MOCK the `generator.generate` call at the network level?
    // `ImageGenerator` calls Google AI. we should mock that.
    // Host: https://generativelanguage.googleapis.com

    await page.route(
      'https://generativelanguage.googleapis.com/**/*',
      async (route) => {
        // Mock successful image response
        // The response structure is complex.
        // Maybe it's easier to simulate "preview" being set by evaluating JS?
        // But we can't access component state easily.

        // Let's try to mock the specific call.
        const json = {
          candidates: [
            {
              content: {
                parts: [
                  {
                    inlineData: {
                      data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=', // 1x1 red pixel
                    },
                  },
                ],
              },
              finishReason: 'STOP',
            },
          ],
        };
        await route.fulfill({ json });
      },
    );

    // Fill prompt
    await page.fill('textarea[name="prompt"]', 'A red pixel');

    // Click Generate
    await page.click('input[value="Generate image"]');

    // Wait for "Use" button to appear (meaning preview is set)
    const useBtn = page.locator('button:has-text("Use")');
    await expect(useBtn).toBeVisible({ timeout: 10000 });

    // 3. Click "Use"
    await useBtn.click();

    // 4. Verify Popover Closed
    await expect(page.locator('#i-instance')).toBeHidden(); // ID is dynamic? `const instance = ...`
    // The popover has class `generate`.
    await expect(page.locator('form.generate')).toBeHidden();

    // 5. Verify Image is set in the main picker
    // If bug exists, image would be blank/empty.
    // If fix works, image should be the red pixel.
    const img = page.locator('.image .big-preview img');
    await expect(img).toBeVisible();
    const src = await img.getAttribute('src');
    expect(src).toContain('data:image/png;base64');
  });

  test('should handle save without crash when no folder selected', async ({
    page,
  }) => {
    // 1. Open Generator and get a preview (re-use mock)
    await page.route(
      'https://generativelanguage.googleapis.com/**/*',
      async (route) => {
        const json = {
          candidates: [
            {
              content: {
                parts: [
                  {
                    inlineData: {
                      data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=',
                    },
                  },
                ],
              },
              finishReason: 'STOP',
            },
          ],
        };
        await route.fulfill({ json });
      },
    );

    await page.getByRole('button', { name: 'Generate an Image' }).click();
    await page.fill('textarea[name="prompt"]', 'A red pixel');
    await page.click('input[value="Generate image"]');

    // 2. Click Save
    // We need to verify it calls showSaveFilePicker.
    // And DOES NOT crash.
    // Crashes would show up as page error or test failure.

    // We can mock `showSaveFilePicker` to avoid actual browser dialog hanging
    await page.evaluate(() => {
      window.showSaveFilePicker = async (options) => {
        // Verify `startIn` is undefined if catch block worked?
        // Or just return a dummy handle so code proceeds.
        return {
          createWritable: async () => ({
            write: async () => {},
            close: async () => {},
          }),
          getFile: async () =>
            new File([''], 'test.png', { type: 'image/png' }),
        };
      };
    });

    const saveBtn = page.locator('button:has-text("Save")');
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // If it crashed, subsequent actions might fail or console error.
    // Verify popover closed (success path)
    await expect(page.locator('form.generate')).toBeHidden();

    // Verify image set
    const img = page.locator('.image .big-preview img');
    await expect(img).toBeVisible();
  });
});
