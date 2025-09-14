import type { RawNode } from 'posthtml';

import {
  replacementRegExp as r,
  lookup,
  shortLookup,
  modified,
  sized,
  typed,
} from './lookup';

const valid = ['p', 'li', 'td'];

export async function postHTMLRefBuilder(tree) {
  tree.walk((node) => {
    if (valid.includes(node.tag) && Array.isArray(node.content)) {
      let content = [] as Array<string | RawNode>;
      for (let i = 0; i < node.content.length; i++) {
        const c = node.content[i];
        if (typeof c === 'string') {
          if (c.match(r)) {
            const found = c.matchAll(r);
            let pointer = 0;
            let holder = [] as Array<string | RawNode>;

            for (const f of found) {
              const { 0: word, 9: sl, 5: mod, 6: sz, 7: ty, index } = f;
              // console.log(f);

              const sub = c.substring(pointer, index);
              holder.push(sub);

              let src = lookup[word.toLowerCase()];

              if (sl) {
                src = shortLookup[sl.toLowerCase()];
                console.log(src);
              }

              if (mod) {
                src = modified[mod.toLowerCase()];
              }

              if (sz) {
                src = sized[sz.toLowerCase()];
              }

              if (ty) {
                src = typed[ty.toLowerCase()];
              }

              const ref = {
                tag: 'ref-',
                attrs: { src },
                content: [word],
              } as RawNode;

              holder.push(ref);

              pointer += sub.length + word.length;
            }
            holder.push(c.substring(pointer));

            content = [...content, ...holder];
          } else {
            content.push(c);
          }
        } else {
          content.push(c);
        }
      }

      node.content = content;
    }

    return node;
  });

  return tree;
}
