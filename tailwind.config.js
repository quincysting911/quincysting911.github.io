/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/layouts/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        aws: {
          orange: '#FF9900',
          navy: '#232F3E',
          squid: '#161E2D',
          lightgray: '#F2F3F3',
        },
      },
    },
  },
  plugins: [],
};