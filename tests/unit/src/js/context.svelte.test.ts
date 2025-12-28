// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stub global constants that might be used
vi.stubGlobal('DEV', false);

// Fix hoisting by using vi.hoisted or inline mocks
const { mockCharacterUpdate, mockCharacterGet } = vi.hoisted(() => ({
  mockCharacterUpdate: vi.fn(),
  mockCharacterGet: vi.fn(),
}));

// Mock $inspect global to prevent "rune_outside_svelte" error
(global as any).$inspect = () => {};

vi.mock('$js/db', () => ({
  db: {
    character: {
      update: mockCharacterUpdate,
      get: mockCharacterGet,
    },
    hello: vi.fn(),
  },
}));

import { character, defaultCharacter } from '$js/context.svelte';

describe('src/js/context.svelte', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset character sheet to default
    character.sheet = JSON.parse(JSON.stringify(defaultCharacter));
  });

  it('should initialize with default character', () => {
    expect(character.sheet).toEqual(defaultCharacter);
  });

  describe('load', () => {
    it('should load a character from db', async () => {
      const mockChar = { ...defaultCharacter, name: 'Test Load' };
      mockCharacterGet.mockResolvedValue(mockChar);

      await character.load('some-id');

      expect(mockCharacterGet).toHaveBeenCalledWith('some-id');
      expect(character.sheet).toEqual(mockChar);
    });

    it('should handle db errors gracefully', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockCharacterGet.mockRejectedValue(new Error('DB Error'));

      await character.load('bad-id');

      expect(consoleSpy).toHaveBeenCalled();
      expect(character.sheet).toEqual(defaultCharacter); // Should remain unchanged
    });

    it('should not update sheet if character not found', async () => {
      mockCharacterGet.mockResolvedValue(undefined);
      await character.load('missing-id');
      expect(character.sheet).toEqual(defaultCharacter);
    });
  });

  describe('set', () => {
    it('should update a property and save to db', async () => {
      await character.set('name', 'New Name');

      expect(character.sheet.name).toBe('New Name');
      expect(mockCharacterUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Name' }),
      );
    });
  });

  describe('override', () => {
    it('should replace the entire sheet and save', async () => {
      const newChar = { ...defaultCharacter, name: 'Overridden' };
      await character.override(newChar);

      expect(character.sheet).toEqual(newChar);
      expect(mockCharacterUpdate).toHaveBeenCalledWith(newChar);
    });
  });

  describe('update', () => {
    it('should save snapshot to db', async () => {
      character.sheet.name = 'Direct Update';
      await character.update();
      expect(mockCharacterUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Direct Update' }),
      );
    });
  });
});
