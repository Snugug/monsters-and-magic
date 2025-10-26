import {
  sizes,
  elements,
  dieSizes,
  vision,
  speeds,
  monsterTypes,
} from '$lib/shared';
import { db } from '$lib/db';

const traits = await db.traits.toArray();
const feats = await db.feats.toArray();
const weapons = await db.weapons.toArray();
const armor = await db.armor.toArray();
const techniques = await db.techniques.toArray();
const charms = await db.charms.toArray();

export const types = monsterTypes;

export const newWeaponBase = {
  name: 'Fist' as string,
  damage: '1d6' as (typeof dieSizes)[number],
  element: 'physical' as (typeof elements)[number],
};

export const newAttackBase = {
  name: '',
  type: 'attack' as
    | 'attack'
    | 'power'
    | 'focus'
    | 'cunning'
    | 'reaction'
    | 'other',
  damage: '1d6' as (typeof dieSizes)[number] | '',
  element: '' as (typeof elements)[number] | '',
  condition: '',
  ap: 2,
  fatigue: 0,
  trigger: '',
  recharge: '' as '1d4' | '1d6' | '1d8' | '1d10',
  thread: false,
  description: '',
};

export const tags = {
  aggressive: 'Using Strike multiple times per turn costs 1 fewer AP',
  amphibious: 'Can breathe air and water',
  ancient: 'Increases AP by 1',
  aquatic: 'Can only breathe underwater',
  bloodthirsty:
    'When at ½ HP or less, gain bonus to ability checks and damage rolls equal to CR',
  burden: 'Carrying capacity is doubled',
  compression:
    'Can move through a space as narrow as 1 inch without expending extra movement',
  draining:
    'Once per turn when dealing damage with a melee attack, recover ½ damage or fatigue dealt',
  escape: 'The AP cost for Disengage and Hide is reduced by 1',
  flyby: `Doesn't provoke reactions when leaving an enemy's reach`,
  grappler: 'Halves the fatigue needed to keep a foe restrained',
  illumination: `Naturally emits bright light in a 10' radius, and dim light an additional 10'`,
  jumper: 'Long jump and high jump distances are doubled',
  lair: 'Has control over its surroundings, letting it take Lair Actions at the start of a round',

  legendary: 'Can use Legendary Actions, Reactions, and Resistances',
  pack: `When an ally is within 5' of a creature, attack rolls against that creature gain +2 ongoing. The ally can't be unconscious.`,
  swarm: `Can occupy another creature's space and move through tiny openings, but cannot regain HP or gain temporary HP`,

  undying:
    'When fully exhausted, at the start of its next turn can spend 1 thread to recover all fatigue and 1 exhaustion.',
  unrelenting:
    'When damage would drop it to 0 HP but not outright kill it, can spend 1 thread to drop to 1 HP instead',
};

type elem = (typeof elements)[number];

export const baseMonster = {
  title: '',
  size: 'medium' as (typeof sizes)[number],
  // type: monsterTypes[0],
  type: 'beast' as (typeof types)[number],
  image: '',
  focus: 0,
  power: 1,
  cunning: 1,
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
  // vicious: 0,
  savage: 0,
  strong: 0,
  energetic: 0,
  conditioned: 0,

  // elemental: '' as elem,
  spicy: '' as elem,
  naturalWeapons: [newWeaponBase] as Array<typeof newWeaponBase>,
  attacks: [] as Array<typeof newAttackBase>,

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
  ancient: false,
  unrelenting: false,
  undying: false,
  legendary: false,
  lair: false,
  bloodthirsty: false,
  draining: false,
  amphibious: false,
  flyby: false,
  aquatic: false,
  pack: false,
  illumination: false,
  escape: false,
  swarm: false,
  jumper: false,
  compression: false,
  burden: false,
  aggressive: false,
  grappler: false,
};

export type Monster = typeof baseMonster;

export const monsterCalc = {
  cr: 0,
  points: 0,
  tags: [] as Array<string>,
  hp: 5,
  fatigue: 2,
  exhaustion: 1,
  speed: {} as { [k: string]: number },
  ac: 0,
  bonus: 0,
  piercing: 0,
  reach: 5,
  ap: 3,
};

export type CalculatedMonster = typeof monsterCalc;

