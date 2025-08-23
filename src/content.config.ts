import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/posts' }),
  schema: ({image}) => z.object({
    title: z.string(),
    created_at: z.string().date(),
    published_at: z.string().date().optional().nullable(),
    updated_at: z.string().date().optional(),
    draft: z.boolean().default(true),
    tags: z.array(z.string()),
    abstract: z.string(),
    coverImage: z.strictObject({
      url: image(),
      alt: z.string()
    }).optional()
  }),
});

export const collections = { blog };
