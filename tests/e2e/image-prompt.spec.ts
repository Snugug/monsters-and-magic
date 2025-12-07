import { test, expect } from './fixtures';

test.describe('Bug Reproduction: Image Prompt Pre-fill', () => {
  test.beforeEach(async ({ page }) => {
    // Set dummy API key to enable generator
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('apikey', 'dummy-key');
    });
  });

  test('prompt should be empty when monster title is not set', async ({
    page,
  }) => {
    await page.goto('/build-a-monster');

    // Open generator popover
    await page.getByRole('button', { name: 'Generate an Image' }).click();

    // Check prompt textarea value
    const prompt = page.locator('textarea[name="prompt"]');
    await expect(prompt).toBeVisible();

    // BUG: Currently it is pre-filled with "A .\n\nA medium (fits inside a 5 foot by 5 foot square) beast.\n\n"
    // DESIRED: It should be empty
    const value = await prompt.inputValue();
    expect(value).toBe('');

    // VERIFY: Prompt fills when title is entered
    await page.locator('input[name="title"]').fill('Dragon');
    // Wait for effect to run
    await page.waitForTimeout(500);

    // Check prompt updates
    const updatedValue = await prompt.inputValue();
    expect(updatedValue).toContain('A Dragon.');
  });
});
