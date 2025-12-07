import { describe, it, expect, vi } from 'vitest';
import { normalizeMonster, calculateMonsterPoints } from '$lib/normalize';
import type { Monster } from '$lib/shared';
import { getCollection } from 'astro:content';

vi.mock('astro:content', () => ({
  getCollection: vi.fn(async (collection: string) => {
    if (collection === 'traits') {
      return [
        {
          slug: 'test-trait',
          collection: 'traits',
          data: { name: 'Test Trait' },
        },
      ];
    }
    // Return empty arrays for all other collections to avoid errors during import
    return [];
  }),
}));

describe('normalize.ts', () => {
  const getBaseMonster = (): Monster => ({
    id: 'monster1',
    name: 'Test Monster',
    type: 'beast',
    size: 'medium',
    power: 0,
    cunning: 0,
    focus: 0,
    luck: 0,
    hp: 0,
    savage: 0,
    strong: 0,
    energetic: 0,
    conditioned: 0,
    armored: 0,
    vision: [],
    speeds: [],
    walking: 30,
    flying: 0,
    climbing: 0,
    swimming: 0,
    burrowing: 0,
    naturalWeapons: [],
    attacks: [],
    techniques: [],
    cantrips: [],
    charms: [],
    armor: [],
    resistance: [],
    immunity: [],
    conditions: [],
    vulnerable: [],
    absorbent: [],
    tags: [],
    blindsight: 0,
    tremmorsense: 0,
    truesight: 0,
    spicy: false,
    radiates: false,
    ancient: false,
  });

  it('calculateMonsterPoints should calculate points for a basic monster', () => {
    const monster = getBaseMonster();
    const points = calculateMonsterPoints(monster);
    expect(points.points).toBe(-4);
  });

  it('normalizeMonster should return monster and points', () => {
    const monster = getBaseMonster();
    const normalized = normalizeMonster(monster);
    expect(normalized.monster).toEqual(monster);
    expect(normalized.points.points).toBe(-4);
  });
});
