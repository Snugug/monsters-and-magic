import * as Comlink from 'comlink';
import type { Database } from '$js/workers/db';

export const database = Comlink.wrap<{
  db: Database;
  init: () => void;
}>(
  new Worker(new URL('$js/workers/db.ts?url', import.meta.url), {
    type: 'module',
  }),
);

await database.init();

export const db = database.db as unknown as Database;
