---
trigger: always_on
---

Here is a breakdown of the folders and what they are for:

- `lib` - Node.js specific code primairly required for configuring the development environment
- `lib/pagefind` - Custom Pagefind integration for Astro
- `public` - Static server files that will be copied over as-is.
- `public/admin` - Configuration files for Sveltia CMS (https://github.com/sveltia/sveltia-cms)
- `tests` - Contains test files for the site
- `src` Site source code
- `src/assets` - Raw design assets
- `src/images` - Site images that will be transformed on output
- `src/components` - Component files to be used across pages and layouts in the site. Custom Elements should be included in this folder as well, even though they are not Astro or Svelte components.
- `src/components/mdx` - Components specifically for use in MDX files
- `src/content` - Folder that contains content for the site. Each content type is in a sub-folder here with a name equal to the export in `src/content/config.ts`.
- `src/js` - Reusable library files that require a browser environment to work. This includes library files that rely on Svelte state.
- `src/lib` - Reusable library files that can be run in _either_ a browser _or_ a server environment.
- `src/lib/astro` - Reusable library files that can _only_ be run from within the Astro server environment
- `src/pages` - Filesystem based routing, which can include HTML output, API endpoint output, and wildcards.
- `src/layouts` - Shared, reusable layouts. Mostly used as high-level containers for pages, but if multiple files in the pages directory share the same layout, those would go in here, too.
- `src/sass` - Global styling
- `src/sass/components` - Logically singular set of styling (like typography styling), usually self-contained to a single top-level selector
- `src/sass/global` - Sass meta-helpers that do not output any CSS themselves but can be used across the system, like global variables and functions. Made available to files outside this folder through `src/sass/_shared.scss`
