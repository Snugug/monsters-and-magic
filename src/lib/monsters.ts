import { sizes, elements, dieSizes } from '$lib/shared';
import { db } from '$lib/db';

const traits = await db.traits.toArray();
const feats = await db.feats.toArray();
const weapons = await db.weapons.toArray();
const armor = await db.armor.toArray();

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

export interface Monster {
  // Core
  title: string;
  size: (typeof sizes)[number];
  type: (typeof types)[number];
  body: string;
  // Abilities
  focus: number;
  power: number;
  cunning: number;
  luck: number;
  // Humanoids get Lineage, Traits, and Class
  lineage?: string;
  traits?: Array<string>;
  feats?: Array<string>;
  // Humanoid, Celestial, Fiend, Undead, Fey, and Construct get equipment
  weapons?: Array<string>;
  armor?: Array<string>;

  // Offense
  vicious: number;
  savage: number;
  strong: number;
  energetic: number;
  conditioned: number;
  grappler: number;
  elemental?: (typeof elements)[number];
  spicy?: (typeof elements)[number];

  // Defense
  armored: number;
}

export interface CalculatedMonster {
  hp: number;
  fatigue: number;
  exhaustion: number;
  ac: number;
  damage: (typeof dieSizes)[number];
  tags: Array<string>;
  points: number;
  speed: number;
  cr: number;
  bonus: number;
  piercing: number;
  reach: number;
}

export function calculatePoints(monster: Monster): CalculatedMonster {
  const p = {
    hp: 5,
    fatigue: 2,
    exhaustion: 1,
    ac: 0,
    damage: '1d6',
    tags: [],
    points: 0,
    speed: 30,
    cr: 0,
    bonus: 0,
    piercing: 0,
    reach: 5,
  } as CalculatedMonster;

  // Set starting based on size
  switch (monster.size) {
    case 'tiny':
      p.points -= 2;
      p.speed = 15;
      p.bonus -= 2;
      break;
    case 'large':
      p.hp += 5;
      p.points += 2;
      p.reach += 5;
      p.speed = 35;
      p.bonus += 1;
      break;
    case 'huge':
      p.hp += 10;
      p.points += 3;
      p.reach += 5;
      p.speed = 40;
      p.bonus += 3;
      break;
    case 'gargantuan':
      p.hp += 15;
      p.points += 5;
      p.reach += 5;
      p.speed = 40;
      p.bonus += 3;
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
    const spend = monster.feats
      .map((f) => {
        const feat = feats.find((a) => a.id === f);
        if (feat?.rare) {
          return 2;
        }
        return 1;
      })
      .reduce((acc, cur) => acc + cur, 0);
    p.points += points(spend, 3);
  }

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

  if (p.ac > 0) {
    p.tags.push('heavily armored');
  } else if (p.ac < 0) {
    p.tags.push('lightly armored');
  }

  // Set CR at the end
  if (p.points < 10) {
    p.cr = 0;
  } else if (p.points < 15) {
    p.cr = 1;
  } else if (p.points < 20) {
    p.cr = 2;
  } else if (p.points < 30) {
    p.cr = 3;
  } else {
    p.cr = 4;
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
