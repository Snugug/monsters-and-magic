import { db } from '$lib/db';

export const defaultCharacter = {
  id: '',
  name: '',
  abilities: {
    str: 0,
    dex: 0,
    con: 0,
    wis: 0,
    int: 0,
    cha: 0,
  },
} as Character;

class CharacterStore {
  sheet = $state(defaultCharacter);

  constructor() {}

  async load(id) {
    // console.log('Banana');
    try {
      const c = await db.character.get(id);
      // console.log(c);

      // TODO: Remove to not plop in half-baked character
      if (c) {
        this.sheet = c;
      }
    } catch (e) {
      console.error(e);
    }

    return;
  }

  async set(prop, value) {
    this.sheet[prop] = value;
    await this.update();
  }

  async override(value) {
    this.sheet = value;
    await this.update();
  }

  async update() {
    const s = $state.snapshot(this.sheet);
    await db.character.update(s);
    // console.log(s);
    // console.log(await db.hello());
    // console.log('----');
  }

  // async update(value) {

  //   console.log('Updated');
  //   console.log(value);
  //   console.log(db.hello());
  //   console.log('Banana');
  //   $inspect(this.sheet);
  // }
}

class Store {
  locked = $state(true);
  moves = $state(true);
  techniques = $state(true);
  conditions = $state(true);
  statuses = $state(true);
}

export const character = new CharacterStore();
export const meta = new Store() as Meta;
