import type { APIRoute } from 'astro';
import { collections } from 'src/content/config';
import { createHash } from 'crypto';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const all = await Promise.all(
    Object.keys(collections)
      .filter((a) => !['chapters', 'standalone', 'glossary'].includes(a))
      .map(async (c) => {
        const items = JSON.stringify(await getCollection(c));
        const hash = createHash('sha256').update(items).digest('hex');
        return {
          id: c,
          path: `/data/${c}.json`,
          hash,
        };
      }),
  );
  return new Response(JSON.stringify(all));
};
