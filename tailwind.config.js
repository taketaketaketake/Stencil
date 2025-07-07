// tailwind.config.js
const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{astro,html,js,jsx,ts,tsx}',
    './src/layouts/**/*.astro',
    './src/components/**/*.astro'
  ],
  theme: {
    extend: {
      colors: {
        'brand-text': '#1E2A78',
        'brand-bg': '#FDFDFD',
        'brand-magenta': '#FF00FF',
        'brand-orange': '#FFA500',
        'brand-teal': '#00CED1',
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        heading: ['Poppins', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
};
