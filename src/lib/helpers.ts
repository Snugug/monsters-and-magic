export function chapterTitle(
  chapter: number,
  title: string,
  short: boolean = false,
) {
  if (chapter < 0) return title;

  if (short) return `${chapter === 0 ? 'Intro' : `Ch. ${chapter}`}: ${title}`;

  return `${chapter === 0 ? 'Introduction' : `Chapter ${chapter}`}: ${title}`;
}
