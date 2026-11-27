// Syntax themes for Expressive Code, matching the Bedtime palette in src/styles/global.css.

/**
 * @param {string} name
 * @param {'dark' | 'light'} type
 * @param {{ bg: string, fg: string, keyword: string, type: string, string: string, comment: string, number: string }} c
 */
const theme = (name, type, c) => ({
  name,
  type,
  colors: {
    'editor.background': c.bg,
    'editor.foreground': c.fg,
  },
  tokenColors: [
    { settings: { foreground: c.fg } },
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: c.comment, fontStyle: 'italic' },
    },
    {
      scope: ['keyword', 'storage', 'keyword.operator.new', 'keyword.control'],
      settings: { foreground: c.keyword },
    },
    {
      scope: [
        'entity.name.type',
        'entity.name.class',
        'support.type',
        'support.class',
        'entity.other.inherited-class',
        'entity.name.function',
        'support.function',
      ],
      settings: { foreground: c.type },
    },
    {
      scope: ['string', 'string.template', 'markup.inline.raw'],
      settings: { foreground: c.string },
    },
    {
      scope: ['constant.numeric', 'constant.language', 'variable.language'],
      settings: { foreground: c.number },
    },
  ],
});

export const bedtimeNight = theme('bedtime-night', 'dark', {
  bg: '#151a36',
  fg: '#e7e4f2',
  keyword: '#ffd58a',
  type: '#a9c4ff',
  string: '#b5e3c4',
  comment: '#8a89b0',
  number: '#f5b7c8',
});

export const bedtimeDay = theme('bedtime-day', 'light', {
  bg: '#e8e9f4',
  fg: '#22223a',
  keyword: '#9a4d06',
  type: '#2b55a8',
  string: '#2f7a4c',
  comment: '#6e6d8a',
  number: '#a3325a',
});
