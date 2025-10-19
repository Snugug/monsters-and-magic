import type { APIRoute } from 'astro';
import { collections } from 'src/content/config';

export const GET: APIRoute = () => {
  const result = {};

  const all = Object.keys(collections).filter(
    (a) => !['chapters', 'standalone', 'glossary'].includes(a),
  );

  for (const key of all) {
    result[key] = `/data/${key}.json`;
  }

  return new Response(JSON.stringify(result));
};
