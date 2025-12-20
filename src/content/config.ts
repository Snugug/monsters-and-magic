import { z, defineCollection, reference } from 'astro:content';
import { boolean } from 'astro:schema';
import {
  sizes as stdSizes,
  elements as stdElements,
  dieSizes as stdDieSizes,
  vision as stdVision,
  speeds as stdSpeeds,
  monsterTypes as stdMonsterTypes,
  tags as stdMonsterTags,
  type allTags,
} from '$lib/shared';

const monsterTypes = z.enum(stdMonsterTypes);
const sizes = z.enum(stdSizes);
const elements = z.enum(stdElements);
const dieSizes = z.enum(stdDieSizes);
const vision = z.enum(stdVision);
const speeds = z.enum(stdSpeeds);
const monsterTags = Object.fromEntries(
  Object.keys(stdMonsterTags).map((t) => [t, z.boolean()]),
) as Record<allTags, z.ZodBoolean>;

const standalone = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
  }),
});

const chapters = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    chapter: z.number(),
  }),
});

const glossary = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    type: z
      .enum([
        'Condition',
        'Status',
        'Weapon Mastery',
        'Armor Mastery',
        'Weapon Property',
        'Armor Property',
        'Damage Type',
      ])
      .array()
      .optional(),
  }),
});

const techniques = defineCollection({
  type: 'content',
  schema: z
    .object({
      title: z.string(),
      type: z.enum(['basic', 'advanced', 'feat']),
      rare: z.boolean(),
      ap: z.union([z.number().int().min(1), z.null()]).optional(),
      reaction: z.union([z.string(), z.null()]).optional(),
      duration: z.union([z.string(), z.null()]).optional(),
    })
    .superRefine((item, ctx) => {
      // Is a reaction but has AP
      const hasReaction = item.reaction !== '' && item.reaction !== null;
      const hasAP = item.ap !== null && !isNaN(item.ap);

      if (hasReaction && hasAP) {
        return ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Cannot be a reaction and require AP',
          path: ['ap'],
        });
      }

      // Must either be a reaction or have AP
      if (!hasReaction && !hasAP) {
        return ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Needs either AP or needs to be a reaction',
          path: ['ap'],
        });
      }
    }),
});

const lineage = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    size: z.array(z.enum(['small', 'medium'])),
  }),
});

const traits = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    points: z.number().step(1).min(1).max(3),
    lineage: reference('lineage'),
  }),
});

const activities = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    taken: z.array(z.enum(['short rest', 'long rest', 'extended rest'])),
  }),
});

const classes = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    proficiencies: z.object({
      weapons: z.string().optional(),
      armor: z.string().optional(),
      techniques: z.number().step(1).min(0),
    }),
    hp: z.number().step(1),
  }),
});

const feats = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    core: z.boolean(),
    spellcasting: z.boolean(),
    rare: z.boolean(),
    class: reference('classes').optional(),
  }),
});

const heritage = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    requirements: z.string().optional(),
  }),
});

const cantrips = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    list: z.array(z.enum(['arcane', 'primal', 'divine', 'psionic'])),
    save: z.enum(['focus', 'power', 'cunning']).optional(),
    type: elements.optional(),
    upcast: z.string(),
  }),
});

const charms = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    ap: z.union([z.number(), z.null()]),
    reaction: z.string().optional(),
    duration: z.string().optional(),
    fatigue: z.union([z.number(), z.null()]),
    tags: z.array(z.enum(['targeting', 'effect', 'metamagic'])),
    concentration: z.boolean(),
    rare: boolean(),
    spells: z.array(reference('cantrips')),
  }),
});

const crafting = z.object({
  textile: z.number(),
  wood: z.number(),
  metal: z.number(),
  stone: z.number(),
  elementalis: z.number(),
  mithril: z.number(),
  fadeite: z.number(),
});

