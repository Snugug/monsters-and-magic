import { describe, it, expect, vi } from 'vitest';

// Mock getCollection BEFORE importing normalize.ts which awaits it at top level
vi.mock('astro:content', () => ({
  getCollection: vi.fn(async () => []),
}));

import { normalizeMonster } from '$lib/normalize';
import { baseMonster } from '$lib/shared';

describe('lib/normalize', () => {
  it('should normalize a monster', () => {
    const result = normalizeMonster(baseMonster);
    expect(result.monster).toBe(baseMonster);
    expect(result.points).toBeDefined();
    // Since we mocked empty collections, points calc might be basic defaults
    expect(result.points.hp).toBeGreaterThan(0);
  });
});
