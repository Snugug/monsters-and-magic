import { describe, it, expect, vi } from 'vitest';
import { baseMonster } from '$lib/shared';

// Use vi.hoisted to ensure mock data is available to the factory
const mocks = vi.hoisted(() => ({
  traits: [
    { slug: 't1', collection: 'traits', data: { points: 5, name: 'Trait 1' } },
  ],
  weapons: [
    {
      slug: 'w1',
      collection: 'weapons',
      data: { damage: '1d8', name: 'Weapon 1' },
    },
  ],
  armor: [
    { slug: 'a1', collection: 'armor', data: { ac: 2, name: 'Armor 1' } },
  ],
  feats: [{ slug: 'f1', collection: 'feats', data: { name: 'Feat 1' } }],
  techniques: [
    { slug: 'tech1', collection: 'techniques', data: { name: 'Tech 1' } },
  ],
  charms: [{ slug: 'c1', collection: 'charms', data: { name: 'Charm 1' } }],
}));

// Mock astro:content BEFORE importing the module under test
vi.mock('astro:content', () => ({
  getCollection: vi.fn(async (collection) => {
    switch (collection) {
      case 'traits':
        return mocks.traits;
      case 'weapons':
        return mocks.weapons;
      case 'armor':
        return mocks.armor;
      case 'feats':
        return mocks.feats;
      case 'techniques':
        return mocks.techniques;
      case 'charms':
        return mocks.charms;
      default:
        return [];
    }
  }),
}));

// Import the module AFTER mocking
import { calculatePoints } from '$lib/astro/monsters';

describe('lib/astro/monsters (Integration)', () => {
  it('should correctly map slugs to IDs and inject data into calculation', async () => {
    // Note: calculatePoints is not async, but the data loading in monsters.ts is Top-Level Await
    // However, when importing '$lib/astro/monsters', the TLA should resolve.
    // The calculatePoints function exported is already curried with the loaded data.

    const m = structuredClone(baseMonster);
    m.type = 'humanoid';
    m.lineage = 'human';
    // Use the slugs defined in the mocks
    m.traits = ['t1'];
    m.weapons = ['w1'];
    m.armor = [{ id: 'a1' }] as any;

    // Point expectations:
    // Trait (t1): +5 points
    // Weapon (w1, 1d8): +1 point (vicious calculation vs base 1d6)
    // Armor (a1, AC 2): +4 points (AC 2, Points(2+0, 2) -> 4)
    // Total: 10 points

    const result = calculatePoints(m);

    // Verify Points
    expect(result.points).toBe(10);

    // Verify Weapon Injection (Damage '1d8' should trigger 'vicious')
    expect(result.tags).toContain('vicious');
    expect(result.tags).toContain('armed');

    // Verify Armor Injection
    // Base AC 0 (monsterCalc default) + 2 (armor input) = 2
    expect(result.ac).toBe(2);
  });

  it('should handle missing references gracefully (integration check)', () => {
    const m = structuredClone(baseMonster);
    m.traits = ['missing-trait'];
    const result = calculatePoints(m);
    // Should not throw, should just calculate base points
    expect(result.points).toBe(0);
  });
});
