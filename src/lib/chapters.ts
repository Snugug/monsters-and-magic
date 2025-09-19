import { getCollection } from 'astro:content';
import type { MarkdownHeading } from 'astro';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

export interface Chapter {
  title: string;
  url: string;
  chapter: number;
  slug: string;
  headings: MarkdownHeading[];
  Content: AstroComponentFactory;
}

export async function buildChapter(
  c: CollectionEntry<'chapters'>,
): Promise<Chapter> {
  const r = await c.render();
  console.log(r);
  return {
    title: c.data.title,
    slug: c.slug,
    url: `/rules/${c.slug}`,
    chapter: c.data.chapter,
    headings: r.headings,
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
