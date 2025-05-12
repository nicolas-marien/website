// @ts-check
import { defineConfig } from 'astro/config';
import remarkCallout from '@r4ai/remark-callout';

import mdx from '@astrojs/mdx';

import tailwindcss from '@tailwindcss/vite';

import expressiveCode from 'astro-expressive-code';

export default defineConfig({
  site: 'https://nicolasmarien.dev',
  integrations: [
    expressiveCode({
      themes: ['kanagawa-wave'],
    }),
    mdx(),
  ],

  markdown: {
    remarkPlugins: [remarkCallout],
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
