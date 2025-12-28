import { describe, it, expect, vi } from 'vitest';

// Mock astro:content because imported dependencies use it
vi.mock('astro:content', () => ({
  getCollection: vi.fn(async () => []),
}));

import { posthtml } from '$$lib/posthtml';

describe('lib/posthtml', () => {
  it('should export a configured posthtml instance', () => {
    expect(posthtml).toBeDefined();
    // Check if it has a process method
    expect(typeof posthtml.process).toBe('function');
  });

  it('should process html using the plugins', async () => {
    // We assume plugins (ref builder) are active.
    // Even with empty collections, 'thread' is in static lookup.
    const input = '<p>thread</p>';
    const result = await posthtml.process(input);

    // ref builder runs on 'p' tags
    expect(result.html).toContain(
      '<ref- src="glossary/threads-of-fate">thread</ref->',
    );
  });
});
