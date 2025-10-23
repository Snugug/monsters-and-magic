import { sizes, elements, dieSizes, vision, speeds } from '$lib/shared';
import { db } from '$lib/db';

const traits = await db.traits.toArray();
const feats = await db.feats.toArray();
const weapons = await db.weapons.toArray();
const armor = await db.armor.toArray();
const techniques = await db.techniques.toArray();
const charms = await db.charms.toArray();

export const types = [
  'beast',
  'humanoid',
  'celestial',
  'fiend',
  'undead',
  'elemental',
  'ooze',
  'aberration',
  'fey',
  'dragon',
  'construct',
  'monstrosity',
] as const;

type elem = (typeof elements)[number];

export const baseMonster = {
  title: '',
  size: 'medium' as (typeof sizes)[number],
  // type: monsterTypes[0],
  type: 'beast' as (typeof types)[number],
  body: '',
  focus: 0,
  power: 0,
  cunning: 0,
  luck: 0,

  // Humanoids get Lineage, Traits, and Class
  lineage: '',
  traits: [] as Array<string>,
  feats: [] as Array<string>,

  // Humanoid, Celestial, Fiend, Undead, Fey, and Construct get equipment
  weapons: [] as Array<string>,
  armor: [] as Array<string>,

  // Senses
  vision: [] as Array<(typeof vision)[number]>,
  blindsight: 10,
  tremmorsense: 10,
  truesight: 10,

  // Movement
  speeds: [] as Array<(typeof speeds)[number]>,
  walking: 30,
  flying: 0,
  climbing: 0,
  swimming: 0,
  burrowing: 0,

  // Offense
  vicious: 0,
  savage: 0,
  strong: 0,
  energetic: 0,
  conditioned: 0,
  grappler: false,
  elemental: '' as elem,
  spicy: '' as elem,

  // Training
  techniques: [] as Array<string>,
  cantrips: [] as Array<string>,
  charms: [] as Array<string>,
  upcast: 0,

  // Defense
  hp: 0,
  armored: 0,
  resistance: [] as Array<elem>,
  immunity: [] as Array<elem>,
  vulnerable: [] as Array<elem>,

  // Special
  ancient: 0,
  unrelenting: false,
  undying: false,
  legendary: false,
  lair: false,
  bloodthirsty: false,
  draining: false,
  amphibious: false,
  flyby: false,
};

export type Monster = typeof baseMonster;

export const monsterCalc = {
  hp: 5,
  fatigue: 2,
  exhaustion: 1,
  ac: 0,
  damage: '1d6' as (typeof dieSizes)[number],
  tags: [] as Array<string>,
  points: 0,
  speed: {} as { [k: string]: number },
  cr: 0,
  bonus: 0,
  piercing: 0,
  reach: 5,
  ap: 3,
};

export type CalculatedMonster = typeof monsterCalc;

