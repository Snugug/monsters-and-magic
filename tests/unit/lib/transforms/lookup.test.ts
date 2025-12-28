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

  it('should export a RegExp', () => {
    expect(replacementRegExp).toBeInstanceOf(RegExp);
    // Basic check if it matches a known key
    expect('1 ongoing').toMatch(replacementRegExp);
  });
});
