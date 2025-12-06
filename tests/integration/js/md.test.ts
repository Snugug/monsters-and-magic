/**
 * Tests for src/js/workers/md.ts
 * Tests the front-matter parsing and markdown compilation functions
 * The actual worker uses Comlink, so we test the underlying functions directly
 */
import { describe, it, expect } from 'vitest';
import fm from 'front-matter';
import { stringify } from 'yaml';

// Test the core functions that the worker exposes
describe('md worker functions', () => {
  describe('parse (front-matter)', () => {
    it('should parse YAML front-matter from markdown', () => {
      const input = `---
title: Test Document
author: Test Author
---

# Hello World

This is content.`;

      const result = fm(input);

      expect(result.attributes).toEqual({
        title: 'Test Document',
        author: 'Test Author',
      });
      expect(result.body).toContain('# Hello World');
      expect(result.body).toContain('This is content.');
    });

    it('should handle markdown without front-matter', () => {
      const input = '# Just Markdown\n\nNo front-matter here.';

      const result = fm(input);

      expect(result.attributes).toEqual({});
      expect(result.body).toBe('# Just Markdown\n\nNo front-matter here.');
    });

    it('should parse complex front-matter', () => {
      const input = `---
title: Monster
stats:
  hp: 10
  ac: 12
tags:
  - beast
  - small
---

Content`;

      const result = fm(input);

      expect(result.attributes).toEqual({
        title: 'Monster',
        stats: { hp: 10, ac: 12 },
        tags: ['beast', 'small'],
      });
    });

    it('should handle empty front-matter', () => {
      const input = `---
---

Content`;

      const result = fm(input);

      expect(result.attributes).toEqual({});
      expect(result.body.trim()).toBe('Content');
    });
  });

  describe('compile', () => {
    // Recreate the compile function from the worker
    function compile(md: string, data: object) {
      const front = stringify(data);
      return `---\n${front}---\n\n${md}`;
    }

    it('should compile markdown with front-matter', () => {
      const md = '# Hello World';
      const data = { title: 'Test', author: 'Me' };

      const result = compile(md, data);

      expect(result).toContain('---');
      expect(result).toContain('title: Test');
      expect(result).toContain('author: Me');
      expect(result).toContain('# Hello World');
    });

    it('should handle empty data object', () => {
      const md = '# Content';
      const data = {};

      const result = compile(md, data);

      expect(result).toContain('---');
      expect(result).toContain('# Content');
    });

    it('should handle complex data', () => {
      const md = 'Monster description';
      const data = {
        title: 'Goblin',
        size: 'small',
        type: 'humanoid',
        stats: { hp: 7, ac: 15 },
      };

      const result = compile(md, data);

      expect(result).toContain('title: Goblin');
      expect(result).toContain('size: small');
      expect(result).toContain('hp: 7');
    });

    it('should round-trip correctly', () => {
      const originalData = { title: 'Test', value: 42 };
      const originalMd = '# Test Content\n\nParagraph.';

      const compiled = compile(originalMd, originalData);
      const parsed = fm(compiled);

      expect(parsed.attributes).toEqual(originalData);
      expect(parsed.body.trim()).toBe(originalMd);
    });
  });
});
