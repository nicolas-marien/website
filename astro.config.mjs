// @ts-check
import { defineConfig } from "astro/config";
import remarkCallout from "@r4ai/remark-callout";

import mdx from "@astrojs/mdx";

import tailwind from "@astrojs/tailwind";

export default defineConfig({
  integrations: [mdx(), tailwind()],
  markdown: {
    remarkPlugins: [remarkCallout],
  },
});
