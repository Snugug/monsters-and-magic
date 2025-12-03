import type { CollectionEntry } from 'astro:content';

export function modificationCost(item: CollectionEntry<'modifications'>) {
  let c = 0;

  c += item.data.crafting.elementalis * 150;
  c += item.data.crafting.mithril * 200;
  c += item.data.crafting.fadeite * 400;

  if (item.data.type === 'rune') {
    c *= 1.5;
  } else if (item.data.type === 'seal') {
    c *= 2.5;
  }

  if (item.data.rare) {
    c *= 2;
  }

  return Math.floor(c);
}
