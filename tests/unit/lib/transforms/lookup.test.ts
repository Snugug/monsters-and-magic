import { vi, describe, it, expect, beforeAll } from 'vitest';

// Mock astro:content before importing lookup
vi.mock('astro:content', () => ({
  getCollection: vi.fn(async (collection: string) => {
    if (collection === 'glossary') {
      return [
        { slug: 'fatigue', data: { title: 'Fatigue' } },
        { slug: 'exhaustion', data: { title: 'Exhaustion' } },
        { slug: 'action-points', data: { title: 'Action Points' } },
        { slug: 'hit-points', data: { title: 'Hit Points' } },
        { slug: 'armor-class', data: { title: 'Armor Class' } },
        { slug: 'threads-of-fate', data: { title: 'Threads' } },
        // Ignored items (should not be in lookup)
        { slug: 'hold', data: { title: 'Hold' } },
        { slug: 'focus', data: { title: 'Focus' } },
        { slug: 'cunning', data: { title: 'Cunning' } },
        { slug: 'power', data: { title: 'Power' } },
        { slug: 'luck', data: { title: 'Luck' } },
      ];
    }
    if (collection === 'techniques') {
      return [
        {
          slug: 'strike',
          data: { title: 'Strike', basic: true, mastery: false },
        },
        {
          slug: 'dodge',
          data: { title: 'Dodge', basic: true, mastery: false },
        },
        {
          slug: 'parry',
          data: { title: 'Parry', basic: false, mastery: true },
        },
        // Non-basic/mastery technique (should not be included)
        {
          slug: 'special',
          data: { title: 'Special', basic: false, mastery: false },
        },
      ];
    }
    if (collection === 'activities') {
      return [
        { slug: 'rest', data: { title: 'Rest' } },
        { slug: 'craft', data: { title: 'Craft' } },
      ];
    }
    return [];
  }),
}));

describe('transforms/lookup.ts', () => {
  let lookup: Record<string, string>;
  let shortLookup: Record<string, string>;
  let modified: Record<string, string>;
  let sized: Record<string, string>;
  let typed: Record<string, string>;
  let replacementRegExp: RegExp;

  beforeAll(async () => {
    // Import after mocking
    const mod = await import('$lib/transforms/lookup');
    lookup = mod.lookup;
    shortLookup = mod.shortLookup;
    modified = mod.modified;
    sized = mod.sized;
    typed = mod.typed;
    replacementRegExp = mod.replacementRegExp;
  });

  describe('lookup', () => {
    it('should contain glossary items (excluding ignored)', () => {
      expect(lookup['fatigue']).toBe('glossary/fatigue');
      expect(lookup['exhaustion']).toBe('glossary/exhaustion');
      expect(lookup['action points']).toBe('glossary/action-points');
    });

    it('should NOT contain ignored glossary items', () => {
      expect(lookup['hold']).toBeUndefined();
      // focus/cunning/power/luck are in lookup but as hardcoded overrides
    });

    it('should contain techniques with basic or mastery', () => {
      expect(lookup['strike']).toBe('techniques/strike');
      expect(lookup['dodge']).toBe('techniques/dodge');
      expect(lookup['parry']).toBe('techniques/parry');
    });

    it('should NOT contain non-basic/non-mastery techniques', () => {
      expect(lookup['special']).toBeUndefined();
    });

    it('should contain activities', () => {
      expect(lookup['rest']).toBe('activities/rest');
      expect(lookup['craft']).toBe('activities/craft');
    });

    it('should contain hardcoded entries', () => {
      expect(lookup['thread']).toBe('glossary/threads-of-fate');
      expect(lookup['threads']).toBe('glossary/threads-of-fate');
      expect(lookup['fly speed']).toBe('glossary/speed');
      expect(lookup['climb speed']).toBe('glossary/speed');
    });
  });

  describe('shortLookup', () => {
    it('should contain ability shortcuts', () => {
      expect(shortLookup['power']).toBe('glossary/power');
      expect(shortLookup['focus']).toBe('glossary/focus');
      expect(shortLookup['cunning']).toBe('glossary/cunning');
      expect(shortLookup['luck']).toBe('glossary/luck');
    });

    it('should contain other shortcuts', () => {
      expect(shortLookup['dc']).toBe('glossary/difficulty-class');
      expect(shortLookup['pb']).toBe('glossary/proficiency-bonus');
    });
  });

  describe('modified', () => {
    it('should contain modified term mappings', () => {
      expect(modified['ongoing']).toBe('glossary/ongoing');
      expect(modified['fatigue']).toBe('glossary/fatigue');
      expect(modified['ap']).toBe('glossary/action-points');
      expect(modified['hp']).toBe('glossary/hit-points');
    });
  });

  describe('sized', () => {
    it('should contain sized term mappings', () => {
      expect(sized['power']).toBe('glossary/power');
      expect(sized['focus']).toBe('glossary/focus');
    });
  });

  describe('typed', () => {
    it('should contain typed term mappings', () => {
      expect(typed['hold']).toBe('glossary/hold');
    });
  });

  describe('replacementRegExp', () => {
    it('should be a valid RegExp', () => {
      expect(replacementRegExp).toBeInstanceOf(RegExp);
    });

    it('should have global, multiline, case-insensitive flags', () => {
      expect(replacementRegExp.flags).toContain('g');
      expect(replacementRegExp.flags).toContain('m');
      expect(replacementRegExp.flags).toContain('i');
    });

    it('should match modified patterns like "2 fatigue"', () => {
      expect('2 fatigue'.match(replacementRegExp)).toBeTruthy();
      expect('3 exhaustion'.match(replacementRegExp)).toBeTruthy();
      expect('+1 ap'.match(replacementRegExp)).toBeTruthy();
    });

    it('should match sized patterns like "power 2"', () => {
      expect('power 2'.match(replacementRegExp)).toBeTruthy();
      expect('focus 3'.match(replacementRegExp)).toBeTruthy();
    });

    it('should match typed patterns like "hold 2-round"', () => {
      expect('hold 2-round'.match(replacementRegExp)).toBeTruthy();
      expect('hold self-inflicted'.match(replacementRegExp)).toBeTruthy();
    });

    it('should match lookup terms', () => {
      expect('fatigue'.match(replacementRegExp)).toBeTruthy();
      expect('thread'.match(replacementRegExp)).toBeTruthy();
    });

    it('should match shortLookup with + prefix', () => {
      expect('+power'.match(replacementRegExp)).toBeTruthy();
      expect('+focus'.match(replacementRegExp)).toBeTruthy();
    });
  });
});
