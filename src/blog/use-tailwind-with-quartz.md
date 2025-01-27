---
draft: false
title: Use Tailwind CSS with Quartz
tags:
  - code
  - obsidian
created_at: 2024-09-14
---

# Context

When creating this website, I did not want to code every single element on the page.
Since I have been using [[Obsidian]] quite a lot lately (journaling, work, etc ...), I wanted to find a solution that integrates nicely with it.
Of course [[Obsidian]] has its own solution for publishing a website based on notes in a vault: [Obsidian publish](https://obsidian.md/publish). However, I did not want to spend the money just yet.
So I stumbled upon [Quartz](https://quartz.jzhao.xyz/) and that appeared to do exactly what I wanted.

I have always been a huge fan of [Tailwind CSS](https://tailwindcss.com/). It has always made CSS easier for me to use.
So now the question is: how do I integrate Tailwind into my website?

# My implementation

According to tailwind documentation, we can use several methods to use it.
The first is to use `tailwind CLI`. But you must specify a CSS entry point for the tool to find the custom `@tailwind` directives.
The other method is to use tailwind as a [postcss](postcss.org) plugin.

Quartz uses [sass](https://sass-lang.com/), and exposes both its internal styles as well as an entry point for us to put our custom styles: `quartz/styles/custom.scss`.

Quartz uses [esbuild](https://esbuild.github.io/) and a sass plugin to generate the CSS (see [the source](https://github.com/jackyzha0/quartz/blob/v4/quartz/cli/handlers.js#L217)).

My solution is to use postcss inside the [`transform`](https://github.com/glromeo/esbuild-sass-plugin/tree/v2.16.1) function provided by [the sass plugin](https://github.com/glromeo/esbuild-sass-plugin/tree/v2.16.1) used by Quartz.

```javascript
      sassPlugin({
        type: "css-text",
        cssImports: true,
        async transform(source) {
          const { plugins } = await postcssLoadConfig()
          const processor = postcss(plugins)
          const { css } = await processor.process(source, { from: undefined })
          return css
        },
      }),

```

I had an issue where postcss would not load the configuration file. So I used the [postcss-load-config](https://github.com/postcss/postcss-load-config) plugin.
My configuration file is the same as the one presented in Tailwind's documentation:

```javascript
/** @type {import('postcss').Config} */
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

The last piece of the puzzle is to instruct Tailwind on how to find its classes.
In my case, I want it to look for my posts inside my `content` directory, and in quartz components.
In the official [documentation](https://tailwindcss.com/docs/content-configuration#transforming-source-files) there is an example of how to feed markdown content using [remark](https://github.com/remarkjs/remark?tab=readme-ov-file#example-turning-markdown-into-html). However, I could not get it to work properly. So I used [marked](https://marked.js.org/) instead.

```javascript
import { marked } from "marked";

/** @type {import('tailwindcss').Config} */
export default {
  content: {
    files: ["./content/**/*.md", "./quartz/**/*.tsx"],
    transform: {
      md(content) {
        return marked.parse(content);
      },
    },
  },
  theme: {
    extend: {},
  },
  plugins: [],
};
```

And thanks to this, I can now use Tailwind with quartz!
