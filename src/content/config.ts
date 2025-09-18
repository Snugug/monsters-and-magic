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

export const collections = {
  standalone,
  chapters,
  glossary,
};
