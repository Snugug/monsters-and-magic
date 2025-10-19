import type { CollectionEntry } from 'astro:content';

export function chapterTitle(
  chapter: number,
  title: string,
  short: boolean = false,
) {
  if (chapter < 0) return title;

  if (short) return `${chapter === 0 ? 'Intro' : `Ch. ${chapter}`}: ${title}`;

  return `${chapter === 0 ? 'Introduction' : `Chapter ${chapter}`}: ${title}`;
}

export function sortFeats(feats: Array<CollectionEntry<'feats'>>) {
  return feats
    .sort((a, b) => a.data.title.localeCompare(b.data.title))
    .sort((a, b) => {
      if (a.data.core && !b.data.core) return -1;
      if (!a.data.core && b.data.core) return 1;
      return 0;
    })
    .sort((a, b) => {
      if (a.data.rare && !b.data.rare) return 1;
      if (!a.data.rare && b.data.rare) return -1;
      return 0;
    });
}
