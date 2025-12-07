/// <reference types="vitest" />
import { getViteConfig } from 'astro/config';
import type { ViteUserConfig } from 'vitest/config';

export default getViteConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          environment: 'happy-dom',
          setupFiles: ['tests/integration/setup.ts'],
        },
        resolve: {
          conditions: ['browser', 'default'],
        },
      },
    ],
    coverage: {
      provider: 'istanbul',
      reporter: ['json'],
      reportsDirectory: '.coverage',
    },
  },
} as ViteUserConfig);
