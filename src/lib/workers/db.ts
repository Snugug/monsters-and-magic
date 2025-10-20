import * as Comlink from 'comlink';
import { Dexie, type EntityTable } from 'dexie';
import type { CollectionEntry } from 'astro:content';

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

export interface CollectionData {
  id: string;
  collection: string;
  title: string;
}

export interface MetaCollection {
  id: string;
  hash: string;
  path: string;
}

export type Database = Dexie & {
  meta: EntityTable<MetaCollection, 'id'>;
} & {
  [K in (typeof tables)[number]]: EntityTable<
    CollectionData & CollectionEntry<K>['data'],
    'id'
  >;
};

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
  const collections = (await (
    await fetch('/data/meta.json')
  ).json()) as Array<MetaCollection>;

  for (const data of collections) {
    const meta = await db.meta.get(data.id);
    if (!meta) {
      await db.meta.put(data);
    } else {
      const hashes = meta.hash === data.hash;
      if (!hashes) {
        const d = await (await fetch(data.path)).json();
        if (db[data.id]) {
          await db[data.id].clear();
          await db[data.id].bulkPut(d);
          await db.meta.put(data);
        }
      }
    }
  }
}

// console.log(await db.gear.get('bell'));
Comlink.expose({
  db,
  init,
});
