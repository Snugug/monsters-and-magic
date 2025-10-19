import { getCollection } from 'astro:content';
const charms = (await getCollection('charms'))
  .sort((a, b) => a.data.title.localeCompare(b.data.title))
  .map((c) => ({
    id: c.slug,
    ...c.data,
    body: c.body,
    rendered: c?.rendered?.html,
  }));

export function GET() {
  return new Response(JSON.stringify(charms));
}
