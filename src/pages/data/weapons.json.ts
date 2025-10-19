import { getCollection } from 'astro:content';
const weapons = (await getCollection('weapons'))
  .sort((a, b) => a.data.title.localeCompare(b.data.title))
  .map((c) => ({
    id: c.slug,
    ...c.data,
  }));

export function GET() {
  return new Response(JSON.stringify(weapons));
}
