import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock astro:content before importing the module
vi.mock('astro:content', () => ({
  getCollection: vi.fn(async (collection: string) => {
    if (collection === 'glossary') {
      return [
        { slug: 'something', data: { title: 'Something' } },
        { slug: 'ignore-me', data: { title: 'Ignore Me' } },
        { slug: 'hold', data: { title: 'Hold' } }, // Should be ignored
      ];
    }
    if (collection === 'techniques') {
      return [
        { slug: 'tech1', data: { title: 'Tech One', basic: true } },
        { slug: 'tech2', data: { title: 'Tech Two', mastery: true } },
        { slug: 'tech3', data: { title: 'Tech Three' } }, // No basic or mastery, should be ignored
      ];
    }
    if (collection === 'activities') {
      return [{ slug: 'act1', data: { title: 'Activity One' } }];
    }
    return [];
  }),
}));

// Import the module AFTER mocking
import {
  lookup,
  shortLookup,
  modified,
  sized,
  typed,
  replacementRegExp,
} from '$$lib/transforms/lookup';

describe('lib/transforms/lookup', () => {
  it('should generate lookup object from collections', () => {
    // Check glossary
    expect(lookup).toHaveProperty('something', 'glossary/something');
    // Check ignored glossary items
    expect(lookup).not.toHaveProperty('hold');

    // Check techniques
    expect(lookup).toHaveProperty('tech one', 'techniques/tech1');
    expect(lookup).toHaveProperty('tech two', 'techniques/tech2');
    expect(lookup).not.toHaveProperty('tech three');

    // Check activities
    expect(lookup).toHaveProperty('activity one', 'activities/act1');

    // Check static additions
    expect(lookup).toHaveProperty('thread', 'glossary/threads-of-fate');
  });

  it('should export shortLookup', () => {
    expect(shortLookup).toHaveProperty('dc', 'glossary/difficulty-class');
  });

  it('should export modified', () => {
    expect(modified).toHaveProperty('ongoing', 'glossary/ongoing');
  });

  it('should export sized', () => {
    expect(sized).toHaveProperty('power', 'glossary/power');
  });

  it('should export typed', () => {
    expect(typed).toHaveProperty('hold', 'glossary/hold');
  });

  describe('replacementRegExp', () => {
    it('should match modified patterns', () => {
      // "+1 ongoing"
      expect('+1 ongoing').toMatch(replacementRegExp);
      // "-1 ongoing"
      expect('-1 ongoing').toMatch(replacementRegExp);
      // "1d6 piercing"
      expect('1d6 piercing').toMatch(replacementRegExp);
      // "5 hp"
      expect('5 hp').toMatch(replacementRegExp);
      // "1-fatigue"
      expect('1-fatigue').toMatch(replacementRegExp);
      // "2 threads"
      expect('2 threads').toMatch(replacementRegExp);
      // "10 weight"
      expect('10 weight').toMatch(replacementRegExp);
      // "1d4 piercing"
      expect('1d4 piercing').toMatch(replacementRegExp);
    });

    it('should match sized patterns', () => {
      // "power 3"
      expect('power 3').toMatch(replacementRegExp);
      // "focus 1"
      expect('focus 1').toMatch(replacementRegExp);
      // "cunning 0"
      expect('cunning 0').toMatch(replacementRegExp);
      // "luck 1"
      expect('luck 1').toMatch(replacementRegExp);
    });

    it('should match typed patterns', () => {
      // "hold 1-soft"
      expect('hold 1-soft').toMatch(replacementRegExp);
      // "hold 3-clever"
      expect('hold 3-clever').toMatch(replacementRegExp);
      // "hold 2-something"
      expect('hold 2-something').toMatch(replacementRegExp);

      // Typed regex: `(${Object.keys(typed).join('|')})\\s(\\d+|(\\+?\\w+))-\\w+`
      // It allows digits OR (+?word).
      // "hold +1-soft" ?
      expect('hold +1-soft').toMatch(replacementRegExp);
      // "hold +str-heavy" ?
      expect('hold +str-heavy').toMatch(replacementRegExp);
      // "hold +something-else"
      expect('hold +something-else').toMatch(replacementRegExp);
    });

    it('should match plain lookup patterns', () => {
      expect('thread').toMatch(replacementRegExp);
      expect('fly speed').toMatch(replacementRegExp);
      expect('something').toMatch(replacementRegExp); // From mocked glossary
      expect('tech one').toMatch(replacementRegExp); // From mocked techniques
    });

    it('should match shortLookup patterns', () => {
      // "+dc"
      expect('+dc').toMatch(replacementRegExp);
      // "+pb"
      expect('+pb').toMatch(replacementRegExp);
      // "+spell"
      expect('+spell').toMatch(replacementRegExp);
    });

    it('should NOT match invalid patterns', () => {
      // "ongoing" plain (needs number prefix)
      expect('ongoing').not.toMatch(replacementRegExp);
      // "1 invalid"
      expect('1 invalid').not.toMatch(replacementRegExp);
      // "hold 1" (needs -type)
      expect('hold 1').not.toMatch(replacementRegExp);
      // "dc" (needs +)
      expect('dc').not.toMatch(replacementRegExp);
    });
  });
});