const weapons = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    primary: z.boolean(),
    secondary: z.boolean(),
    damage: z.string(),
    range: z.number(),
    properties: z
      .array(
        z.enum([
          'agile',
          'heavy',
          'precise',
          'reload',
          'two-handed',
          'thrown',
          'versatile',
          'simple',
          'piercing',
          'reach',
        ]),
      )
      .optional(),
    mastery: z.enum(['nick', 'graze', 'ring', 'cleave', 'sap', 'pinpoint']),
    cost: z.number(),
    weight: z.number(),
    crafting,
  }),
});

const foci = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    properties: z.array(
      z.enum(['assail', 'extend', 'span', 'two-handed', 'versatile']),
    ),
    cost: z.number(),
    weight: z.number(),
    crafting,
  }),
});

const armor = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    ac: z.number(),
    type: z.enum(['light', 'medium', 'heavy', 'shield']),
    power: z.number(),
    cost: z.number(),
    weight: z.number(),
    crafting,
  }),
});

const gear = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    tool: z.boolean(),
    instrument: z.boolean(),
    consumable: z.boolean(),
    count: z.number(),
    cost: z.number(),
    weight: z.number(),
    crafting,
  }),
});

const packs = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    cost: z.number(),
    contents: z.array(
      z.object({
        item: reference('gear'),
        count: z.number(),
      }),
    ),
  }),
});

const modifications = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    type: z.enum(['rune', 'seal']),
    rare: z.boolean(),
    weapon: z.string().optional(),
    armor: z.string().optional(),
    focus: z.string().optional(),
    crafting,
  }),
});

const monsterStep = z.number().step(1).min(0);

const monsters = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    size: sizes,
    swarm: sizes.or(z.literal(false)),
    type: monsterTypes,
    image: z.string(),
    focus: z.number(),
    power: z.number(),
    cunning: z.number(),
    luck: z.number(),
    lineage: reference('lineage'),
    traits: z.array(reference('traits')),
    feats: z.array(reference('feats')),
    weapons: z.array(reference('weapons')),
    armor: z.array(reference('armor')),
    vision: z.array(vision),
    blindsight: z.number(),
    tremmorsense: z.number(),
    truesight: z.number(),
    speeds: z.array(speeds),
    walking: z.number(),
    flying: z.number(),
    climbing: z.number(),
    swimming: z.number(),
    burrowing: z.number(),
    savage: z.number(),
    strong: z.number(),
    energetic: z.number(),
    conditioned: z.number(),
    spicy: elements.or(z.literal('')),
    radiates: elements.or(z.literal('')),
    absorbent: z.array(elements),
    naturalWeapons: z
      .array(
        z.object({
          name: z.string(),
          damage: dieSizes,
          element: elements,
        }),
      )
      .min(1),
    attacks: z.array(
      z.object({
        name: z.string(),
        type: z.enum([
          'attack',
          'power',
          'focus',
          'cunning',
          'reaction',
          'other',
        ]),
        damage: dieSizes.or(z.literal('')),
        element: elements.or(z.literal('')),
        condition: reference('conditions').or(z.literal('')),
        ap: z.number().min(2),
        fatigue: z.number().min(0),
        trigger: z.string(),
        recharge: z.enum(['1d4', '1d6', '1d8', '1d10']).or(z.literal('')),
        thread: z.boolean(),
        description: z.string(),
      }),
    ),
    techniques: z.array(reference('techniques')),
    cantrips: z.array(reference('cantrips')),
    charms: z.array(reference('charms')),
    hp: z.number(),
    armored: z.number(),
    resistance: z.array(elements),
    immunity: z.array(elements),
    conditions: z.array(reference('conditions')),
    vulnerable: z.array(elements),

    ...monsterTags,
  }),
});

const conditions = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    status: z.boolean(),
  }),
});

export const collections = {
  standalone,
  chapters,
  glossary,
  techniques,
  lineage,
  traits,
  activities,
  classes,
  feats,
  heritage,
  monsters,
  cantrips,
  charms,
  weapons,
  foci,
  armor,
  gear,
  packs,
  modifications,
  conditions,
};
