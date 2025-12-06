import { test, expect } from '@playwright/test';

test.describe('Build A Monster', () => {
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB to ensure fresh start
    await page.goto('/build-a-monster');
    await page.evaluate(async () => {
      const dbs = await window.indexedDB.databases();
      for (const db of dbs) {
        if (db.name) window.indexedDB.deleteDatabase(db.name);
      }
    });
    await page.reload();
  });

  test('should calculate stats based on size and type', async ({ page }) => {
    await page.goto('/build-a-monster');

    // Initial state (Medium) -> Speed 30
    await expect(page.locator('input[name="speed"]')).toHaveValue('30');

    // Change Size to Large (should increase Speed to 40)
    await page.locator('select[name="size"]').first().selectOption('large');
    await expect(page.locator('input[name="speed"]')).toHaveValue('40');

    // Change size to Tiny (Speed 20)
    await page.locator('select[name="size"]').first().selectOption('tiny');
    await expect(page.locator('input[name="speed"]')).toHaveValue('20');

    // Change back to Medium (Speed 30)
    await page.locator('select[name="size"]').first().selectOption('medium');
    await expect(page.locator('input[name="speed"]')).toHaveValue('30');
  });

  test('should persist monster data across reloads', async ({ page }) => {
    await page.goto('/build-a-monster');

    // Fill out form
    await page.locator('input[name="title"]').fill('Persisted Beast');
    await page
      .locator('textarea[name="body"]')
      .fill('This description should stay.');

    // Use specific selector for Type
    await page.locator('.group.top select[name="type"]').selectOption('beast');

    // Reload
    await page.reload();

    // Verify persistence
    await expect(page.locator('input[name="title"]')).toHaveValue(
      'Persisted Beast',
    );
    await expect(page.locator('textarea[name="body"]')).toHaveValue(
      'This description should stay.',
    );
    await expect(page.locator('.group.top select[name="type"]')).toHaveValue(
      'beast',
    );
  });

  test('should load monster data from file', async ({ page }) => {
    await page.goto('/build-a-monster');

    // Mock File System Access API for Open
    await page.evaluate(() => {
      (window as any).showOpenFilePicker = async () => [
        {
          kind: 'file',
          name: 'loaded-monster.md',
          getFile: async () =>
            new File(
              [
                `---
title: Loaded Dragon
size: large
type: dragon
---
This is a loaded description.`,
              ],
              'loaded-monster.md',
            ),
        },
      ];
    });

    // Clean state
    await page.locator('input[name="title"]').fill('');
    await page.locator('textarea[name="body"]').fill('');

    // Click Load
    await page.getByRole('button', { name: 'Load Monster' }).click();

    // Verify loaded data
    await expect(page.locator('input[name="title"]')).toHaveValue(
      'Loaded Dragon',
    );
    await expect(page.locator('.group.top select[name="type"]')).toHaveValue(
      'dragon',
    );
    await expect(page.locator('textarea[name="body"]')).toHaveValue(
      'This is a loaded description.',
    );

    // Verify derived stats (Large -> speed 40 usually, or checked by logic)
    // Speed should ideally update if logic triggers, though our mock is simple frontmatter.
  });

  test('should reset form to default state', async ({ page }) => {
    await page.goto('/build-a-monster');

    // Change state
    await page.locator('input[name="title"]').fill('To Be Reset');
    await page.locator('.group.top select[name="type"]').selectOption('undead');
    await page.locator('select[name="size"]').first().selectOption('tiny');

    // Check changed state
    await expect(page.locator('input[name="speed"]')).toHaveValue('20'); // Tiny speed

    // Click Reset
    await page.getByRole('button', { name: 'Reset' }).click();

    // Verify Reset
    await expect(page.locator('input[name="title"]')).toHaveValue(''); // Defaults to empty
    await expect(page.locator('.group.top select[name="type"]')).toHaveValue(
      'beast',
    ); // Defaults to beast
    await expect(page.locator('input[name="speed"]')).toHaveValue('30'); // Defaults to 30 (Medium)
  });
});
