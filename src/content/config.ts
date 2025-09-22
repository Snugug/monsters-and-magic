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
      type: z.enum(['basic', 'advanced', 'rare']),
      ap: z.union([z.number().int().min(1), z.null()]).optional(),
      reaction: z.union([z.string(), z.null()]).optional(),
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

export const collections = {
  standalone,
  chapters,
  glossary,
  techniques,
};
