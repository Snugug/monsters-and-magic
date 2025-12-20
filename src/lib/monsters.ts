import type { CollectionEntry } from 'astro:content';

interface APIBase {
  id: string;
  collection: string;
}

import { dieSizes, speeds, monsterCalc, tags, type Monster } from '$lib/shared';

export type CalculatedMonster = typeof monsterCalc;

export function calculatePoints(
  traits: APIBase & CollectionEntry<'traits'>['data'],
  feats: APIBase & CollectionEntry<'feats'>['data'],
  weapons: APIBase & CollectionEntry<'weapons'>['data'],
  armor: APIBase & CollectionEntry<'armor'>['data'],
  techniques: APIBase & CollectionEntry<'techniques'>['data'],
  charms: APIBase & CollectionEntry<'charms'>['data'],
) {
  return function calculatePoints(monster: Monster): CalculatedMonster {
    const p = structuredClone(monsterCalc);
    let baseSpeed = 30;
    let baseHP = 5;

    const startingSize = monster.swarm || monster.size;

    // Set starting based on size
    switch (startingSize) {
      case 'tiny':
        baseSpeed = 20;
        baseHP = 3;
        p.points -= 1;
        p.baseDamage = '1d4';
        p.space = 2.5;
        break;
      case 'small':
        baseHP = 4;
        break;
      case 'large':
        p.reach += 5;
        baseSpeed = 40;
        baseHP = 6;
        p.points += 1;
        p.baseDamage = '1d8';
        p.space = 10;
        break;
      case 'huge':
        p.reach += 5;
        baseSpeed = 40;
        baseHP = 7;
        p.points += 2;
        p.baseDamage = '1d10';
        p.space = 15;
        break;
      case 'gargantuan':
        p.reach += 5;
        baseSpeed = 40;
        baseHP = 10;
        p.points += 3;
        p.baseDamage = '1d12';
        p.space = 20;
        break;
    }

    p.hp = baseHP + baseHP * monster.power;

    if (monster.swarm) {
      p.points += 5;
      p.tags.push('Swarm');
    }

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
      p.tags.push('trained');
    }

    // Vision
    if (monster.vision.includes('low-light vision')) {
      p.points += 1;
    }
    if (monster.vision.includes('darkvision')) {
      p.points += 2;
    }
    if (monster.vision.includes('blindsight')) {
      p.points += points(monster.blindsight / 10);
    }
    if (monster.vision.includes('tremmorsense')) {
      p.points += points(monster.tremmorsense / 10);
    }
    if (monster.vision.includes('truesight')) {
      p.points += points(monster.truesight / 10, 2);
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
      p.bonus += monster.strong;
      p.points += points(monster.strong);
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
      p.points += 3;
      p.tags.push('spicy');
    }

    if (monster.radiates) {
      p.points += 4;
      p.tags.push('radiates');
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
    if (monster.naturalWeapons?.length) {
      // Damage Size
      for (const w of monster.naturalWeapons) {
        // console.log(damageStep(w.damage));
        const di = damageStep(w.damage);
        if (vmax === null || di > vmax) {
          vmax = di;
        }
      }
    }

    const damageOffset = damageStep(p.baseDamage);
    // const damageOffset = dieSizes.findIndex((e) => e === p.baseDamage);

    if (monster.attacks?.length) {
      for (const w of monster.attacks) {
        let ap = 1;
        if (w.damage) {
          vmax = damageStep(w.damage);
          ap += points(damageStep(w.damage) - damageOffset);
        }

        if (w.condition) {
          ap += 2;
        }

        if (w.ap > 2) {
          ap -= points(w.ap - 2);
        }
        if (w.ap === 1) {
          ap += 1;
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
            ap /= points(3);
          }
        } else if (w.thread) {
          ap /= points(5);
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
    if (monster.techniques?.length) {
      const s = spend(monster.techniques, techniques);
      p.points += points(s);
      p.tags.push('skilled');
    }

    if (monster.cantrips?.length) {
      p.points += points(monster.cantrips.length);
    }

    if (monster.charms?.length) {
      p.points += points(spend(monster.charms, charms), 2);
    }

    if (monster.cantrips?.length && !monster.charms?.length) {
      p.tags.push('caster');
    } else if (monster.cantrips?.length && monster.charms?.length) {
      p.tags.push('advanced caster');
    }

    // Defense

    // Armor
    if (monster.armor?.length) {
      const a0 = monster.armor.map((w) => armor.find((f) => f.id === w.id));
      const a = a0.map((b) => b?.ac || 0).reduce((acc, cur) => acc + cur, 0);
      const t = a0.map((b) => b?.type);

      p.ac += a;
      if (t.includes('light')) {
        p.ac += monster.cunning;
      } else if (t.includes('medium')) {
        p.ac += Math.floor(monster.cunning / 2);
      }
      p.points += points(a + monster.armored, 2);
    } else {
      p.ac += monster.cunning;
    }

    if (monster.armored !== 0) {
      p.ac += monster.armored;
      if (!monster.armor?.length) {
        p.points += points(monster.armored, 2);
      }
    }

    if (monster.armor?.length > 0 || monster.armored > 0) {
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
      } else {
        p.points += points(monster.resistance.length, 2);
        p.tags.push('resistant');
      }
    }
    if (monster.immunity.length) {
      p.points += points(monster.immunity.length, 5);
      if (!monster.incorporeal) {
        p.tags.push('immune');
      }
    }

    if (monster.conditions.length) {
      p.points += points(monster.conditions.length, 3);
      p.tags.push('resilient');
    }

    if (monster.vulnerable.length) {
      p.points -= points(monster.vulnerable.length);
      p.tags.push('vulnerable');
    }
    if (monster.absorbent.length) {
      p.points += points(monster.absorbent.length, 6);
      p.tags.push('absorbent');
    }

    // Traits
    for (const [key, val] of Object.entries(tags)) {
      if (monster[key]) {
        p.points += val.points;
        p.tags.push(val.tag || key);
      }
    }

    if (monster.ancient) {
      p.ap += 1;
    }

    // Set CR at the end
    p.cr = Math.ceil((p.points - 7) / 10);

    if (p.cr < 0) p.cr = 0;
    // }

    return p;
  };
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
    sum += start;
    // sum += start + i;
    // Calculate the next term (n)
    // const next = a + b;

    // // Add the next term to the running sum
    // sum += next;

    // // Shift the terms for the next iteration:
    // // The old (n-1) term (b) becomes the new (n-2) term (a)
    // // The new term (nextTerm) becomes the new (n-1) term (b)
    // a = b;
    // b = next;
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

const allDieSizes = dieSizes.map(dieTotal);
const reducedDieSizes = [...new Set(allDieSizes)];

export function dieTotal(die: string) {
  const d = die.split('d').map((a) => Number(a));
  if (d.length === 1) return d[0];
  return d[0] * d[1];
}

export function damageStep(die: string) {
  const t = dieTotal(die);
  const ti = reducedDieSizes.findIndex((d) => d === t);
  // const di = dieSizes.findIndex((d) => d === die);
  // console.log(ti);

  // console.log(d);
  // console.log(t);

  return ti;
}