export function calculatePoints(monster: Monster): CalculatedMonster {
  const p = structuredClone(monsterCalc);
  let baseSpeed = 30;
  // Set starting based on size
  switch (monster.size) {
    case 'tiny':
      baseSpeed = 15;
      break;
    case 'large':
      p.reach += 5;
      baseSpeed = 35;
      break;
    case 'huge':
    case 'gargantuan':
      p.reach += 5;
      baseSpeed = 40;
      break;
  }

  // Abilities
  p.points += points(
    monster.focus + monster.power + monster.cunning + monster.luck - 2,
    2,
  );
  p.ac += monster.cunning;

  // Humanoid
  if (
    monster.type === 'humanoid' &&
    monster.lineage &&
    monster.traits?.length
  ) {
    const spend = monster.traits
      .map((t) => traits.find((a) => a.id === t)?.points)
      .reduce((acc, cur) => acc + cur, 0);
    p.points += points(spend || 0);
  }

  if (monster.type === 'humanoid' && monster.feats?.length) {
    const s = spend(monster.feats, feats);
    p.points += points(s, 3);
  }

  const totalNeutralSpeed = baseSpeed * (monster.speeds.length + 1);
  const totalSpentSpeed =
    monster.walking +
    usedSpeed(monster, 'flying') +
    usedSpeed(monster, 'climbing') +
    usedSpeed(monster, 'swimming') +
    usedSpeed(monster, 'burrowing');

  const speedDiff = Math.ceil((totalSpentSpeed - totalNeutralSpeed) / 10);

  p.points += points(speedDiff);
  if (speedDiff > 0) {
    p.tags.push('fast');
  } else if (speedDiff < 0) {
    p.tags.push('slow');
  }

  p.speed.walking = monster.walking;
  if (monster.speeds.includes('flying')) {
    p.speed.flying = monster.flying;
    p.points += 3;
    p.tags.push('flying');
  }
  if (monster.speeds.includes('climbing')) {
    p.speed.climbing = monster.climbing;
    p.points += 1;
    p.tags.push('climbing');
  }
  if (monster.speeds.includes('swimming')) {
    p.speed.swimming = monster.swimming;
    p.points += 1;
    p.tags.push('swimming');
  }
  if (monster.speeds.includes('burrowing')) {
    p.speed.burrowing = monster.burrowing;
    p.points += 2;
    p.tags.push('burrowing');
  }

  // if (monster.flying.has) {
  //   p.points += 3;
  //   p.tags.push('flying');
  // }
  // if (monster.climbing.has) {
  //   p.points += 1;
  //   p.tags.push('climbing');
  // }
  // if (monster.swimming.has) {
  //   p.points += 1;
  //   p.tags.push('swimming');
  // }
  // if (monster.burrowing.has) {
  //   p.points += 2;
  //   p.tags.push('burrowing');
  // }

  // console.log('----');
  // console.log(totalNeutralSpeed);
  // console.log(totalSpentSpeed);
  // console.log(speedDiff);
  // console.log('----');

  // Offense
  if (monster.vicious !== 0) {
    const { damage } = p;
    const di = dieSizes.findIndex((e) => e === damage);
    p.damage = dieSizes[di + monster.vicious];
    p.points += points(monster.vicious);
    if (monster.vicious > 0) {
      p.tags.push('vicious');
    } else if (monster.vicious < 0) {
      p.tags.push('timid');
    }
  }

  if (monster.grappler) {
    p.points += 3;
    p.tags.push('grappler');
  }

  // Equipment
  if (monster.weapons?.length) {
    const w = monster.weapons
      .map((w) => {
        const { damage } = weapons.find((f) => f.id === w);
        const di = dieSizes.findIndex((e) => e === damage);
        const offset = dieSizes.findIndex((e) => e === p.damage);
        return di - offset;
      })
      .sort()
      .reverse()[0];
    if (w > 0) {
      p.points += points(monster.vicious + w) - points(monster.vicious);
    }

    p.tags.push('armed');
  }

  if (monster.savage !== 0) {
    p.piercing += monster.savage;
    console.log(p);
    p.points += points(monster.savage, 2);
    p.tags.push('savage');
  }
  if (monster.strong !== 0) {
    p.bonus += monster.strong * 2;
    p.points += points(monster.strong, 2);
    if (monster.strong > 0) {
      p.tags.push('strong');
    } else if (monster.strong < 0) {
      p.tags.push('weak');
    }
  }

  if (monster.energetic !== 0) {
    p.fatigue += monster.energetic * 3;
    p.points += points(monster.energetic, 2);
    p.tags.push('energetic');
  }

  if (monster.conditioned !== 0) {
    p.exhaustion += 2 * monster.conditioned;
    p.points += points(monster.conditioned, 4);
    p.tags.push('conditioned');
  }

  if (monster.elemental) {
    p.points += 1;
    p.tags.push('elemental');
  }

  if (monster.spicy) {
    p.points += 4;
    p.tags.push('spicy');
  }

  // Training
  if (monster.techniques.length) {
    const s = spend(monster.techniques, techniques);
    p.points += points(s);
    p.tags.push('skilled');
  }

  if (monster.cantrips.length) {
    p.points += points(monster.cantrips.length);
  }

  if (monster.charms.length) {
    p.points += points(spend(monster.charms, charms), 2);
  }

  if (monster.cantrips.length && !monster.charms.length) {
    p.tags.push('caster');
  } else if (monster.cantrips.length && monster.charms.length) {
    p.tags.push('advanced caster');
  }

  // Defense
  if (monster.armored !== 0) {
    p.ac += monster.armored;
    if (!monster.armor?.length) {
      p.points += points(monster.armored);
    }
  }

  // Armor
  if (monster.armor?.length) {
    const a = monster.armor
      .map((w) => {
        const g = armor.find((f) => f.id === w);
        if (g) {
          return g.ac;
        }

        return 0;
      })
      .reduce((acc, cur) => acc + cur, 0);

    p.ac += a;
    p.points += points(a + monster.armored);
  }

  // TODO: Better armor tags
  if (p.ac - monster.cunning > 0) {
    p.tags.push('heavily armored');
  } else if (p.ac - monster.cunning < 0) {
    p.tags.push('lightly armored');
  }

  // HP
  if (monster.hp !== 0) {
    p.hp += monster.hp * 5;
    p.points += points(monster.hp);
    if (monster.hp < 0) {
      p.tags.push('frail');
    } else if (monster.hp > 0) {
      p.tags.push('stout');
    }
  }

  // Resistance
  if (monster.resistance.length) {
    const physical = monster.resistance.includes('physical');

    if (physical) {
      p.points += 3;
      p.points += points(monster.resistance.length - 1, 2);
      p.tags.push('thick-skinned');
      if (monster.resistance.length > 1) {
        p.tags.push('resistant');
      }
    } else {
      p.points += points(monster.resistance.length, 2);
      p.tags.push('resistant');
    }
  }
  if (monster.immunity.length) {
    p.points += points(monster.immunity.length, 5);
    p.tags.push('immune');
  }
  if (monster.vulnerable.length) {
    p.points -= points(monster.vulnerable.length);
    p.tags.push('vulnerable');
  }

  // Special
  if (monster.ancient !== 0) {
    p.ap += monster.ancient;
    p.points += points(monster.ancient, 4);
    p.tags.push('ancient');
  }
  if (monster.undying) {
    p.points += 3;
    p.tags.push('undying');
  }
  if (monster.unrelenting) {
    p.points += 3;
    p.tags.push('unrelenting');
  }
  if (monster.draining) {
    p.points += 3;
    p.tags.push('draining');
  }
  if (monster.bloodthirsty) {
    p.points += 3;
    p.tags.push('bloodthirsty');
  }
  if (monster.legendary) {
    p.points += 10;
    p.tags.push('legendary');
  }
  if (monster.lair) {
    p.points += 5;
    p.tags.push('lair');
  }
  if (monster.amphibious) {
    p.points += 1;
    p.tags.push('amphibious');
  }
  if (monster.flyby) {
    p.points += 3;
    p.tags.push('flyby');
  }

  // Set CR at the end
  if (p.points < 10) {
    p.cr = 0;
  } else if (p.points < 15) {
    p.cr = 1;
  } else {
    p.cr = Math.floor(p.points / 10);
  }

  return p;
}

