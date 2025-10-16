import { z, defineCollection, reference } from 'astro:content';
import { boolean } from 'astro:schema';

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
      type: z.enum(['basic', 'advanced', 'rare', 'feat']),
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
    traits: z.array(
      z.object({
        title: z.string(),
        points: z.number().step(1).min(1).max(3),
        description: z.string(),
      }),
    ),
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
    feats: z.array(
      z.object({
        title: z.string(),
        core: z.boolean(),
        spellcasting: z.boolean(),
        rare: z.boolean(),
        description: z.string(),
      }),
    ),
  }),
});

const heritage = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    requirements: z.string().optional(),
  }),
});

const monsterStep = z.number().step(1).min(0);
const elements = z.enum([
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
]);

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
    crafting: z.object({
      wood: z.number(),
      cloth: z.number(),
      hide: z.number(),
      metal: z.number(),
    }),
  }),
});

const foci = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    properties: z.array(
      z.enum(['assail', 'extend', 'empower', 'two-handed', 'versatile']),
    ),
    cost: z.number(),
    weight: z.number(),
    crafting: z.object({
      wood: z.number(),
      cloth: z.number(),
      hide: z.number(),
      metal: z.number(),
    }),
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
    crafting: z.object({
      wood: z.number(),
      cloth: z.number(),
      hide: z.number(),
      metal: z.number(),
    }),
  }),
});

const gear = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    tool: z.boolean(),
    instrument: z.boolean(),
    potion: z.boolean(),
    count: z.number(),
    cost: z.number(),
    weight: z.number(),
    crafting: z.object({
      wood: z.number(),
      cloth: z.number(),
      hide: z.number(),
      metal: z.number(),
    }),
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
    crafting: z.object({
      wood: z.number(),
      cloth: z.number(),
      hide: z.number(),
      metal: z.number(),
      elemental: z.number(),
      mithril: z.number(),
      fade: z.number(),
    }),
  }),
});

const monster = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    size: z.enum(['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan']),
    offense: z.object({
      vicious: monsterStep,
      timid: monsterStep,
      specialized: monsterStep,
      savage: monsterStep,
      strong: monsterStep,
      weak: monsterStep,
      energetic: monsterStep,
      conditioned: monsterStep,
      skilled: monsterStep,
      caster: monsterStep,
      charming: monsterStep,
      upcast: monsterStep,
      grappler: monsterStep,
      elemental: elements.optional(),
      spicy: elements.optional(),
    }),
    defense: z.object({
      stout: monsterStep,
      frail: monsterStep,
      'heavily armored': monsterStep,
      'lightly armored': monsterStep,
      resistant: z.array(elements).optional(),
      tough: z.boolean(),
      immune: z.array(elements).optional(),
      vulnerable: z.array(elements).optional(),
    }),
    movement: z.object({
      speed: z.object({
        // Averages
        // 1+ for each speed above 30
        // 1- for each speed below 30
        walking: monsterStep.optional(),
        flying: monsterStep.optional(), // 3 points
        climbing: monsterStep.optional(), // 1 point
        swimming: monsterStep.optional(), // 1 point
        burrowing: monsterStep.optional(), // 2 points
      }),
      amphibious: z.boolean(),
      flyby: z.boolean(),
    }),
    vision: z.object({
      'low-light': z.boolean(),
      darkvision: z.boolean(),
      blindsight: monsterStep,
      tremorsense: monsterStep,
      truesight: monsterStep,
    }),
    special: z.object({
      ancient: monsterStep,
      legendary: z.boolean(),
      lair: z.boolean(),
      bloodthirsty: monsterStep,
      draining: z.boolean(),
      unrelenting: z.boolean(),
      undying: z.boolean(),
    }),
  }),
});

export const collections = {
  standalone,
  chapters,
  glossary,
  techniques,
  lineage,
  activities,
  classes,
  heritage,
  monster,
  cantrips,
  charms,
  weapons,
  foci,
  armor,
  gear,
  packs,
  modifications,
};
