export const sizes = [
  'tiny',
  'small',
  'medium',
  'large',
  'huge',
  'gargantuan',
] as const;

export const elements = [
  'fire',
  'cold',
  'force',
  'lightning',
  'poison',
  'acid',
  'radiant',
  'necrotic',
  'physical',
  'fatigue',
] as const;

export const dieSizes = [
  '1',
  '1d2',
  '1d4',
  '1d6',
  '1d8',
  '2d4',
  '1d10',
  '1d12',
  '2d6',
  '3d4',
  '2d8',
  '3d6',
  '2d10',
  '2d12',
  '3d8',
  '4d6',
  '3d10',
  '5d6',
  '4d8',
  '6d6',
  '4d10',
  '7d6',
  '4d12',
] as const;

export const vision = [
  'low-light vision',
  'darkvision',
  'blindsight',
  'tremmorsense',
  'truesight',
] as const;

export const speeds = ['flying', 'climbing', 'swimming', 'burrowing'] as const;

export const swarmImmunities = [
  'frightened',
  'prone',
  'restrained',
  'stunned',
  'paralyzed',
  'charmed',
];

export const monsterTypes = [
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

export const newWeaponBase = {
  name: 'Fist' as string,
  damage: '1d6' as (typeof dieSizes)[number],
  element: 'physical' as (typeof elements)[number],
  range: undefined as number | undefined,
  properties: [] as string[],
  mastery: '' as string,
};

export const newAttackBase = {
  name: '',
  type: 'attack' as
    | 'attack'
    | 'power'
    | 'focus'
    | 'cunning'
    | 'luck'
    | 'reaction'
    | 'other',
  ability: 'power' as 'power' | 'focus' | 'cunning' | 'luck',
  range: undefined as number | undefined,
  damage: '1d6' as (typeof dieSizes)[number] | '',
  element: '' as (typeof elements)[number] | '',
  condition: '',
  ap: 1,
  fatigue: 0,
  trigger: '',
  recharge: '' as '1d4' | '1d6' | '1d8' | '1d10',
  thread: false,
  description: '',
};

export const tags = {
  aggressive: {
    points: 2,
    full: 'Using Strike multiple times per turn costs 1 fewer AP',
    short: 'Using Strike multiple times per turn costs 1 fewer AP',
  },
  amorphous: {
    points: 1,
    full: 'Can move through a space as narrow as 1 inch without expending extra movement',
    short: 'Can easily squeeze through narrow spaces',
  },
  ancient: {
    points: 4,
    full: 'Can use an additional AP each turn thanks to uncountable years of experience',
    short: 'Can use an additional AP each turn',
  },
  amphibious: {
    points: 1,
    full: 'Can breathe air and water',
  },
  aquatic: {
    points: -1,
    full: 'Can only breathe underwater',
  },
  bloodthirsty: {
    points: 3,
    full: 'When bloodied, gain bonus to ability checks and damage rolls equal to CR',
    short: 'Gain a bonus to ability checks and damage when bloodied',
  },
  burden: {
    points: 1,
    full: 'Carrying capacity is doubled',
    tag: 'Beast of Burden',
  },
  draining: {
    points: 3,
    full: 'Once per turn when dealing damage with a melee attack, recover ½ damage or fatigue dealt',
    short: 'Once per turn heal after dealing melee damage',
  },
  escape: {
    points: 2,
    full: 'The AP cost for Disengage and Hide is reduced by 1',
    tag: 'Escape Artist',
  },
  flyby: {
    points: 3,
    full: `Doesn't provoke reactions when leaving an enemy's reach`,
    short: `Doesn't provoke reactions when leaving reach`,
  },
  grappler: {
    points: 3,
    full: 'Halves the fatigue needed to keep a foe restrained (minimum 1)',
    short: 'Halves the fatigue needed to keep a foe restrained',
  },
  illuminated: {
    points: 0,
    full: `Naturally emits bright light in a radius equal to twice is reach and dim light twice its reach again.`,
    short: 'Naturally emits light',
  },
  reach: {
    points: 2,
    full: 'Has double the normal reach',
  },
  jumper: {
    points: 1,
    full: 'Can long jump and high jump twice the normal distance',
  },
  lair: {
    points: 5,
    full: `Has control over its surroundings, letting it take one of the following **Lair Actions** at the start of a round:

Impede
: Spend **1 thread** to make a 30'×30' are of the lair difficult terrain to creatures of its choice.

Rearrange
: Spend **1 thread** to rearrange the physical features of a 30'×30' area (adding or removing walls, lowering or raising the floor, moving creatures along a contiguous surface, etc…) as long as it does not directly cause harm to a creature.`,
    short: 'Can control its surroundings using Lair Actions',
  },
  legendary: {
    points: 10,
    full: `Can use Legendary Actions, Reactions, and Resistances:

Legendary Action
: Can spend **2 threads** to take an additional turn, but cannot go twice in a row

Legendary Reaction
: Can spend **1 thread** to use an additional reaction

Legendary Resistance
: Can spend **1 thread** to ignore the damage and effects of a single attack or saving throw`,
    short: 'Can use Legendary Actions, Reactions, and Resistances',
  },
  pack: {
    points: 2,
    full: `When an ally is within 5' of a creature, attack rolls against that creature gain +2 ongoing. The ally can't be unconscious.`,
    short: 'Gains a bonus to attack rolls when allies nearby',
    tag: 'Pack Tactics',
  },
  unrelenting: {
    points: 3,
    full: 'When fully exhausted, at the start of its next turn, can spend **1 thread** to recover all fatigue and 1 exhaustion.',
    short: 'Can spend a thread to recover from total exhaustion',
  },
  undying: {
    points: 3,
    full: 'When damage would drop it to 0 HP but not outright kill it, can spend **1 thread** to drop to 1 HP instead',
    short: 'Can spend a thread to prevent death',
  },
  bursting: {
    points: 2,
    full: 'Explodes when it dies. All creatures within twice its reach must make a cunning saving throw, taking damage equal to twice the base damage for a creature its size on a miss, half on a hit. If the creature is spicy, the damage is of that type, otherwise its physical.',
    short: 'Explodes when it dies',
  },
  regeneration: {
    points: 5,
    full: "Regains hit points at the start of its turn equal to the base hit number of HP for a creature its size. This can be blocked for a turn by forcing it to mark fatigue or dealing damage to it of a type it's vulnerable to. It can also be blocked if its a Beast, Humanoid, or Monstrosity and fire or acid damage is dealt to it.",
    short: 'Regains hit points at the start of its turn',
  },
  extraplanar: {
    points: 1,
    full: 'If it dies outside of its home plane, its body dissolves. It gains a new body in 1d4 days, reviving with all of its Hit Points somewhere in its home plane. Celestials and Fiends gain a new body instantaneously.',
    short: 'Returns to its home plane when it dies',
  },
  occupier: {
    points: 2,
    full: `Can enter another creature's space and stop there. If the creature is spicy, once per turn it can deal damage to a creature whose space its moved through or stopped in.`,
    short: "Can enter another creature's space and stop there",
  },
  freediver: {
    points: 1,
    full: 'Can hold its breath for up to an hour',
  },
  icewalker: {
    points: 1,
    full: 'Can move across and climb icy surfaces without needing to make an ability check, and ignores icy and snowy difficult terrain',
    short: 'Can move across icy and snowy surfaces easily',
    tag: 'Ice Walker',
  },
  immutable: {
    points: 2,
    full: 'Cannot be shape-shifted',
  },
  incorporeal: {
    points: 1,
    full: 'Can move through other creatures and objects as if they were Difficult Terrain. Takes 1d10 force damage if it ends its turn inside a creature. Requires physical resistance.',
    short: 'Can move through creatures and objects',
  },
  matana: {
    points: 4,
    full: 'Has +2 ongoing to saving throws against spells and other magical effects',
    short: 'Magic is not as effective against it',
    tag: 'Magic Resistance',
  },
  webwalker: {
    points: 1,
    full: 'Ignores movement restrictions caused by webs, and knows the location of any creature in contact with a web its touching',
    short: "Webs don't restrict is movement",
    tag: 'Web Walker',
  },
  climber: {
    points: 1,
    full: 'Can climb difficult surfaces, including along ceilings, without needing to make an ability check',
    short: 'Can climb difficult surfaces with ease',
  },
  tunneler: {
    points: 0,
    full: 'When it burrows through solid material, it leaves a tunnel of its size. Must have a burrowing speed',
    short: 'Leaves a hole when it burrows',
  },
  photophobic: {
    points: -2,
    full: 'While in sunlight, has -2 ongoing to all ability checks',
  },
  siege: {
    points: 1,
    full: 'Deals double damage to objects and structures',
  },
  abduct: {
    points: 1,
    full: `Doesn't need to spend extra movement to move a grappled creature`,
    short: 'Can move a grappled creature at normal speed',
  },
  mastery: {
    points: 1,
    full: 'Can use weapon mastery properties',
    hidden: true,
  },
} as const;

export type allTags = keyof typeof tags;

export type elem = (typeof elements)[number];

// const tagObject = Object.fromEntries(Object.keys(tags).map((t) => [t, false])) as {
//   [k of typeof Object.keys(tags)[number]]: boolean
// };

export const baseMonster = {
  title: '',
  size: 'medium' as (typeof sizes)[number],
  swarm: false as false | (typeof sizes)[number],
  // type: monsterTypes[0],
  type: 'beast' as (typeof monsterTypes)[number],
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
  radiates: '' as elem,
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
  absorbent: [] as Array<elem>,
  conditions: [] as Array<string>,

  // Special
  ...(Object.fromEntries(Object.keys(tags).map((t) => [t, false])) as Record<
    allTags,
    boolean
  >),
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
  baseDamage: '1d6',
  space: 5,
};
