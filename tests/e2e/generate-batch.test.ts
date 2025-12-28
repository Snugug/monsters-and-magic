import { test, expect } from './fixtures';

test.describe('Batch Generator Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API
    // Mock API
    await page.route(
      'https://generativelanguage.googleapis.com/**',
      async (route) => {
        const url = route.request().url();
        const method = route.request().method();
        console.log(`ROUTE: ${method} ${url}`);

        if (url.includes('upload') && method === 'POST') {
          // Initial request for Resumable Upload
          await route.fulfill({
            status: 200,
            headers: {
              'x-goog-upload-url':
                'https://generativelanguage.googleapis.com/upload/v1beta/files?upload_id=mock-id',
              'x-goog-upload-status': 'active',
            },
          });
        } else if (url.includes('upload_id=mock-id')) {
          // Actual file upload (PUT)
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ name: 'files/mock-file-id' }),
          });
        } else if (url.includes('batches') && method === 'POST') {
          // Mock Batch Creation
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              name: 'jobs/mock-job-id',
              state: 'JOB_STATE_PENDING',
              displayName: 'e2e-test-batch',
            }),
          });
        } else if (url.includes('jobs/mock-job-id')) {
          // Mock Batch Status Checking
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              name: 'jobs/mock-job-id',
              state: 'JOB_STATE_SUCCEEDED', // Return success immediately for test speed
              displayName: 'e2e-test-batch',
              outputFile: { name: 'files/mock-result-file' },
            }),
          });
        } else if (url.includes('files/mock-result-file:download')) {
          // Mock Result Download
          // Batch results are JSONL
          const resultLine = JSON.stringify({
            response: {
              candidates: [
                {
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
            },
          });
          await route.fulfill({
            status: 200,
            contentType: 'text/plain',
            body: resultLine + '\n' + resultLine, // Two results
          });
        } else {
          await route.continue();
        }
      },
    );
  });

  test.afterEach(async ({ page }) => {
    const error = await page.evaluate(() => (window as any).lastError);
    if (error) console.log('CAPTURED ERROR:', error);
  });

  test('loads successfully', async ({ page }) => {
    await page.goto('/generate/batch');
    await expect(
      page.getByRole('heading', { name: 'Batch Image Generator' }),
    ).toBeVisible();
  });

  test.skip('can queue and process a batch', async ({ page }) => {
    await page.goto('/generate/batch');

    await page.getByLabel('API Key').fill('fake-key');
    await page.getByRole('button', { name: 'Save API Key' }).click();

    await page.getByLabel('Batch Name (Optional)').fill('E2E Batch');
    await page.getByLabel('Prompt Values').fill('Prompt 1\nPrompt 2');

    await page.getByRole('button', { name: 'Queue Generation' }).click();

    // Should appear in history
    await expect(page.getByText('E2E Batch')).toBeVisible();
    await expect(page.getByText('PENDING')).toBeVisible();

    // Click refresh to update status (mocks return SUCCEEDED)
    await page.getByRole('button', { name: 'Refresh' }).click();
    await expect(page.getByText('SUCCEEDED')).toBeVisible();

    // Open results
    await page.getByRole('button', { name: 'E2E Batch' }).click();

    // Check dialog
    await expect(page.locator('.dialog-content img')).toHaveCount(1); // One visible in dialog initially or carousel?
    // Actually dialog implementation shows one at a time but let's just check it opens.
    await expect(page.locator('.dialog-overlay')).toBeVisible();
  });
});
