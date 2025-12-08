# Monsters and Magic - Project Context

## Project Overview

This is the source code for "Monsters and Magic," a Tabletop RPG system website. It is a static site built with **Astro** and **Svelte**, utilizing **MDX** for managing game content (rules, monsters, items, etc.).

### Key Technologies

- **Framework:** [Astro](https://astro.build) (Static Site Generation)
- **UI Components:** [Svelte](https://svelte.dev)
- **Styling:** SCSS (`src/sass`)
- **Content Management:** MDX + Zod (Astro Content Collections)
- **Search:** [Pagefind](https://pagefind.app)
- **Database:** Client-side persistence using `Dexie` (IndexedDB wrapper)
- **AI Integration:** `@google/genai` (for image generation)

## Directory Structure

- `src/content/`: The core data of the application. Contains MDX files for monsters, spells, items, rules, etc. Structure and validation are defined in `src/content/config.ts`.
- `src/components/`: Reusable UI components (Svelte and Astro).
- `src/layouts/`: Page layouts (e.g., `Layout.astro`, `Chapter.astro`).
- `src/pages/`: Astro file-based routing.
- `src/lib/` & `src/js/`: Shared TypeScript logic, utility functions, and game rule implementations.
- `tests/`: Comprehensive testing suite (E2E, Integration, Unit).

## Development

### Setup & Installation

```bash
pnpm install
```

### Running the Development Server

```bash
pnpm dev
```

Starts the local server at `http://localhost:4321`.

### Building for Production

```bash
pnpm build
```

Builds the static site to the `./dist/` directory.

### Preview

```bash
pnpm preview
```

Previews the production build locally.

## Testing

The project uses **Vitest** for unit/integration tests and **Playwright** for end-to-end tests.

- **Run Unit Tests:** `pnpm unit:test` (or `pnpm unit:watch` for watch mode)
- **Run Integration Tests:** `pnpm integration:test`
- **Run E2E Tests:** `pnpm e2e:test` (uses Playwright)
- **Run All Tests:** `pnpm test`
- **Coverage:** `pnpm coverage:report`

## Code Conventions

- **Path Aliases:** Use the aliases defined in `tsconfig.json` for imports:
  - `$components/*` -> `src/components/*`
  - `$lib/*` -> `src/lib/*`
  - `$js/*` -> `src/js/*`
  - `$assets/*` -> `src/assets/*`
  - `$sass/*` -> `src/sass/*`
- **Styling:** SCSS is used for styling. Global styles are in `src/sass`.
- **Content:** All game data should be added as MDX files in the appropriate subdirectory of `src/content/` and must adhere to the Zod schema defined in `src/content/config.ts`.

## AI Agent Requirements

The project includes a `.agent` folder. ALL AI AGENTS AND TOOLS **MUST** FOLLOW ALL INSTRUCTIONS PROVIDED IN THAT FOLDER in addition to any input from the user.
