import { z, defineCollection, refrence } from 'astro:content';

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

export const collections = {
  standalone,
  chapters,
  glossary,
  techniques,
  lineage,
  activities,
  classes,
  heritage,
};
