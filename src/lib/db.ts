import * as Comlink from 'comlink';
import type { Database } from '$lib/workers/db';
// import Database from '$lib/workers/db.ts?sharedworker';

// const database = new Database();

export const database = Comlink.wrap<{
  db: Database;
  init: () => void;
}>(
  new Worker(new URL('$lib/workers/db.ts?url', import.meta.url), {
    type: 'module',
  }),
);

await database.init();

export const db = database.db;
