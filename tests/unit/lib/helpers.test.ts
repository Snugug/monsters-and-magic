import { describe, it, expect } from 'vitest';
import { chapterTitle, sortFeats, slugify } from '$lib/helpers';
import type { CollectionEntry } from 'astro:content';

describe('helpers.ts', () => {
  describe('chapterTitle', () => {
    it('should return the title if chapter is negative', () => {
      expect(chapterTitle(-1, 'My Title')).toBe('My Title');
    });

    it('should return the title for very negative chapter numbers', () => {
      expect(chapterTitle(-100, 'Another Title')).toBe('Another Title');
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

    it('should handle large chapter numbers', () => {
      expect(chapterTitle(100, 'Big Chapter')).toBe('Chapter 100: Big Chapter');
      expect(chapterTitle(100, 'Big Chapter', true)).toBe(
        'Ch. 100: Big Chapter',
      );
    });

    it('should handle empty title', () => {
      expect(chapterTitle(1, '')).toBe('Chapter 1: ');
    });

    it('should handle special characters in title', () => {
      expect(chapterTitle(1, 'Title: With Colon!')).toBe(
        'Chapter 1: Title: With Colon!',
      );
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

    it('should handle empty array', () => {
      const sorted = sortFeats([]);
      expect(sorted).toEqual([]);
    });

    it('should handle single item', () => {
      const feats = [
        { data: { title: 'Solo Feat', core: false, rare: false } },
      ] as Array<CollectionEntry<'feats'>>;
      const sorted = sortFeats(feats);
      expect(sorted).toHaveLength(1);
      expect(sorted[0].data.title).toBe('Solo Feat');
    });

    it('should handle all core feats', () => {
      const feats = [
        { data: { title: 'B Core', core: true, rare: false } },
        { data: { title: 'A Core', core: true, rare: false } },
      ] as Array<CollectionEntry<'feats'>>;
      const sorted = sortFeats(feats);
      expect(sorted[0].data.title).toBe('A Core');
      expect(sorted[1].data.title).toBe('B Core');
    });

    it('should handle all rare feats', () => {
      const feats = [
        { data: { title: 'B Rare', core: false, rare: true } },
        { data: { title: 'A Rare', core: false, rare: true } },
      ] as Array<CollectionEntry<'feats'>>;
      const sorted = sortFeats(feats);
      expect(sorted[0].data.title).toBe('A Rare');
      expect(sorted[1].data.title).toBe('B Rare');
    });

    it('should prioritize core over rare when both are true', () => {
      const feats = [
        { data: { title: 'Core Only', core: true, rare: false } },
        { data: { title: 'Both', core: true, rare: true } },
        { data: { title: 'Rare Only', core: false, rare: true } },
      ] as Array<CollectionEntry<'feats'>>;
      const sorted = sortFeats(feats);
      // Both core items come first (alphabetically: Both < Core Only)
      // But since 'Both' is also rare, the rare sort puts it after Core Only
      expect(sorted[0].data.title).toBe('Core Only');
      expect(sorted[1].data.title).toBe('Both');
      expect(sorted[2].data.title).toBe('Rare Only');
    });
  });

  describe('slugify', () => {
    it('should create a slug', () => {
      expect(slugify('My Test String')).toBe('my-test-string');
    });

    it('should handle special characters', () => {
      expect(slugify('My Test String!@#$%^&*()')).toBe(
        'my-test-stringdollarpercentand',
      );
    });

    it('should handle empty string', () => {
      expect(slugify('')).toBe('');
    });

    it('should handle already slugified string', () => {
      expect(slugify('already-slugified')).toBe('already-slugified');
    });

    it('should handle multiple spaces', () => {
      expect(slugify('Multiple   Spaces')).toBe('multiple-spaces');
    });

    it('should handle leading and trailing spaces', () => {
      expect(slugify('  Trim Me  ')).toBe('trim-me');
    });

    it('should handle numbers', () => {
      expect(slugify('Chapter 1 Introduction')).toBe('chapter-1-introduction');
    });

    it('should handle mixed case', () => {
      expect(slugify('CamelCase AND UPPER')).toBe('camelcase-and-upper');
    });
  });
});
