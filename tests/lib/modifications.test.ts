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
  });
});
