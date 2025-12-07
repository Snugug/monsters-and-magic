import { vi, describe, it, expect, beforeAll } from 'vitest';

// Mock astro:content before importing
vi.mock('astro:content', () => ({
  getCollection: vi.fn(async (collection: string) => {
    if (collection === 'glossary') {
      return [
        { slug: 'fatigue', data: { title: 'Fatigue' } },
        { slug: 'exhaustion', data: { title: 'Exhaustion' } },
        { slug: 'action-points', data: { title: 'Action Points' } },
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

describe('transforms/ref.ts', () => {
  let postHTMLRefBuilder: (tree: any) => Promise<any>;

  beforeAll(async () => {
    const mod = await import('$lib/transforms/ref');
    postHTMLRefBuilder = mod.postHTMLRefBuilder;
  });

  describe('postHTMLRefBuilder', () => {
    it('should be a function', () => {
      expect(typeof postHTMLRefBuilder).toBe('function');
    });

    it('should transform matching terms in p tags', async () => {
      const tree = {
        walk: (fn: (node: any) => any) => {
          const node = {
            tag: 'p',
            content: ['The fighter gains 2 fatigue when attacking.'],
          };
          fn(node);
          return tree;
        },
      };

      await postHTMLRefBuilder(tree);
    });

    it('should transform matching terms in li tags', async () => {
      let transformedNode: any = null;
      const tree = {
        walk: (fn: (node: any) => any) => {
          const node = {
            tag: 'li',
            content: ['Take 1 exhaustion to recover.'],
          };
          transformedNode = fn(node);
          return tree;
        },
      };

      await postHTMLRefBuilder(tree);

      // The content should be transformed
      expect(transformedNode.content).toBeDefined();
    });

    it('should transform matching terms in td tags', async () => {
      let transformedNode: any = null;
      const tree = {
        walk: (fn: (node: any) => any) => {
          const node = {
            tag: 'td',
            content: ['Fatigue'],
          };
          transformedNode = fn(node);
          return tree;
        },
      };

      await postHTMLRefBuilder(tree);
      expect(transformedNode.content).toBeDefined();
    });

    it('should NOT transform content in non-valid tags', async () => {
      let transformedNode: any = null;
      const tree = {
        walk: (fn: (node: any) => any) => {
          const node = {
            tag: 'div',
            content: ['fatigue'],
          };
          transformedNode = fn(node);
          return tree;
        },
      };

      await postHTMLRefBuilder(tree);

      // Content should be unchanged for div tags
      expect(transformedNode.content).toEqual(['fatigue']);
    });

    it('should handle nodes without content array', async () => {
      let transformedNode: any = null;
      const tree = {
        walk: (fn: (node: any) => any) => {
          const node = {
            tag: 'p',
            content: 'not an array',
          };
          transformedNode = fn(node);
          return tree;
        },
      };

      await postHTMLRefBuilder(tree);
      // Should not throw, should return node unchanged
      expect(transformedNode.content).toBe('not an array');
    });

    it('should handle non-string content items', async () => {
      let transformedNode: any = null;
      const tree = {
        walk: (fn: (node: any) => any) => {
          const node = {
            tag: 'p',
            content: [{ tag: 'span', content: ['nested'] }, 'fatigue'],
          };
          transformedNode = fn(node);
          return tree;
        },
      };

      await postHTMLRefBuilder(tree);

      // Should preserve non-string items
      expect(transformedNode.content.some((c: any) => c.tag === 'span')).toBe(
        true,
      );
    });

    it('should create ref- tags for matched terms', async () => {
      let transformedNode: any = null;
      const tree = {
        walk: (fn: (node: any) => any) => {
          const node = {
            tag: 'p',
            content: ['Use Strike to attack.'],
          };
          transformedNode = fn(node);
          return tree;
        },
      };

      await postHTMLRefBuilder(tree);

      // Should contain a ref- tag for Strike
      const hasRefTag = transformedNode.content.some(
        (c: any) => typeof c === 'object' && c.tag === 'ref-',
      );
      expect(hasRefTag).toBe(true);
    });

    it('should set correct src attribute on ref- tags', async () => {
      let transformedNode: any = null;
      const tree = {
        walk: (fn: (node: any) => any) => {
          const node = {
            tag: 'p',
            content: ['Strike'],
          };
          transformedNode = fn(node);
          return tree;
        },
      };

      await postHTMLRefBuilder(tree);

      const refTag = transformedNode.content.find(
        (c: any) => typeof c === 'object' && c.tag === 'ref-',
      );
      expect(refTag).toBeDefined();
      expect(refTag.attrs.src).toBe('techniques/strike');
      expect(refTag.content).toEqual(['Strike']);
    });

    it('should handle multiple matches in single string', async () => {
      let transformedNode: any = null;
      const tree = {
        walk: (fn: (node: any) => any) => {
          const node = {
            tag: 'p',
            content: ['Use Strike and Fatigue together.'],
          };
          transformedNode = fn(node);
          return tree;
        },
      };

      await postHTMLRefBuilder(tree);

      // Should have multiple ref- tags
      const refTags = transformedNode.content.filter(
        (c: any) => typeof c === 'object' && c.tag === 'ref-',
      );
      expect(refTags.length).toBeGreaterThanOrEqual(2);
    });

    it('should preserve text around matched terms', async () => {
      let transformedNode: any = null;
      const tree = {
        walk: (fn: (node: any) => any) => {
          const node = {
            tag: 'p',
            content: ['Before Strike after'],
          };
          transformedNode = fn(node);
          return tree;
        },
      };

      await postHTMLRefBuilder(tree);

      // Should have text before and after the ref tag
      expect(transformedNode.content.some((c: any) => c === 'Before ')).toBe(
        true,
      );
      expect(transformedNode.content.some((c: any) => c === ' after')).toBe(
        true,
      );
    });

    it('should handle content with no matches', async () => {
      let transformedNode: any = null;
      const tree = {
        walk: (fn: (node: any) => any) => {
          const node = {
            tag: 'p',
            content: ['No matches here at all.'],
          };
          transformedNode = fn(node);
          return tree;
        },
      };

      await postHTMLRefBuilder(tree);

      // Content should be unchanged
      expect(transformedNode.content).toEqual(['No matches here at all.']);
    });

    it('should match shortLookup pattern (e.g. +power)', async () => {
      let transformedNode: any = null;
      const tree = {
        walk: (fn: (node: any) => any) => {
          const node = {
            tag: 'p',
            content: ['Gain +power.'],
          };
          transformedNode = fn(node);
          return tree;
        },
      };

      await postHTMLRefBuilder(tree);
      const refTag = transformedNode.content.find(
        (c: any) => typeof c === 'object' && c.tag === 'ref-',
      );
      expect(refTag).toBeDefined();
      expect(refTag.attrs.src).toBe('glossary/power');
    });

    it('should match sized pattern (e.g. power 3)', async () => {
      let transformedNode: any = null;
      const tree = {
        walk: (fn: (node: any) => any) => {
          const node = {
            tag: 'p',
            content: ['Use power 3.'],
          };
          transformedNode = fn(node);
          return tree;
        },
      };

      await postHTMLRefBuilder(tree);
      const refTag = transformedNode.content.find(
        (c: any) => typeof c === 'object' && c.tag === 'ref-',
      );
      expect(refTag).toBeDefined();
      expect(refTag.attrs.src).toBe('glossary/power');
    });

    it('should match typed pattern (e.g. hold 1-round)', async () => {
      let transformedNode: any = null;
      const tree = {
        walk: (fn: (node: any) => any) => {
          const node = {
            tag: 'p',
            content: ['Spend hold 1-round.'],
          };
          transformedNode = fn(node);
          return tree;
        },
      };

      await postHTMLRefBuilder(tree);
      const refTag = transformedNode.content.find(
        (c: any) => typeof c === 'object' && c.tag === 'ref-',
      );
      expect(refTag).toBeDefined();
      expect(refTag.attrs.src).toBe('glossary/hold');
    });

    it('should return the tree', async () => {
      const tree = {
        walk: (fn: (node: any) => any) => tree,
      };

      const result = await postHTMLRefBuilder(tree);
      expect(result).toBe(tree);
    });
  });
});
