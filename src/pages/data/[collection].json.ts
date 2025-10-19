import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { collections } from 'src/content/config';

// const cantrips = (await getCollection('cantrips'))
//   .sort((a, b) => a.data.title.localeCompare(b.data.title))
// .map((c) => ({
//   id: c.slug,
//   ...c.data,
//   body: c.body,
//   rendered: c?.rendered?.html,
// }));

export const GET: APIRoute = async ({ params }) => {
  if (params.collection !== undefined) {
    const collection = (await getCollection(params.collection))
      .sort((a, b) => a.data.title.localeCompare(b.data.title))
      .map((c) => {
        const result = {
          id: c.slug,
          collection: params.collection,
          ...c.data,
        };

        // if (c.body) {
        //   result.body = c.body;
        // }
        if (c?.rendered?.html) {
          result.body = c.rendered.html;
        }
        return result;
      });

    return new Response(JSON.stringify(collection));
  }
};

// export function GET(({params})) {
//   // return new Response(JSON.stringify(cantrips));
// }

export function getStaticPaths() {
  return Object.keys(collections).map((c) => ({
    params: { collection: c },
  }));
}