// Determine point spend
function points(steps: number, start: number = 1) {
  // Raw steps may be negative
  const negative = steps < 0;
  steps = Math.abs(steps);
  // 1. Handle edge cases for steps
  if (steps <= 0) {
    return 0;
  }
  if (steps === 1) {
    if (negative) {
      return 0 - start;
    }
    return start;
  }

  // Initialize the first two terms and the running sum.
  // 'a' holds the (n-2) term, 'b' holds the (n-1) term.
  let a = start;
  let b = start;

  // The sum starts with the first two terms: start + start
  let sum = a + b;

  // Loop starts at i=3 because the first two elements (i=1 and i=2) are already accounted for.
  // It runs up to and including 'steps' to generate the remaining terms.
  for (let i = 3; i <= steps; i++) {
    // Calculate the next term (n)
    const next = a + b;

    // Add the next term to the running sum
    sum += next;

    // Shift the terms for the next iteration:
    // The old (n-1) term (b) becomes the new (n-2) term (a)
    // The new term (nextTerm) becomes the new (n-1) term (b)
    a = b;
    b = next;
  }

  if (negative) {
    return 0 - sum;
  }

  return sum;
}

function spend(
  list: Array<string>,
  items: Array<{
    id: string;
    rare: boolean;
  }>,
) {
  return list
    .map((f) => {
      const i = items.find((a) => a.id === f);
      if (i?.rare) {
        return 2;
      }
      return 1;
    })
    .reduce((acc: number, cur: number) => acc + cur, 0);
}

export function usedSpeed(monster: Monster, speed: (typeof speeds)[number]) {
  if (monster.speeds.includes(speed)) {
    return monster[speed];
  }
  return 0;
}
