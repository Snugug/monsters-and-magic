import { z, defineCollection, refrence } from 'astro:content';

const standalone = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
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
  glossary,
};
