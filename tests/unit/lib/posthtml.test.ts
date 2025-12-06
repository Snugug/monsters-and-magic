import { vi, describe, it, expect, beforeAll } from 'vitest';

// Mock astro:content before importing
vi.mock('astro:content', () => ({
  getCollection: vi.fn(async (collection: string) => {
    if (collection === 'glossary') {
      return [
        { slug: 'fatigue', data: { title: 'Fatigue' } },
        { slug: 'exhaustion', data: { title: 'Exhaustion' } },
      ];
    }
    if (collection === 'techniques') {
      return [
        {
          slug: 'strike',
          data: { title: 'Strike', basic: true, mastery: false },
        },
      ];
    }
    if (collection === 'activities') {
      return [{ slug: 'rest', data: { title: 'Rest' } }];
    }
    return [];
  }),
}));

describe('posthtml.ts', () => {
  let posthtml: any;

  beforeAll(async () => {
    const mod = await import('$lib/posthtml');
    posthtml = mod.posthtml;
  });

  describe('posthtml export', () => {
    it('should export posthtml instance', () => {
      expect(posthtml).toBeDefined();
    });

    it('should have a process method', () => {
      expect(typeof posthtml.process).toBe('function');
    });

    it('should process HTML and return result', async () => {
      const html = '<p>Test content with Fatigue reference.</p>';
      const result = await posthtml.process(html);

      expect(result).toBeDefined();
      expect(result.html).toBeDefined();
    });

    it('should transform glossary terms to ref- elements', async () => {
      const html = '<p>You take Fatigue when exhausted.</p>';
      const result = await posthtml.process(html);

      // Should contain ref- element
      expect(result.html).toContain('ref-');
    });

    it('should transform technique terms', async () => {
      const html = '<p>Use Strike to attack.</p>';
      const result = await posthtml.process(html);

      expect(result.html).toContain('techniques/strike');
    });

    it('should not transform content in non-matching tags', async () => {
      const html = '<div>Fatigue should not be transformed here.</div>';
      const result = await posthtml.process(html);

      // Should not contain ref- since div is not a valid tag
      expect(result.html).not.toContain('ref-');
    });

    it('should transform content in p tags', async () => {
      const html = '<p>Fatigue</p>';
      const result = await posthtml.process(html);

      expect(result.html).toContain('ref-');
    });

    it('should transform content in li tags', async () => {
      const html = '<ul><li>Fatigue</li></ul>';
      const result = await posthtml.process(html);

      expect(result.html).toContain('ref-');
    });

    it('should transform content in td tags', async () => {
      const html = '<table><tr><td>Fatigue</td></tr></table>';
      const result = await posthtml.process(html);

      expect(result.html).toContain('ref-');
    });

    it('should handle empty HTML', async () => {
      const html = '';
      const result = await posthtml.process(html);

      expect(result.html).toBe('');
    });

    it('should handle HTML with no matching terms', async () => {
      const html = '<p>Just some normal text.</p>';
      const result = await posthtml.process(html);

      expect(result.html).not.toContain('ref-');
      expect(result.html).toContain('Just some normal text.');
    });
  });
});
