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

export type elem = (typeof elements)[number];

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
