import * as Comlink from 'comlink';
import type fm from 'front-matter';

export const md = Comlink.wrap<{
  parse: typeof fm;
  compile: (md: string, data: object) => string;
}>(
  new Worker(new URL('$js/workers/md.ts?url', import.meta.url), {
    type: 'module',
  }),
);
