// @ts-check
import { defineConfig } from 'astro/config';
import pagefind from './lib/pagefind';
import svelte from '@astrojs/svelte';
import mdx from '@astrojs/mdx';
import { markdown } from './lib/markdown';
import istanbul from 'vite-plugin-istanbul';

// https://astro.build/config
export default defineConfig({
  integrations: [svelte(), pagefind(), mdx()],
  vite: {
    plugins: [
      process.env.VITE_COVERAGE === 'true' &&
        istanbul({
          include: 'src/*',
          exclude: ['node_modules', 'tests/'],
          extension: ['.js', '.ts', '.svelte', '.astro'],
          requireEnv: false,
        }),
    ],
    worker: {
      format: 'es',
    },
  },
  markdown,
});
