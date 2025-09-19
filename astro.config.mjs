// @ts-check
import { defineConfig } from 'astro/config';
import * as path from 'path';
import * as url from 'url';
import tsconfig from './tsconfig.json';
import pagefind from './lib/pagefind';

// Get the current directory
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

// Get the aliases from tsconfig
const aliases = Object.entries(tsconfig.compilerOptions.paths).map(
  ([key, value]) => ({
    find: key.replace(/\/\*$/, ''),
    replacement: path.join(__dirname, value[0]).replace(/\/\*$/, ''),
  }),
);

import svelte from '@astrojs/svelte';

import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  integrations: [svelte(), pagefind(), mdx()],
  vite: {
    resolve: {
      alias: aliases,
    },
  },
});
