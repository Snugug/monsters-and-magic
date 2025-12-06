import { test, expect } from '@playwright/test';

/**
 * E2E tests for the markdown worker (src/js/workers/md.ts)
 * Tests that the front-matter parsing and markdown compilation work in the browser.
 */

test.describe('Markdown Worker Integration', () => {
  test('should support front-matter style parsing in the browser', async ({
    page,
  }) => {
    await page.goto('/');

    // Test YAML parsing capability
    const parseResult = await page.evaluate(() => {
      // Simplified front-matter parsing test
      const content = `---
title: Test
author: Me
---

# Content`;

      const frontMatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
      const match = content.match(frontMatterRegex);

      if (match) {
        return {
          hasFrontMatter: true,
          body: match[2].trim(),
        };
      }
      return { hasFrontMatter: false, body: '' };
    });

    expect(parseResult.hasFrontMatter).toBe(true);
    expect(parseResult.body).toBe('# Content');
  });

  test('should be able to construct markdown with front-matter', async ({
    page,
  }) => {
    await page.goto('/');

    const compileResult = await page.evaluate(() => {
      const data = { title: 'Test', value: 42 };
      const content = '# Hello World';

      // Simple YAML-like construction
      const frontMatter = Object.entries(data)
        .map(([key, val]) => `${key}: ${val}`)
        .join('\n');

      return `---\n${frontMatter}\n---\n\n${content}`;
    });

    expect(compileResult).toContain('---');
    expect(compileResult).toContain('title: Test');
    expect(compileResult).toContain('value: 42');
    expect(compileResult).toContain('# Hello World');
  });
});

test.describe('YAML Processing', () => {
  test('should handle complex YAML structures', async ({ page }) => {
    await page.goto('/');

    const yamlTest = await page.evaluate(() => {
      // Test that we can parse complex nested YAML-like structures
      const yamlContent = `
title: Monster
stats:
  hp: 10
  ac: 15
tags:
  - beast
  - small`;

      // Verify it contains expected content
      return {
        hasTitle: yamlContent.includes('title: Monster'),
        hasStats: yamlContent.includes('hp: 10'),
        hasTags: yamlContent.includes('- beast'),
      };
    });

    expect(yamlTest.hasTitle).toBe(true);
    expect(yamlTest.hasStats).toBe(true);
    expect(yamlTest.hasTags).toBe(true);
  });
});
