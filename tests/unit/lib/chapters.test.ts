import { describe, it, expect, vi } from 'vitest';

vi.mock('astro:content', () => {
  // Mock Data Definitions inside factory to avoid hoisting issues
  const mockTraits = [
    { slug: 'b-trait', data: { title: 'B Trait', lineage: { id: 'human' } } },
    { slug: 'a-trait', data: { title: 'A Trait', lineage: { id: 'human' } } },
  ];
  const mockLineage = [
    { slug: 'human', data: { title: 'Human' } },
    { slug: 'elf', data: { title: 'Elf' } },
  ];
  const mockHeritage = [
    { slug: 'wild-heritage', data: { title: 'Wild Heritage' } },
    { slug: 'city-heritage', data: { title: 'City Heritage' } },
  ];
  const mockClasses = [
    { slug: 'fighter', data: { title: 'Fighter' } },
    { slug: 'barbarian', data: { title: 'Barbarian' } },
  ];
  const mockFeats = [
    {
      slug: 'slash',
      data: {
        title: 'Slash',
        class: { id: 'fighter' },
        core: false,
        rare: false,
      },
    },
    {
      slug: 'bash',
      data: {
        title: 'Bash',
        class: { id: 'fighter' },
        core: true,
        rare: false,
      },
    }, // Core
  ];
  const mockTechniques = [
    { slug: 'tech1', data: { title: 'Tech 1', type: 'basic', rare: false } }, // basic
    { slug: 'tech2', data: { title: 'Tech 2', type: 'advanced', rare: false } }, // advanced
    { slug: 'tech3', data: { title: 'Tech 3', type: 'advanced', rare: true } }, // rare (type advanced but rare=true)
  ];
  const mockCantrips = [
    { slug: 'z-cantrip', data: { title: 'Z Cantrip' } },
    { slug: 'a-cantrip', data: { title: 'A Cantrip' } },
  ];
  const mockCharms = [
    { slug: 'charm2', data: { title: 'Charm 2', rare: true } },
    { slug: 'charm1', data: { title: 'Charm 1', rare: false } },
  ];
  const mockChapters = [
    {
      slug: 'ch2',
      data: { title: 'Ch2', chapter: 2 },
      render: async () => ({ headings: [], Content: () => null }),
    },
    {
      slug: 'ch1',
      data: { title: 'Ch1', chapter: 1 },
      render: async () => ({ headings: [], Content: () => null }),
    },
    {
      slug: 'ch3',
      data: { title: 'Ch3', chapter: 3 },
      render: async () => ({ headings: [], Content: () => null }),
    },
  ];

  return {
    getCollection: vi.fn(async (collection) => {
      switch (collection) {
        case 'traits':
          return mockTraits;
        case 'lineage':
          return mockLineage;
        case 'heritage':
          return mockHeritage;
        case 'classes':
          return mockClasses;
        case 'feats':
          return mockFeats;
        case 'techniques':
          return mockTechniques;
        case 'cantrips':
          return mockCantrips;
        case 'charms':
          return mockCharms;
        case 'chapters':
          return mockChapters;
        default:
          return [];
      }
    }),
  };
});

import { buildChapter, chapters } from '$lib/chapters';

describe('lib/chapters', () => {
  const baseEntry = {
    id: '1',
    slug: 'unknown',
    body: '',
    collection: 'chapters',
    data: { title: 'Test Chapter', chapter: 1 },
    render: async () => ({
      headings: [
        { depth: 2, slug: 'lineages', text: 'Lineages' },
        { depth: 2, slug: 'cantrips', text: 'Cantrips' },
        { depth: 2, slug: 'charms', text: 'Charms' },
        { depth: 2, slug: 'rare-charms', text: 'Rare Charms' },
        { depth: 2, slug: 'heritages', text: 'Heritages' },
        { depth: 2, slug: 'basic-techniques', text: 'Basic' },
        { depth: 2, slug: 'advanced-techniques', text: 'Advanced' },
        { depth: 2, slug: 'rare-techniques', text: 'Rare' },
      ],
      Content: () => null,
    }),
  } as any;

  it('should sort and inject character-origins items', async () => {
    const entry = { ...baseEntry, slug: 'character-origins' };
    const result = await buildChapter(entry);

    const idxA = result.headings.findIndex((h) => h.slug === 'a-trait');
    const idxB = result.headings.findIndex((h) => h.slug === 'b-trait');
    expect(idxA).toBeLessThan(idxB);

    // Verify Lineage Sorting: Elf < Human
    const idxElf = result.headings.findIndex((h) => h.slug === 'elf');
    const idxHuman = result.headings.findIndex((h) => h.slug === 'human');
    expect(idxElf).toBeLessThan(idxHuman);

    // Verify Heritage Sorting: City < Wild
    const idxCity = result.headings.findIndex(
      (h) => h.slug === 'city-heritage',
    );
    const idxWild = result.headings.findIndex(
      (h) => h.slug === 'wild-heritage',
    );
    expect(idxCity).toBeLessThan(idxWild);
  });

  it('should sort and inject character-classes items', async () => {
    const entry = { ...baseEntry, slug: 'character-classes' };
    const result = await buildChapter(entry);

    // Classes: Barbarian < Fighter
    const idxBarb = result.headings.findIndex((h) => h.slug === 'barbarian');
    const idxFight = result.headings.findIndex((h) => h.slug === 'fighter');
    expect(idxBarb).toBeLessThan(idxFight);

    const idxBash = result.headings.findIndex((h) => h.slug === 'bash');
    const idxSlash = result.headings.findIndex((h) => h.slug === 'slash');
    expect(idxBash).toBeLessThan(idxSlash);
  });

  it('should sort and inject techniques items', async () => {
    const entry = { ...baseEntry, slug: 'techniques' };
    const result = await buildChapter(entry);

    expect(result.headings.find((h) => h.slug === 'tech1')).toBeDefined();
    expect(result.headings.find((h) => h.slug === 'tech2')).toBeDefined();
    expect(result.headings.find((h) => h.slug === 'tech3')).toBeDefined();
  });

  it('should sort and inject spellcasting items', async () => {
    const entry = { ...baseEntry, slug: 'spellcasting' };
    const result = await buildChapter(entry);

    const idxA = result.headings.findIndex((h) => h.slug === 'a-cantrip');
    const idxZ = result.headings.findIndex((h) => h.slug === 'z-cantrip');
    expect(idxA).toBeLessThan(idxZ);

    const idxC1 = result.headings.findIndex((h) => h.slug === 'charm1');
    const idxC2 = result.headings.findIndex((h) => h.slug === 'charm2');
    expect(idxC1).toBeGreaterThan(-1);
    expect(idxC2).toBeGreaterThan(-1);
  });

  it('should export sorted chapters array', () => {
    // chapters is a promise result (await Promise.all...), exports the array
    expect(chapters).toHaveLength(3);
    expect(chapters[0].chapter).toBe(1);
    expect(chapters[1].chapter).toBe(2);
    expect(chapters[2].chapter).toBe(3);
  });
});
