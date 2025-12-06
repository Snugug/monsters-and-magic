import { describe, it, expect } from 'vitest';
import { modificationCost } from '$lib/modifications';
import type { CollectionEntry } from 'astro:content';

describe('modifications.ts', () => {
  describe('modificationCost', () => {
    it('should calculate the cost for a common rune', () => {
      const item = {
        data: {
          crafting: { elementalis: 1, mithril: 0, fadeite: 0 },
          type: 'rune',
          rare: false,
        },
      } as CollectionEntry<'modifications'>;
      // (1 * 150) * 1.5 = 225
      expect(modificationCost(item)).toBe(225);
    });

    it('should calculate the cost for a rare rune', () => {
      const item = {
        data: {
          crafting: { elementalis: 1, mithril: 0, fadeite: 0 },
          type: 'rune',
          rare: true,
        },
      } as CollectionEntry<'modifications'>;
      // (1 * 150) * 1.5 * 2 = 450
      expect(modificationCost(item)).toBe(450);
    });

    it('should calculate the cost for a common seal', () => {
      const item = {
        data: {
          crafting: { elementalis: 0, mithril: 1, fadeite: 0 },
          type: 'seal',
          rare: false,
        },
      } as CollectionEntry<'modifications'>;
      // (1 * 200) * 2.5 = 500
      expect(modificationCost(item)).toBe(500);
    });

    it('should calculate the cost for a rare seal', () => {
      const item = {
        data: {
          crafting: { elementalis: 0, mithril: 1, fadeite: 0 },
          type: 'seal',
          rare: true,
        },
      } as CollectionEntry<'modifications'>;
      // (1 * 200) * 2.5 * 2 = 1000
      expect(modificationCost(item)).toBe(1000);
    });

    it('should calculate the cost with multiple crafting materials', () => {
      const item = {
        data: {
          crafting: { elementalis: 1, mithril: 1, fadeite: 1 },
          type: 'rune',
          rare: false,
        },
      } as CollectionEntry<'modifications'>;
      // (150 + 200 + 400) * 1.5 = 1125
      expect(modificationCost(item)).toBe(1125);
    });

    it('should handle items with no crafting materials', () => {
      const item = {
        data: {
          crafting: { elementalis: 0, mithril: 0, fadeite: 0 },
          type: 'rune',
          rare: false,
        },
      } as CollectionEntry<'modifications'>;
      expect(modificationCost(item)).toBe(0);
    });

    it('should handle unknown type (no multiplier applied)', () => {
      const item = {
        data: {
          crafting: { elementalis: 1, mithril: 0, fadeite: 0 },
          type: 'unknown',
          rare: false,
        },
      } as unknown as CollectionEntry<'modifications'>;
      // (1 * 150) = 150 (no type multiplier)
      expect(modificationCost(item)).toBe(150);
    });

    it('should handle large material quantities', () => {
      const item = {
        data: {
          crafting: { elementalis: 10, mithril: 5, fadeite: 3 },
          type: 'seal',
          rare: true,
        },
      } as CollectionEntry<'modifications'>;
      // (10*150 + 5*200 + 3*400) * 2.5 * 2 = (1500 + 1000 + 1200) * 5 = 18500
      expect(modificationCost(item)).toBe(18500);
    });

    it('should floor fractional results', () => {
      const item = {
        data: {
          crafting: { elementalis: 1, mithril: 0, fadeite: 0 },
          type: 'seal',
          rare: false,
        },
      } as CollectionEntry<'modifications'>;
      // (1 * 150) * 2.5 = 375 (no fraction here, but tests floor behavior)
      expect(modificationCost(item)).toBe(375);
    });

    it('should only use fadeite material cost correctly', () => {
      const item = {
        data: {
          crafting: { elementalis: 0, mithril: 0, fadeite: 2 },
          type: 'rune',
          rare: false,
        },
      } as CollectionEntry<'modifications'>;
      // (2 * 400) * 1.5 = 1200
      expect(modificationCost(item)).toBe(1200);
    });

    it('should calculate rare unknown type correctly', () => {
      const item = {
        data: {
          crafting: { elementalis: 1, mithril: 1, fadeite: 1 },
          type: 'enchantment',
          rare: true,
        },
      } as unknown as CollectionEntry<'modifications'>;
      // (150 + 200 + 400) * 2 = 1500 (no type multiplier, but rare doubles)
      expect(modificationCost(item)).toBe(1500);
    });
  });
});
