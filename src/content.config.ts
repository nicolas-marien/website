import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/blog' }),
  schema: z.object({
    title: z.string(),
    created_at: z.string().date(),
    published_at: z.string().date(),
    updated_at: z.string().date().optional(),
    draft: z.boolean().default(true),
    tags: z.array(z.string()),
    abstract: z.string(),
  }),
});

export const collections = { blog };
