import { describe, it, expect, vi } from 'vitest';
import { buildChapter, chapters } from '$lib/chapters';
import { getCollection } from 'astro:content';

vi.mock('astro:content', () => ({
  getCollection: vi.fn(async (collection: string) => {
    if (collection === 'chapters') {
      return [
        {
          slug: 'c2',
          data: { title: 'C2', chapter: 2 },
          render: async () => ({ headings: [], Content: {} }),
        },
        {
          slug: 'c1',
          data: { title: 'C1', chapter: 1 },
          render: async () => ({ headings: [], Content: {} }),
        },
        {
          slug: 'c1-duplicate',
          data: { title: 'C1 Copy', chapter: 1 },
          render: async () => ({ headings: [], Content: {} }),
        },
      ];
    }
    return [];
  }),
}));

describe('chapters.ts', () => {
  it('should export sorted chapters', () => {
    expect(chapters).toHaveLength(3);
    expect(chapters[0].slug).toBe('c1');
    expect(chapters[1].slug).toBe('c1-duplicate');
    expect(chapters[2].slug).toBe('c2');
  });

  it('should build a simple chapter', async () => {
    const mockChapterEntry = {
      slug: 'test-chapter',
      data: {
        title: 'Test Chapter',
        chapter: 1,
      },
      render: async () => ({
        headings: [{ depth: 1, slug: 'heading-1', text: 'Heading 1' }],
        Content: {} as any,
      }),
    };

    const chapter = await buildChapter(mockChapterEntry as any);

    expect(chapter.title).toBe('Test Chapter');
    expect(chapter.slug).toBe('test-chapter');
    expect(chapter.url).toBe('/rules/test-chapter');
    expect(chapter.chapter).toBe(1);
    expect(chapter.headings).toHaveLength(1);
    expect(chapter.headings[0].text).toBe('Heading 1');
  });

  it('should build the character-origins chapter with extra headings', async () => {
    const mockChapterEntry = {
      slug: 'character-origins',
      data: {
        title: 'Character Origins',
        chapter: 2,
      },
      render: async () => ({
        headings: [
          { depth: 2, slug: 'lineages', text: 'Lineages' },
          { depth: 2, slug: 'heritages', text: 'Heritages' },
        ],
        Content: {} as any,
      }),
    };

    (getCollection as vi.Mock).mockImplementation(
      async (collection: string) => {
        if (collection === 'traits') {
          return [
            {
              slug: 'trait-2',
              data: { title: 'Trait 2', lineage: { id: 'lineage-1' } },
            },
            {
              slug: 'trait-1',
              data: { title: 'Trait 1', lineage: { id: 'lineage-2' } },
            },
            {
              slug: 'trait-3',
              data: { title: 'Trait 3', lineage: { id: 'lineage-1' } },
            },
          ];
        }
        if (collection === 'lineage') {
          return [
            { slug: 'lineage-1', data: { title: 'Lineage 1' } },
            { slug: 'lineage-2', data: { title: 'Lineage 2' } },
          ];
        }
        if (collection === 'heritage') {
          return [
            { slug: 'heritage-2', data: { title: 'Heritage 2' } },
            { slug: 'heritage-1', data: { title: 'Heritage 1' } },
          ];
        }
        return [];
      },
    );

    const chapter = await buildChapter(mockChapterEntry as any);

    expect(chapter.headings.some((h) => h.text === 'Lineage 1')).toBe(true);
    expect(chapter.headings.some((h) => h.text === 'Lineage 2')).toBe(true);
    expect(chapter.headings.some((h) => h.text === 'Trait 1')).toBe(true);
    expect(chapter.headings.some((h) => h.text === 'Trait 2')).toBe(true);
    expect(chapter.headings.some((h) => h.text === 'Trait 3')).toBe(true);
    expect(chapter.headings.some((h) => h.text === 'Heritage 1')).toBe(true);
    expect(chapter.headings.some((h) => h.text === 'Heritage 2')).toBe(true);
  });

  it('should build the character-classes chapter with extra headings', async () => {
    const mockChapterEntry = {
      slug: 'character-classes',
      data: {
        title: 'Character Classes',
        chapter: 3,
      },
      render: async () => ({
        headings: [],
        Content: {} as any,
      }),
    };

    (getCollection as vi.Mock).mockImplementation(
      async (collection: string) => {
        if (collection === 'classes') {
          return [
            { slug: 'class-1', data: { title: 'Class 1' } },
            { slug: 'class-2', data: { title: 'Class 2' } },
          ];
        }
        if (collection === 'feats') {
          return [
            {
              slug: 'feat-2',
              data: { title: 'Feat 2', class: { id: 'class-1' } },
            },
            {
              slug: 'feat-1',
              data: { title: 'Feat 1', class: { id: 'class-2' } },
            },
          ];
        }
        return [];
      },
    );

    const chapter = await buildChapter(mockChapterEntry as any);

    expect(chapter.headings.some((h) => h.text === 'Class 1')).toBe(true);
    expect(chapter.headings.some((h) => h.text === 'Class 2')).toBe(true);
    expect(chapter.headings.some((h) => h.text === 'Feat 1')).toBe(true);
    expect(chapter.headings.some((h) => h.text === 'Feat 2')).toBe(true);
  });

  it('should build the techniques chapter with extra headings', async () => {
    const mockChapterEntry = {
      slug: 'techniques',
      data: {
        title: 'Techniques',
        chapter: 4,
      },
      render: async () => ({
        headings: [
          { depth: 2, slug: 'basic-techniques', text: 'Basic Techniques' },
          {
            depth: 2,
            slug: 'advanced-techniques',
            text: 'Advanced Techniques',
          },
          { depth: 2, slug: 'rare-techniques', text: 'Rare Techniques' },
        ],
        Content: {} as any,
      }),
    };

    (getCollection as vi.Mock).mockImplementation(
      async (collection: string) => {
        if (collection === 'techniques') {
          return [
            { slug: 'tech-1', data: { title: 'Technique 1', type: 'basic' } },
            {
              slug: 'tech-2',
              data: { title: 'Technique 2', type: 'advanced' },
            },
            { slug: 'tech-3', data: { title: 'Technique 3', type: 'rare' } },
          ];
        }
        return [];
      },
    );

    const chapter = await buildChapter(mockChapterEntry as any);

    expect(chapter.headings.some((h) => h.text === 'Technique 1')).toBe(true);
    expect(chapter.headings.some((h) => h.text === 'Technique 2')).toBe(true);
    expect(chapter.headings.some((h) => h.text === 'Technique 3')).toBe(true);
  });

  it('should build the spellcasting chapter with extra headings', async () => {
    const mockChapterEntry = {
      slug: 'spellcasting',
      data: {
        title: 'Spellcasting',
        chapter: 5,
      },
      render: async () => ({
        headings: [
          { depth: 2, slug: 'cantrips', text: 'Cantrips' },
          { depth: 2, slug: 'charms', text: 'Charms' },
          { depth: 2, slug: 'rare-charms', text: 'Rare Charms' },
        ],
        Content: {} as any,
      }),
    };

    (getCollection as vi.Mock).mockImplementation(
      async (collection: string) => {
        if (collection === 'cantrips') {
          return [
            { slug: 'cantrip-2', data: { title: 'Cantrip 2' } },
            { slug: 'cantrip-1', data: { title: 'Cantrip 1' } },
          ];
        }
        if (collection === 'charms') {
          return [
            { slug: 'charm-1', data: { title: 'Charm 1', rare: false } },
            { slug: 'charm-2', data: { title: 'Charm 2', rare: true } },
          ];
        }
        return [];
      },
    );

    const chapter = await buildChapter(mockChapterEntry as any);

    expect(chapter.headings.some((h) => h.text === 'Cantrip 1')).toBe(true);
    expect(chapter.headings.some((h) => h.text === 'Charm 1')).toBe(true);
    expect(chapter.headings.some((h) => h.text === 'Charm 2')).toBe(true);
  });
});
