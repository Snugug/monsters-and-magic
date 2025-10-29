import { monsterTypes } from '$lib/shared';

import { calculatePoints as cp } from '$lib/monsters';

import { db } from '$js/db';

const traits = await db.traits.toArray();
const feats = await db.feats.toArray();
const weapons = await db.weapons.toArray();
const armor = await db.armor.toArray();
const techniques = await db.techniques.toArray();
const charms = await db.charms.toArray();

export const types = monsterTypes;

export const calculatePoints = cp(
  traits,
  feats,
  weapons,
  armor,
  techniques,
  charms,
);
