import * as Comlink from 'comlink';
import { Dexie, type EntityTable } from 'dexie';

const tables = [
  'activities',
  'armor',
  'cantrips',
  'charms',
  'classes',
  'feats',
  'foci',
  'gear',
  'heritage',
  'lineage',
  'modifications',
  'monster',
  'packs',
  'techniques',
  'traits',
  'weapons',
] as const;

type CollectionKeys = typeof tables;

export interface CollectionData {
  id: string;
  collection: string;
  title: string;
}

export type Database = Dexie & {
  meta: EntityTable<CollectionData, 'id'>;
  characters: EntityTable<CollectionData, 'id'>;
  [K in CollectionKeys]: EntityTable<CollectionData, 'id'>;
};

//

const stores = {
  meta: 'id',
  characters: '++id, name, lineage, heritage, class, level',
} as {
  [tableName: string]: string | null;
};

for (const collection of tables) {
  stores[collection] = 'id, collection, title';
}

export const db = new Dexie('mnm') as Database;

db.version(1).stores(stores);

async function init() {
  const collections = await (await fetch('/data/meta.json')).json();

  for (const data of collections) {
    const meta = await db.meta.get(data.id);
    if (!meta) {
      await db.meta.put(data);
    } else {
      const hashes = meta.hash === data.hash;
      if (!hashes) {
        const d = await (await fetch(data.path)).json();
        await db[data.id].clear();
        await db[data.id].bulkPut(d);
        await db.meta.put(data);
      }
    }
  }
}

// console.log(await db.gear.get('bell'));
Comlink.expose({
  db,
  init,
});
