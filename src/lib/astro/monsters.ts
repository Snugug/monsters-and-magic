import { getCollection } from 'astro:content';
import { calculatePoints as cp } from '$lib/monsters';

const traits = (await getCollection('traits')).map((d) => ({
  id: d.slug,
  collection: d.collection,
  ...d.data,
}));
const feats = (await getCollection('feats')).map((d) => ({
  id: d.slug,
  collection: d.collection,
  ...d.data,
}));
const weapons = (await getCollection('weapons')).map((d) => ({
  id: d.slug,
  collection: d.collection,
  ...d.data,
}));
const armor = (await getCollection('armor')).map((d) => ({
  id: d.slug,
  collection: d.collection,
  ...d.data,
}));
const techniques = (await getCollection('techniques')).map((d) => ({
  id: d.slug,
  collection: d.collection,
  ...d.data,
}));
const charms = (await getCollection('charms')).map((d) => ({
  id: d.slug,
  collection: d.collection,
  ...d.data,
}));

export const calculatePoints = cp(
  traits,
  feats,
  weapons,
  armor,
  techniques,
  charms,
);
