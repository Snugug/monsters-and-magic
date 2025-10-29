import { calculatePoints as cp, type CalculatedMonster } from '$lib/monsters';
import type { Monster } from '$lib/shared';
import { getCollection } from 'astro:content';

const traits = await getCollection('traits');
const feats = await getCollection('feats');
const weapons = await getCollection('weapons');
const armor = await getCollection('armor');
const techniques = await getCollection('techniques');
const charms = await getCollection('charms');

function makeAPI(col: { slug: string; collection: string; data: object }) {
  return {
    id: col.slug,
    collection: col.collection,
    ...col.data,
  };
}

const APIs = {
  traits: traits.map(makeAPI),
  feats: feats.map(makeAPI),
  weapons: weapons.map(makeAPI),
  armor: armor.map(makeAPI),
  techniques: techniques.map(makeAPI),
  charms: charms.map(makeAPI),
};

export const calculateMonsterPoints = cp(
  APIs.traits,
  APIs.feats,
  APIs.weapons,
  APIs.armor,
  APIs.techniques,
  APIs.charms,
);

export function normalizeMonster(monster: Monster) {
  return {
    monster,
    points: calculateMonsterPoints(monster),
  };
}
