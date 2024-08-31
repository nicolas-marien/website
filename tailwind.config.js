import { marked } from "marked"

/** @type {import('tailwindcss').Config} */
export default {
  content: {
    files: ["./content/**/*.md", "./quartz/**/*.tsx"],
    transform: {
      md(content) {
        return marked.parse(content)
      },
    },
  },
  theme: {
    extend: {},
  },
  plugins: [],
}
