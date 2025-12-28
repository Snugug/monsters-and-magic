import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E testing.
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Output directory for test results */
  outputDir: './.playwright',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['list'],
    [
      'monocart-reporter',
      {
        name: 'E2E V8 Coverage Report',
        // Output HTML report to .coverage/e2e (keeps everything in one place)
        outputFile: '.coverage/e2e/index.html',
        logging: 'off', // Disable test summary logging
        coverage: {
          // Use text for direct display, raw for raw V8 coverage JSON
          reports: process.env.COVERAGE_MODE === 'json' ? ['raw'] : ['text'],
          // Output directory for coverage files (always within .coverage/e2e)
          outputDir: '.coverage/e2e',
          sourcePath: (filePath: string) => {
            // Extract the relative path from the URL
            // URL format: http://localhost:4321/src/...
            const match = filePath.match(/localhost:\d+\/(.+)/);
            if (match) {
              return match[1];
            }
            return filePath;
          },
          entryFilter: (entry: { url: string }) => {
            // Only include source files from this project
            const url = entry.url;
            // Exclude external URLs
            if (!url.includes('localhost:4321')) return false;
            // Exclude node_modules
            if (url.includes('node_modules')) return false;
            // Exclude CSS, SCSS, and SVG files
            if (
              url.includes('.css') ||
              url.includes('.scss') ||
              url.includes('.svg')
            )
              return false;
            // Include only src/, lib/ source files
            return url.includes('/src/') || url.includes('/lib/');
          },
        },
      },
    ],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:4321',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      VITE_COVERAGE: 'true',
    },
  },
});
