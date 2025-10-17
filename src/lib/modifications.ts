export function modificationCost(item) {
  let c = 0;

  c += item.data.crafting.elementalis * 225;
  c += item.data.crafting.mithril * 300;
  c += item.data.crafting.fadeite * 600;

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
