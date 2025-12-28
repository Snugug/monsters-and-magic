import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks must be hoisted or top-level
const mockTraits = [{ id: 'trait1' }];
const mockFeats = [{ id: 'feat1' }];
const mockWeapons = [{ id: 'weapon1' }];
const mockArmor = [{ id: 'armor1' }];
const mockTechniques = [{ id: 'tech1' }];
const mockCharms = [{ id: 'charm1' }];

const mockDb = {
  traits: { toArray: vi.fn().mockResolvedValue(mockTraits) },
  feats: { toArray: vi.fn().mockResolvedValue(mockFeats) },
  weapons: { toArray: vi.fn().mockResolvedValue(mockWeapons) },
  armor: { toArray: vi.fn().mockResolvedValue(mockArmor) },
  techniques: { toArray: vi.fn().mockResolvedValue(mockTechniques) },
  charms: { toArray: vi.fn().mockResolvedValue(mockCharms) },
};

vi.mock('$js/db', () => ({
  db: mockDb,
}));

// Mock calculatePoints to return a function that returns "calculated"
const mockCalculatePoints = vi.fn().mockReturnValue('calculated');
const mockCpFactory = vi.fn().mockReturnValue(mockCalculatePoints);

vi.mock('$lib/monsters', () => ({
  calculatePoints: mockCpFactory,
}));

vi.mock('$lib/shared', () => ({
  monsterTypes: ['type1', 'type2'],
}));

describe('src/js/monsters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export types and calculatePoints', async () => {
    const module = await import('$js/monsters');

    expect(module.types).toEqual(['type1', 'type2']);

    // Check if cp factory was called with correct data
    expect(mockCpFactory).toHaveBeenCalledWith(
      mockTraits,
      mockFeats,
      mockWeapons,
      mockArmor,
      mockTechniques,
      mockCharms,
    );

    expect(module.calculatePoints).toBe(mockCalculatePoints);
  });
});
