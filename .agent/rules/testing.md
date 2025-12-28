---
trigger: always_on
---

You MUST use the paths (`$components`, `$$lib`, etc…) from `tsconfig.json` in your unit and integration tests _instead of_ relative paths when importing source code.

You MUST name test files **identically** to their source code, even for integration and end-to-end tests. For instance, the Astro integration test for `lib/markdown.ts` _must_ be placed in `tests/integration/lib/markdown.test.ts`, **not** `tests/integration/lib/markdown_astro.test.ts`.

You MUST use code coverage to determine how well tested your code is:

- You MUST aim for 100% code coverage for all test you write
- Your MUST test full functionality in unit and integration tests, for instance, that Markdown output matches an expected full HTML output, not just that specific aspects are present. Failure to do so can result in passing tests that are still buggy
- You MUST get approval before changing source code if you think there's a big
- You MUST NOT ignore lines or files from code coverage (like through `istanbul-ignore` comments)

Use the following commands for testing:

- Build all pages: `pnpm build`
- Run all test: `pnpm test`
- Run unit tests: `pnpm unit:test`
- Run integration tests: `pnpm integration:test`
- Run end-to-end (e2e) tests: `e2e:test`
- Run one-off unit or integration test: `pnpm vitest`
- Run text-based code coverage: `pnpm coverage:report`
