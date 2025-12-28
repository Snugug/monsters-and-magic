import { test as baseTest, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import v8toIstanbul from 'v8-to-istanbul';

export * from '@playwright/test';

export const test = baseTest.extend({
  page: async ({ page }, use) => {
    // Start coverage
    await page.coverage.startJSCoverage({
      resetOnNavigation: false,
    });

    await use(page);

    // Stop and collect coverage
    const coverage = await page.coverage.stopJSCoverage();

    // Create output directory
    await fs.promises.mkdir(path.join(process.cwd(), '.nyc_output'), {
      recursive: true,
    });

    for (const entry of coverage) {
      // Filter out irrelevant files
      if (entry.url.includes('node_modules') || !entry.url.includes('src/')) {
        continue;
      }

      // We need to map the URL to a local file path
      // URL is likely http://localhost:4321/src/path/to/file.ts
      let urlPath = new URL(entry.url).pathname;
      // Fix for Astro/Vite potentially serving files with base path issues or query params
      // Assuming simple mapping for now based on standard Vite dev server
      if (urlPath.startsWith('/@fs')) {
        // Absolute path served by Vite
        urlPath = urlPath.replace('/@fs', '');
      } else {
        // Relative path from root
        urlPath = path.join(process.cwd(), urlPath);
      }

      // Check if file exists to be safe
      if (!fs.existsSync(urlPath)) continue;

      try {
        if (!entry.source) continue;
        const converter = v8toIstanbul(urlPath, 0, { source: entry.source });
        await converter.load();
        converter.applyCoverage(entry.functions);

        const coverageData = converter.toIstanbul();

        fs.writeFileSync(
          path.join(
            process.cwd(),
            '.nyc_output',
            `playwright_coverage_${new Date().getTime()}_${Math.random().toString(36).substring(7)}.json`,
          ),
          JSON.stringify(coverageData),
        );
      } catch (e) {
        console.error(`Error processing coverage for ${urlPath}`, e);
      }
    }
  },
});
