import { describe, it, expect } from 'vitest';
import { chapterTitle, sortFeats, slugify } from '$lib/helpers';
import type { CollectionEntry } from 'astro:content';

describe('helpers.ts', () => {
  describe('chapterTitle', () => {
    it('should return the title if chapter is negative', () => {
      expect(chapterTitle(-1, 'My Title')).toBe('My Title');
    });

    it('should return "Intro" for chapter 0 with short option', () => {
      expect(chapterTitle(0, 'My Title', true)).toBe('Intro: My Title');
    });

    it('should return "Introduction" for chapter 0 without short option', () => {
      expect(chapterTitle(0, 'My Title')).toBe('Introduction: My Title');
    });

    it('should return "Ch. X" for other chapters with short option', () => {
      expect(chapterTitle(1, 'My Title', true)).toBe('Ch. 1: My Title');
    });

    it('should return "Chapter X" for other chapters without short option', () => {
      expect(chapterTitle(1, 'My Title')).toBe('Chapter 1: My Title');
    });
  });

  describe('sortFeats', () => {
    it('should sort feats correctly', () => {
      const feats = [
        { data: { title: 'B Feat', core: false, rare: false } },
        { data: { title: 'A Feat', core: false, rare: false } },
        { data: { title: 'C Feat', core: true, rare: false } },
        { data: { title: 'D Feat', core: false, rare: true } },
      ] as Array<CollectionEntry<'feats'>>;

      const sorted = sortFeats(feats);

      expect(sorted[0].data.title).toBe('C Feat'); // core comes first
      expect(sorted[1].data.title).toBe('A Feat'); // then alphabetical
      expect(sorted[2].data.title).toBe('B Feat');
      expect(sorted[3].data.title).toBe('D Feat'); // rare comes last
    });
  });

  describe('slugify', () => {
    it('should create a slug', () => {
      expect(slugify('My Test String')).toBe('my-test-string');
    });

    it('should handle special characters', () => {
      expect(slugify('My Test String!@#$%^&*()')).toBe('my-test-stringdollarpercentand');
    });
  });
});
