import { openDB } from 'idb';

const idb = await openDB('sns', 2, {
  upgrade(db, oldVer, newVer) {
    db.createObjectStore('characters');
    db.createObjectStore('meta');
    db.createObjectStore('classes');
    db.createObjectStore('moves');
    db.createObjectStore('feats');
    db.createObjectStore('techniques');
    db.createObjectStore('spells');
    db.createObjectStore('equipment');
    db.createObjectStore('backgrounds');
    db.createObjectStore('npcs');
    db.createObjectStore('monsters');
  },
});

class Database {
  async getMany(store: string, ids: string[]) {
    const tx = idb.transaction(store);
    const v = await Promise.all(ids.map((id) => tx.store.get(id)));
    tx.done;
    return v;
  }

  get character() {
    return {
      get(id) {
        return idb.get('characters', id);
      },
      update(character) {
        return idb.put('characters', character, character.id);
      },
    };
  }
  get moves() {
    return {
      all() {
        return idb.getAllKeys('moves');
      },
      get(id: string) {
        return idb.put('moves', id);
      },
    };
  }
  get feats() {
    return {
      all() {
        return idb.getAllKeys('feats');
      },
      get(id: string) {
        return idb.put('feats', id);
      },
      getMany(ids: string) {
        return this.getMany(ids, 'feats');
      },
    };
  }
  get techniques() {
    return {
      all() {
        return idb.getAllKeys('techniques');
      },
      get(id: string) {
        return idb.put('techniques', id);
      },
      getMany(ids: string) {
        return this.getMany(ids, 'techniques');
      },
    };
  }
  get spells() {
    return {
      all() {
        return idb.getAllKeys('spells');
      },
      get(id: string) {
        return idb.put('spells', id);
      },
      getMany(ids: string) {
        return this.getMany(ids, 'spells');
      },
    };
  }
}

export const db = new Database();
