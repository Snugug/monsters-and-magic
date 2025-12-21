import { getCollection } from 'astro:content';

const ignore = ['hold', 'focus', 'cunning', 'power', 'luck'];

const glossary = (await getCollection('glossary'))
  .filter((a) => !ignore.includes(a.slug))
  .reduce((acc, cur) => {
    acc[cur.data.title.toLowerCase()] = `glossary/${cur.slug}`;
    return acc;
  }, {});
const techniques = (await getCollection('techniques'))
  .filter((t) => t.data.basic || t.data.mastery)
  .reduce((acc, cur) => {
    acc[cur.data.title.toLowerCase()] = `techniques/${cur.slug}`;
    return acc;
  }, {});
const activities = (await getCollection('activities')).reduce((acc, cur) => {
  acc[cur.data.title.toLowerCase()] = `activities/${cur.slug}`;
  return acc;
}, {});

const collections = { ...glossary, ...techniques, ...activities };

export const lookup = Object.assign(collections, {
  thread: 'glossary/threads-of-fate',
  threads: 'glossary/threads-of-fate',
  'fly speed': 'glossary/speed',
  'climb speed': 'glossary/speed',
  'swim speed': 'glossary/speed',
  'burrow speed': 'glossary/speed',
  // str: 'glossary/strength',
  // dex: 'glossary/dexterity',
  // con: 'glossary/constitution',
  // int: 'glossary/intelligence',
  // wis: 'glossary/wisdom',
  // cha: 'glossary/charisma',
  // // creature: 'glossary/character',
  // 'beat the odds': 'moves/beat-the-odds',
  // 'saving throw': 'moves/saving-throw',
  // 'critical hit': 'glossary/critical',
  // 'critical miss': 'glossary/critical',
  // 'action point': 'glossary/action-points',
  // approaches: 'glossary/approach',
  // combat: 'glossary/encounter',
  // round: 'glossary/combat-round',
  // rounds: 'glossary/combat-round',
  // 'dice goblin mode': 'glossary/gameplay-modes',
  // 'story mode': 'glossary/gameplay-modes',
  // dgm: 'glossary/gameplay-modes',
  // sm: 'glossary/gameplay-modes',
  // ac: 'glossary/ac',
});

export const shortLookup = {
  power: 'glossary/power',
  focus: 'glossary/focus',
  cunning: 'glossary/cunning',
  luck: 'glossary/luck',
  bond: 'glossary/bond',
  // str: 'glossary/strength',
  // dex: 'glossary/dexterity',
  // con: 'glossary/constitution',
  // wis: 'glossary/wisdom',
  // int: 'glossary/intelligence',
  // cha: 'glossary/charisma',

  // class: 'glossary/class-ability',
  dc: 'glossary/difficulty-class',
  pb: 'glossary/proficiency-bonus',
  spell: 'glossary/spell-ability',
};

export const modified = {
  ongoing: 'glossary/ongoing',
  forward: 'glossary/forward',
  fatigue: 'glossary/fatigue',
  exhaustion: 'glossary/exhaustion',
  piercing: 'properties/piercing',
  ac: 'glossary/armor-class',
  ap: 'glossary/action-points',
  hp: 'glossary/hit-points',
  thread: 'glossary/threads-of-fate',
  threads: 'glossary/threads-of-fate',
  weight: 'glossary/weight',
  // round: 'glossary/combat-round',
  // rounds: 'glossary/combat-round',
};

export const sized = {
  power: 'glossary/power',
  focus: 'glossary/focus',
  cunning: 'glossary/cunning',
  luck: 'glossary/luck',
};

export const typed = {
  hold: 'glossary/hold',
};

export const replacementRegExp = new RegExp(
  `(((\\+|-|\\dd)?\\d+(\\s|-))(${Object.keys(modified).join('|')}))\\b` +
    '|' +
    `\\b(${Object.keys(sized).join('|')})\\s\\d\\b` +
    `|` +
    `\\b(${Object.keys(typed).join('|')})\\s(\\d+|(\\+?\\w+))-\\w+\\b` +
    '|' +
    `\\b(${Object.keys(lookup).join('|')})\\b` +
    '|' +
    `(\\+(${Object.keys(shortLookup).join('|')}))\\b`,
  'gmi',
);