export function calculatePoints(monster: Monster): CalculatedMonster {
  const p = structuredClone(monsterCalc);
  let baseSpeed = 30;
  let baseHP = 5;
  let baseDamge = '1d6';
  // Set starting based on size
  switch (monster.size) {
    case 'tiny':
      baseSpeed = 15;
      baseHP = 3;
      p.points -= 1;
      break;
    case 'small':
      baseHP = 4;
      break;
    case 'large':
      p.reach += 5;
      baseSpeed = 35;
      baseHP = 6;
      p.points += 1;
      break;
    case 'huge':
      p.reach += 5;
      baseSpeed = 40;
      baseHP = 7;
      p.points += 2;
      break;
    case 'gargantuan':
      p.reach += 5;
      baseSpeed = 40;
      baseHP = 10;
      p.points += 3;
      break;
  }
  p.hp = baseHP + baseHP * monster.power;

  // Abilities
  p.points += points(
    monster.focus + monster.power + monster.cunning + monster.luck - 2,
    2,
  );

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

  if (monster.feats?.length) {
    const s = spend(monster.feats, feats);
    p.points += points(s, 3);
  }

  // Vision
  if (monster.vision.includes('low-light vision')) {
    p.points += 1;
  }
  if (monster.vision.includes('darkvision')) {
    p.points += 2;
  }
  if (monster.vision.includes('blindsight')) {
    p.points += points(monster.blindsight / 10, 2);
  }
  if (monster.vision.includes('tremmorsense')) {
    p.points += points(monster.tremmorsense / 10, 2);
  }
  if (monster.vision.includes('truesight')) {
    p.points += points(monster.truesight / 10, 3);
  }

  // Movement

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

  // Offense
  if (monster.savage !== 0) {
    p.piercing += monster.savage;
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

  if (monster.spicy) {
    p.points += 4;
    p.tags.push('spicy');
  }

  // Damage
  let vmax = null;

  // Weapons
  if (monster.weapons?.length) {
    for (const w of monster.weapons) {
      const fw = weapons.find((f) => f.id === w);
      if (fw) {
        const di = dieSizes.findIndex((e) => e === fw.damage);
        if (vmax === null || di > vmax) {
          vmax = di;
        }
      }
    }
    p.tags.push('armed');
  }

  // Natural Weapons
  if (monster.naturalWeapons.length) {
    // Damage Size
    for (const w of monster.naturalWeapons) {
      const di = dieSizes.findIndex((e) => e === w.damage);
      if (vmax === null || di > vmax) {
        vmax = di;
      }
    }
  }

  const damageOffset = dieSizes.findIndex((e) => e === baseDamge);

  if (monster.attacks.length) {
    for (const w of monster.attacks) {
      let ap = 1;
      if (w.damage) {
        ap += points(dieSizes.findIndex((e) => e === w.damage) - damageOffset);
      }

      if (w.condition) {
        ap += 2;
      }

      if (w.ap > 2) {
        ap -= points(w.ap - 2);
      }
      if (w.fatigue > p.fatigue / 2) {
        ap -= points(w.fatigue - p.fatigue / 2);
      } else {
        ap += Math.floor(p.fatigue / 2 - w.fatigue);
      }

      if (w.recharge) {
        if (w.recharge === '1d4') {
          ap /= points(2);
        } else if (w.recharge === '1d6') {
          ap /= points(3);
        } else if (w.recharge === '1d8') {
          ap /= points(4);
        } else if (w.recharge === '1d10') {
          ap /= points(5);
        }

        if (w.thread) {
          ap /= points(2);
        }
      } else if (w.thread) {
        ap /= points(6);
      }

      ap = Math.round(ap);

      p.points += ap;
    }
  }

  if (vmax !== null) {
    const vicious = vmax - damageOffset;

    p.points += points(vicious);
    if (vicious > 0) {
      p.tags.push('vicious');
    } else if (vicious < 0) {
      p.tags.push('timid');
    }
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

  // Armor
  if (monster.armor?.length) {
    const a0 = monster.armor.map((w) => armor.find((f) => f.id === w));
    const a = a0.map((b) => b?.ac || 0).reduce((acc, cur) => acc + cur, 0);
    const t = a0.map((b) => b?.type);

    p.ac += a;
    if (t.includes('light')) {
      p.ac += monster.cunning;
    } else if (t.includes('medium')) {
      p.ac += Math.floor(monster.cunning / 2);
    }
    p.points += points(a + monster.armored);
  } else {
    p.ac += monster.cunning;
  }

  if (monster.armored !== 0) {
    p.ac += monster.armored;
    if (!monster.armor?.length) {
      p.points += points(monster.armored);
    }
  }

  if (monster.armor.length > 0 || monster.armored > 0) {
    p.tags.push('armored');
  } else if (p.ac < monster.cunning) {
    p.tags.push('exposed');
  }

  // HP
  if (monster.hp !== 0) {
    p.hp += monster.hp * baseHP;

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
  if (monster.ancient) {
    p.ap += 1;
    p.points += 4;
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
  if (monster.aquatic) {
    p.points -= 1;
    p.tags.push('aquatic');
  }
  if (monster.pack) {
    p.points += 2;
    p.tags.push('pack tactics');
  }
  if (monster.illumination) {
    p.tags.push('illuminated');
  }
  if (monster.escape) {
    p.points += 2;
    p.tags.push('escape artist');
  }
  if (monster.swarm) {
    p.tags.push('swarm');
  }
  if (monster.jumper) {
    p.points += 1;
    p.tags.push('jumper');
  }
  if (monster.compression) {
    p.points += 1;
    p.tags.push('squishy');
  }
  if (monster.burden) {
    p.points += 1;
    p.tags.push('beast of burden');
  }
  if (monster.aggressive) {
    p.points += 2;
    p.tags.push('aggressive');
  }
  if (monster.grappler) {
    p.points += 3;
    p.tags.push('grappler');
  }

  // Set CR at the end
  if (p.points <= 5) {
    p.cr = 0;
  } else if (p.points < 15) {
    p.cr = 1;
  } else {
    p.cr = Math.round(p.points / 10);
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
