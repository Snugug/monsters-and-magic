/**
 * Tests for src/js/context.svelte.ts
 * Tests the default character structure and Store class behavior
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '$js/db';

// Mock the db module
vi.mock('$js/db', () => ({
  db: {
    character: {
      get: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('context.svelte.ts', () => {
  // We need to import the module after mocking
  let characterStore: any;
  let defaultChar: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('$js/context.svelte');
    characterStore = mod.character;
    defaultChar = mod.defaultCharacter;
  });

  describe('defaultCharacter', () => {
    it('should have correct structure', () => {
      expect(defaultChar).toEqual({
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
  });

  describe('CharacterStore', () => {
    it('should load a character from db', async () => {
      const mockChar = { ...defaultChar, id: '123', name: 'Test Char' };
      (db.character.get as any).mockResolvedValue(mockChar);

      await characterStore.load('123');

      expect(db.character.get).toHaveBeenCalledWith('123');
      expect(characterStore.sheet).toEqual(mockChar);
    });

    it('should handle load error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (db.character.get as any).mockRejectedValue(new Error('DB Error'));

      await characterStore.load('123');

      expect(db.character.get).toHaveBeenCalledWith('123');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should not update sheet if character not found', async () => {
      (db.character.get as any).mockResolvedValue(null);
      const originalSheet = { ...characterStore.sheet };

      await characterStore.load('999');

      expect(db.character.get).toHaveBeenCalledWith('999');
      expect(characterStore.sheet).toEqual(originalSheet);
    });

    it('should set a property and update db', async () => {
      // Mock update to prevent actual DB call logic if any, though it's mocked
      // The update method calls db.character.update
      
      await characterStore.set('name', 'New Name');

      expect(characterStore.sheet.name).toBe('New Name');
      expect(db.character.update).toHaveBeenCalled();
    });

    it('should override the sheet and update db', async () => {
      const newSheet = { ...defaultChar, name: 'Overridden' };
      
      await characterStore.override(newSheet);

      expect(characterStore.sheet).toEqual(newSheet);
      expect(db.character.update).toHaveBeenCalled();
    });

    it('should update db with snapshot', async () => {
      // Setup state
      characterStore.sheet.name = 'Snapshot Test';
      
      await characterStore.update();

      // Since we can't easily spy on $state.snapshot in this context without 
      // mocking svelte exports, we verify db.character.update is called 
      // with an object that looks like the sheet.
      expect(db.character.update).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Snapshot Test'
      }));
    });
  });
});
