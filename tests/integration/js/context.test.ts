/**
 * Tests for src/js/context.svelte.ts
 * Tests the default character structure and Store class behavior
 * Note: Full Svelte $state testing requires Svelte 5 runtime
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the db module before imports
vi.mock('$js/db', () => ({
  db: {
    character: {
      get: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('context.svelte.ts', () => {
  describe('defaultCharacter', () => {
    it('should have correct structure', async () => {
      const { defaultCharacter } = await import('$js/context.svelte');

      expect(defaultCharacter).toEqual({
        id: '',
        name: '',
        abilities: {
          str: 0,
          dex: 0,
          con: 0,
          wis: 0,
          int: 0,
          cha: 0,
        },
      });
    });

    it('should have empty id', async () => {
      const { defaultCharacter } = await import('$js/context.svelte');
      expect(defaultCharacter.id).toBe('');
    });

    it('should have empty name', async () => {
      const { defaultCharacter } = await import('$js/context.svelte');
      expect(defaultCharacter.name).toBe('');
    });

    it('should have all ability scores as 0', async () => {
      const { defaultCharacter } = await import('$js/context.svelte');
      const abilities = defaultCharacter.abilities;

      expect(abilities.str).toBe(0);
      expect(abilities.dex).toBe(0);
      expect(abilities.con).toBe(0);
      expect(abilities.wis).toBe(0);
      expect(abilities.int).toBe(0);
      expect(abilities.cha).toBe(0);
    });
  });

  describe('character store', () => {
    it('should be exported', async () => {
      const { character } = await import('$js/context.svelte');
      expect(character).toBeDefined();
    });

    it('should have load method', async () => {
      const { character } = await import('$js/context.svelte');
      expect(typeof character.load).toBe('function');
    });

    it('should have set method', async () => {
      const { character } = await import('$js/context.svelte');
      expect(typeof character.set).toBe('function');
    });

    it('should have override method', async () => {
      const { character } = await import('$js/context.svelte');
      expect(typeof character.override).toBe('function');
    });

    it('should have update method', async () => {
      const { character } = await import('$js/context.svelte');
      expect(typeof character.update).toBe('function');
    });
  });

  describe('meta store', () => {
    it('should be exported', async () => {
      const { meta } = await import('$js/context.svelte');
      expect(meta).toBeDefined();
    });
  });
});
