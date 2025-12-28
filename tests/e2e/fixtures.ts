import { test as baseTest, expect } from '@playwright/test';
import { addCoverageReport } from 'monocart-reporter';

export * from '@playwright/test';

export const test = baseTest.extend({
  autoTestFixture: [
    async ({ page }, use) => {
      const isChromium = test.info().project.name === 'chromium';
      if (isChromium) {
        await page.coverage.startJSCoverage({
          resetOnNavigation: false,
        });
      }

      await use('autoTestFixture');

      if (isChromium) {
        const jsCoverage = await page.coverage.stopJSCoverage();
        if (jsCoverage.length > 0) {
          await addCoverageReport(jsCoverage, test.info());
        }
      }
    },
    {
      scope: 'test',
      auto: true,
    },
  ],
});
