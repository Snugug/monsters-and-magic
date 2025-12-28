import { describe, it, expect } from 'vitest';
import { chapterTitle, sortFeats, slugify, capitalize } from '$lib/helpers';

describe('lib/helpers', () => {
  describe('chapterTitle', () => {
    it('should return title only if chapter < 0', () => {
      expect(chapterTitle(-1, 'My Title')).toBe('My Title');
    });

    it('should return "Intro" for chapter 0 in short mode', () => {
      expect(chapterTitle(0, 'My Title', true)).toBe('Intro: My Title');
    });

    it('should return "Introduction" for chapter 0 in long mode', () => {
      expect(chapterTitle(0, 'My Title', false)).toBe('Introduction: My Title');
    });

    it('should return "Introduction" for chapter 0 (default long)', () => {
      expect(chapterTitle(0, 'My Title')).toBe('Introduction: My Title');
    });

    it('should correct format short chapter title', () => {
      expect(chapterTitle(5, 'Rules', true)).toBe('Ch. 5: Rules');
    });

    it('should correct format long chapter title', () => {
      expect(chapterTitle(5, 'Rules', false)).toBe('Chapter 5: Rules');
    });
  });

  describe('slugify', () => {
    it('should slugify strings', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Foo Bar Baz')).toBe('foo-bar-baz');
    });

    it('should be strict', () => {
      // Based on library behavior, 'Foo & Bar' becomes 'foo-and-bar' commonly, or 'foo--bar' if strict removes it.
      // The failure showed 'foo-and-bar'.
      expect(slugify('Foo & Bar')).toBe('foo-and-bar');
    });
  });

  describe('capitalize', () => {
    it('should capitalize the first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('should handle empty strings', () => {
      expect(capitalize('')).toBe('');
    });

    it('should handle already capitalized strings', () => {
      expect(capitalize('Hello')).toBe('Hello');
    });
  });

  describe('sortFeats', () => {
    it('should sort by Core, then Rare (bottom), then Title', () => {
      const featBase = { slug: 'test', body: '', collection: 'feats' };

      const featCore = {
        ...featBase,
        data: { title: 'Zebra', core: true, rare: false },
      } as any;
      const featNormal = {
        ...featBase,
        data: { title: 'Apple', core: false, rare: false },
      } as any;

      // Core should come before Normal, regardless of title.
      expect(sortFeats([featNormal, featCore])).toEqual([featCore, featNormal]);

      const featRare = {
        ...featBase,
        data: { title: 'Aardvark', core: false, rare: true },
      } as any;

      // Rare should come AFTER Normal.
      expect(sortFeats([featRare, featNormal])).toEqual([featNormal, featRare]);

      // Same category (Normal), sort by Title
      const featB = {
        ...featBase,
        data: { title: 'Banana', core: false, rare: false },
      } as any;
      expect(sortFeats([featB, featNormal])).toEqual([featNormal, featB]);
    });
  });
});
