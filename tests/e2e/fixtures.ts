import { test as baseTest } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export * from '@playwright/test';

export const test = baseTest.extend({
  collectCoverage: [
    async ({ page }, use, testInfo) => {
      // Run the test
      await use();

      // Collect coverage
      const coverage = await page.evaluate(() => (window as any).__coverage__);
      if (coverage) {
        const coverageDir = path.resolve(process.cwd(), '.nyc_output');
        if (!fs.existsSync(coverageDir)) {
          fs.mkdirSync(coverageDir, { recursive: true });
        }
        const filename = `e2e-${testInfo.testId.replace(/\W/g, '-')}.json`;
        fs.writeFileSync(
          path.join(coverageDir, filename),
          JSON.stringify(coverage),
        );
      }
    },
    { auto: true },
  ],
});
