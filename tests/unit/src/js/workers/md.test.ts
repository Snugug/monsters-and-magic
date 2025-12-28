import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Comlink from 'comlink';

vi.mock('front-matter', () => ({
  default: vi.fn((content) => ({ attributes: {}, body: content })),
}));

import fm from 'front-matter';

vi.mock('yaml', () => ({
  stringify: vi.fn((obj) => 'mock-yaml'),
}));

import { stringify } from 'yaml';

vi.mock('comlink', () => ({
  expose: vi.fn(),
}));

describe('src/js/workers/md', () => {
  it('should expose parse and compile', async () => {
    // Import to trigger execution
    await import('$js/workers/md');

    expect(Comlink.expose).toHaveBeenCalledWith(
      expect.objectContaining({
        parse: expect.any(Function),
        compile: expect.any(Function),
      }),
    );
  });

  it('should compile markdown with frontmatter', async () => {
    await import('$js/workers/md');

    const exposedObj = (Comlink.expose as any).mock.calls[0][0];
    const compile = exposedObj.compile;

    const result = compile('# Title', { some: 'data' });

    expect(stringify).toHaveBeenCalledWith({ some: 'data' });
    expect(result).toBe('---\nmock-yaml---\n\n# Title');
  });
});
