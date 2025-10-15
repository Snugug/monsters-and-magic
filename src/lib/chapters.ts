import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { MarkdownHeading } from 'astro';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import slugify from 'slugify';

export interface Chapter {
  title: string;
  url: string;
  chapter: number;
  slug: string;
  headings: MarkdownHeading[];
  Content: AstroComponentFactory;
}

function insert(arr: Array<any>, index: number, add: any) {
  const first = arr.slice(0, index + 1);
  const rest = arr.slice(index + 1);
  return [first, add, rest].flat();
}

export async function buildChapter(
  c: CollectionEntry<'chapters'>,
): Promise<Chapter> {
  const r = await c.render();

  let headings = r.headings;

  // Insert table headers
  if (c.slug === 'character-origins') {
    const l = (await getCollection('lineage'))
      .sort((a, b) => a.data.title.localeCompare(b.data.title))
      .map((lin) => {
        const h = [{ depth: 3, slug: lin.slug, text: lin.data.title }];
        for (const trait of lin.data.traits) {
          h.push({
            depth: 4,
            slug: slugify(trait.title, { lower: true }),
            text: trait.title,
          });
        }
        return h;
      })
      .flat();
    const li = headings.findIndex((h) => h.slug === 'lineages');
    headings = insert(headings, li, l);

    const h = (await getCollection('heritage'))
      .sort((a, b) => a.data.title.localeCompare(b.data.title))
      .map((her) => ({ depth: 3, slug: her.slug, text: her.data.title }));
    const hi = headings.findIndex((h) => h.slug === 'heritages');
    headings = insert(headings, hi, h);
  }

  if (c.slug === 'character-classes') {
    headings = (await getCollection('classes'))
      .sort((a, b) => a.data.title.localeCompare(b.data.title))
      .map((cla) => {
        const h = [{ depth: 2, slug: cla.slug, text: cla.data.title }];
        for (const feat of cla.data.feats) {
          h.push({
            depth: 3,
            slug: slugify(feat.title, { lower: true }),
            text: feat.title,
          });
        }

        return h;
      })
      .flat();
  }

  if (c.slug === 'techniques') {
    const techniques = (await getCollection('techniques')).sort((a, b) =>
      a.data.title.localeCompare(b.data.title),
    );
    const basic = techniques
      .filter((a) => a.data.type === 'basic')
      .map((a) => ({ depth: 3, slug: a.slug, text: a.data.title }));
    const adv = techniques
      .filter((a) => a.data.type === 'advanced')
      .map((a) => ({ depth: 3, slug: a.slug, text: a.data.title }));
    const rare = techniques
      .filter((a) => a.data.type === 'rare')
      .map((a) => ({ depth: 3, slug: a.slug, text: a.data.title }));
    // console.log(headings);

    const bi = headings.findIndex((h) => h.slug === 'basic-techniques');
    headings = insert(headings, bi, basic);
    const ai = headings.findIndex((h) => h.slug === 'advanced-techniques');
    headings = insert(headings, ai, adv);
    const ri = headings.findIndex((h) => h.slug === 'rare-techniques');
    headings = insert(headings, ri, rare);
  }

  if (c.slug === 'spellcasting') {
    const cantrips = (await getCollection('cantrips'))
      .sort((a, b) => a.data.title.localeCompare(b.data.title))
      .map((a) => ({ depth: 3, slug: a.slug, text: a.data.title }));
    const charms = (await getCollection('charms'))
      .sort((a, b) => a.data.title.localeCompare(b.data.title))
      .map((a) => ({
        depth: 3,
        slug: a.slug,
        text: a.data.title,
        rare: a.data.rare,
      }));

    const c1 = charms.filter((c) => c.rare === false);
    const c2 = charms.filter((c) => c.rare === true);

    let f = headings.findIndex((h) => h.slug === 'cantrips');
    headings = insert(headings, f, cantrips);
    f = headings.findIndex((h) => h.slug === 'charms');
    headings = insert(headings, f, c1);
    f = headings.findIndex((h) => h.slug === 'rare-charms');
    headings = insert(headings, f, c2);
  }

  return {
    title: c.data.title,
    slug: c.slug,
    url: `/rules/${c.slug}`,
    chapter: c.data.chapter,
    headings: headings,
    Content: r.Content,
  };
}

export const chapters = (
  await Promise.all((await getCollection('chapters')).map(buildChapter))
).sort((a, b) => {
  if (a.chapter < b.chapter) return -1;
  if (a.chapter > b.chapter) return 1;
  return 0;
}) as Chapters[];
