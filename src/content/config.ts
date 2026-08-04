import { defineCollection, z } from 'astro:content';

const modules = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    level: z.string(),
    module: z.number(),
    duration: z.number(),
    xp: z.number(),
    prerequisites: z.array(z.string()).default([]),
    quiz: z
      .array(
        z.object({
          question: z.string(),
          options: z.array(z.string()),
          correct: z.number(),
          explanation: z.string(),
        })
      )
      .default([]),
  }),
});

export const collections = { modules };
