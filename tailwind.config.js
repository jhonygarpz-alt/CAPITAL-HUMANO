/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f3f1ff', 100: '#e9e5ff', 200: '#d5cdff', 300: '#b6a6ff', 400: '#9277ff',
          500: '#6f4bff', 600: '#5b2ff5', 700: '#4c21dd', 800: '#3f1cb4', 900: '#351a91',
        },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      boxShadow: { card: '0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06)' },
    },
  },
  plugins: [],
}
