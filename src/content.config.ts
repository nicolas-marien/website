import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/blog" }),
  schema: z.object({
    title: z.string(),
    created_at: z.date(),
    updated_at: z.date().optional(),
    draft: z.boolean().default(true),
  }),
});

export const collections = { blog };
