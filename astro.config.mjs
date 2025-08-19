// @ts-check
import { fromHtmlIsomorphic } from 'hast-util-from-html-isomorphic'
import { defineConfig } from 'astro/config';
import remarkCallout from '@r4ai/remark-callout';
import { rehypeHeadingIds } from '@astrojs/markdown-remark';
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
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
    rehypePlugins: [rehypeHeadingIds,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'append',
          properties: {
            className: ['heading-anchor'],
          },
          content: fromHtmlIsomorphic(
            '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link-icon lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg><span class="sr-only">Link to heading</span>',
            { fragment: true },
          ).children,
        },
      ],
    ]
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
