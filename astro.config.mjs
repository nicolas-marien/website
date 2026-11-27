// @ts-check
import { fromHtmlIsomorphic } from 'hast-util-from-html-isomorphic';
import { defineConfig } from 'astro/config';
import remarkCallout from '@r4ai/remark-callout';
import { rehypeHeadingIds } from '@astrojs/markdown-remark';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import mdx from '@astrojs/mdx';

import tailwindcss from '@tailwindcss/vite';

import expressiveCode from 'astro-expressive-code';
import { bedtimeDay, bedtimeNight } from './code-themes.mjs';

/** The post title is the page's h1, so Markdown `#` becomes h2, `##` becomes h3, and so on. */
const rehypeShiftHeadings = () => (tree) => {
  const visit = (node) => {
    if (node.type === 'element' && /^h[1-6]$/.test(node.tagName)) {
      node.tagName = `h${Math.min(6, Number(node.tagName[1]) + 1)}`;
    }
    node.children?.forEach(visit);
  };
  visit(tree);
};

/**
 * Code blocks can scroll sideways, so keyboard users must be able to focus them.
 * Expressive Code's script also toggles this at runtime, but only once the browser is idle
 * and only with JavaScript on; setting it in the HTML covers both gaps.
 */
const focusableCodeBlocks = () => ({
  name: 'focusable-code-blocks',
  hooks: {
    postprocessRenderedBlock: ({ renderData }) => {
      const visit = (node) => {
        if (node.type === 'element' && node.tagName === 'pre') {
          node.properties = { ...node.properties, tabIndex: 0 };
        }
        node.children?.forEach(visit);
      };
      visit(renderData.blockAst);
    },
  },
});

export default defineConfig({
  site: 'https://nicolasmarien.dev',
  integrations: [
    expressiveCode({
      themes: [bedtimeNight, bedtimeDay],
      useDarkModeMediaQuery: false,
      plugins: [focusableCodeBlocks()],
      themeCssSelector: (theme) =>
        `[data-theme='${theme.name === 'bedtime-day' ? 'day' : 'night'}']`,
      styleOverrides: {
        codeFontFamily: "'iA Writer Mono', monospace",
        uiFontFamily: "'Literata', serif",
        codeFontSize: '0.8rem',
        codeLineHeight: '1.65',
        borderRadius: '8px',
        borderColor: 'transparent',
        frames: {
          frameBoxShadowCssValue: 'none',
          editorTabBarBackground: 'var(--code)',
          editorTabBarBorderBottomColor: 'transparent',
          editorActiveTabBackground: 'var(--code)',
          editorActiveTabForeground: 'var(--dim)',
          editorActiveTabIndicatorTopColor: 'transparent',
          editorActiveTabIndicatorBottomColor: 'transparent',
          terminalTitlebarBackground: 'var(--code)',
          terminalTitlebarBorderBottomColor: 'transparent',
        },
      },
    }),
    mdx(),
  ],

  markdown: {
    remarkPlugins: [remarkCallout],
    rehypePlugins: [
      rehypeShiftHeadings,
      rehypeHeadingIds,
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
    ],
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
