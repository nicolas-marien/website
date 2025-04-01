/** @type {import("prettier").Config} */
export default {
  plugins: ['prettier-plugin-astro'],
  overrides: [
    {
      files: '*.astro',
      options: {
        parser: 'astro',
      },
    },
  ],
  arrowParens: 'always',
  bracketSameLine: false,
  objectWrap: 'preserve',
  bracketSpacing: true,
  semi: true,
  experimentalOperatorPosition: 'end',
  experimentalTernaries: false,
  singleQuote: true,
  jsxSingleQuote: false,
  quoteProps: 'as-needed',
  trailingComma: 'all',
  insertPragma: false,
  printWidth: 95,
  tabWidth: 2,
  useTabs: false,
  embeddedLanguageFormatting: 'auto',
};
