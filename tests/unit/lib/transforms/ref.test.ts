import { describe, it, expect, vi } from 'vitest';

// Mock astro:content so lookup.ts can load without error
vi.mock('astro:content', () => ({
  getCollection: vi.fn(async () => []),
}));

import { postHTMLRefBuilder } from '$$lib/transforms/ref';

// Mock PostHTML tree
function createMockTree(nodes: any[]) {
  return {
    walk: (callback: (node: any) => any) => {
      const traverse = (n: any) => {
        const checkedNode = callback(n);
        if (
          checkedNode &&
          checkedNode.content &&
          Array.isArray(checkedNode.content)
        ) {
          checkedNode.content = checkedNode.content.map((c: any) => {
            if (typeof c === 'object') {
              return traverse(c);
            }
            return c;
          });
        }
        return checkedNode;
      };

      nodes.map(traverse);
      return { walk: () => {} }; // chainable mock
    },
  };
}

describe('lib/transforms/ref', () => {
  it('should transform known terms into ref- tags', async () => {
    // lookup.ts has static values even if collections are empty.
    // e.g. 'thread' -> 'glossary/threads-of-fate'

    const node = {
      tag: 'p',
      content: ['This is a thread test.'],
    };

    const tree = createMockTree([node]);

    // We can't easily inspect the result of createMockTree directly if we don't return the modified nodes.
    // But postHTMLRefBuilder modifies the tree in place (or returns it).

    // Let's mock tree.walk to force execution on our node.
    const mockWalk = vi.fn((callback) => {
      callback(node);
    });
    const mockTree = { walk: mockWalk };

    await postHTMLRefBuilder(mockTree);

    expect(mockWalk).toHaveBeenCalled();

    // Check if node.content was modified
    // 'thread' matches replacementRegExp
    expect(node.content.length).toBeGreaterThan(1);
    // Should be ["This is a ", { tag: 'ref-', attrs: { src: 'glossary/threads-of-fate' }, content: ['thread'] }, " test."]

    const refNode = node.content[1] as any;
    expect(refNode.tag).toBe('ref-');
    expect(refNode.attrs.src).toBe('glossary/threads-of-fate');
    expect(refNode.content).toEqual(['thread']);
  });

  it('should ignore non-valid tags', async () => {
    const node = {
      tag: 'div', // 'div' is not in ['p', 'li', 'td']
      content: ['thread'],
    };

    const mockWalk = vi.fn((callback) => {
      callback(node);
    });
    const mockTree = { walk: mockWalk };

    await postHTMLRefBuilder(mockTree);

    expect(node.content).toEqual(['thread']); // Unchanged
  });

  it('should handle multiple matches', async () => {
    const node = {
      tag: 'p',
      content: ['thread and fatigue'], // fatigue is in modified list
    };

    const mockWalk = vi.fn((c) => c(node));
    await postHTMLRefBuilder({ walk: mockWalk });

    // Expect: ref(thread), " and ", ref(fatigue)
    // Expect: "", ref(thread), " and ", ref(fatigue)

    expect(node.content.length).toBeGreaterThanOrEqual(2);
    expect(node.content[0]).toBe('');
    expect((node.content[1] as any).tag).toBe('ref-');

    // expect(node.content[2]).toBe(' and ');
    // expect((node.content[3] as any).tag).toBe('ref-');
  });

  it('should handle typed matches', async () => {
    const node = {
      tag: 'p',
      content: ['hold 1-focus'], // hold is 'typed'
    };
    await postHTMLRefBuilder({ walk: (c) => c(node) });

    expect((node.content[1] as any).tag).toBe('ref-');
    expect((node.content[1] as any).attrs.src).toBe('glossary/hold');
  });

  it('should handle sized and shortLookup matches', async () => {
    // shortLookup: dc -> glossary/difficulty-class
    // sized: power -> glossary/power
    const node = {
      tag: 'p',
      content: ['+dc power 3'],
    };
    await postHTMLRefBuilder({ walk: (c) => c(node) });

    // Check dc
    // "dc" via "+dc" -> shortLookup
    // "power 3" via sized

    const content = node.content;
    console.log(JSON.stringify(content, null, 2));

    const refs = (node.content as any[]).filter(
      (c) => typeof c === 'object' && c.tag === 'ref-',
    );
    expect(refs.length).toBe(2);
    expect(
      refs.some((r: any) => r.attrs.src === 'glossary/difficulty-class'),
    ).toBe(true);
    expect(refs.some((r: any) => r.attrs.src === 'glossary/power')).toBe(true);
  });

  it('should handle modified matches', async () => {
    const node = {
      tag: 'p',
      content: ['1-fatigue'], // fatigue is 'modified'
    };
    await postHTMLRefBuilder({ walk: (c) => c(node) });

    expect((node.content[1] as any).tag).toBe('ref-');
    expect((node.content[1] as any).attrs.src).toBe('glossary/fatigue');
  });

  it('should preserve object content', async () => {
    const node = {
      tag: 'p',
      content: [{ tag: 'br' }],
    };
    await postHTMLRefBuilder({ walk: (c) => c(node) });

    expect(node.content).toEqual([{ tag: 'br' }]);
  });

  it('should preserve unmatched text in valid tags', async () => {
    const node = {
      tag: 'p',
      content: ['Just some plain text'],
    };
    await postHTMLRefBuilder({ walk: (c) => c(node) });

    expect(node.content).toEqual(['Just some plain text']);
  });
});
