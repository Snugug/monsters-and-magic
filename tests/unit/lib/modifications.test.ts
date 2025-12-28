import { describe, it, expect } from 'vitest';
import { modificationCost } from '$lib/modifications';

describe('lib/modifications', () => {
  it('should calculate base cost correctly', () => {
    const item = {
      data: {
        type: 'material',
        rare: false,
        crafting: {
          elementalis: 1,
          mithril: 2,
          fadeite: 3,
        },
      },
    } as any;

    // 1 * 150 + 2 * 200 + 3 * 400 = 150 + 400 + 1200 = 1750
    const cost = modificationCost(item);
    expect(cost).toBe(1750);
  });

  it('should apply rune multiplier (1.5x)', () => {
    const item = {
      data: {
        type: 'rune',
        rare: false,
        crafting: {
          elementalis: 1, // 150
          mithril: 0,
          fadeite: 0,
        },
      },
    } as any;

    // 150 * 1.5 = 225
    expect(modificationCost(item)).toBe(225);
  });

  it('should apply seal multiplier (2.5x)', () => {
    const item = {
      data: {
        type: 'seal',
        rare: false,
        crafting: {
          elementalis: 1, // 150
          mithril: 0,
          fadeite: 0,
        },
      },
    } as any;

    // 150 * 2.5 = 375
    expect(modificationCost(item)).toBe(375);
  });

  it('should apply rare multiplier (2x) after type multiplier', () => {
    const item = {
      data: {
        type: 'rune',
        rare: true,
        crafting: {
          elementalis: 1, // 150
          mithril: 0,
          fadeite: 0,
        },
      },
    } as any;

    // (150 * 1.5) * 2 = 225 * 2 = 450
    expect(modificationCost(item)).toBe(450);
  });

  it('should floor the result', () => {
    const item = {
      data: {
        type: 'material',
        rare: false,
        crafting: { elementalis: 0, mithril: 0, fadeite: 0 },
      },
    } as any;
    expect(modificationCost(item)).toBe(0);
  });
});
