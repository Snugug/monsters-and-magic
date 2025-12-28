// @ts-check
import { defineConfig } from 'astro/config';
import pagefind from './lib/pagefind';
import svelte from '@astrojs/svelte';
import mdx from '@astrojs/mdx';
import { markdown } from './lib/markdown';

// https://astro.build/config
export default defineConfig({
  integrations: [svelte(), pagefind(), mdx()],
  vite: {
    plugins: [],
    worker: {
      format: 'es',
    },
  },
  markdown,
});
