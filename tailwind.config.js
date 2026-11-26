/** @type {import('tailwindcss').Config} */
// Colores institucionales Optima Dual Solutions: azul marino #064467 y verde #7CC142
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef5fa', 100: '#d5e6f1', 200: '#a9cce2', 300: '#74a9cb', 400: '#3f80ad',
          500: '#1a6290', 600: '#064467', 700: '#053a59', 800: '#04304a', 900: '#03253a',
        },
        accent: {
          50: '#f2f9ea', 100: '#e1f2cf', 200: '#c5e5a3', 300: '#a4d673', 400: '#8dcb55',
          500: '#7cc142', 600: '#64a42f', 700: '#4d8024', 800: '#3b621c',
        },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'], marca: ['Nunito', 'Inter', 'sans-serif'] },
      boxShadow: { card: '0 1px 2px rgba(6,68,103,.06), 0 2px 6px rgba(6,68,103,.08)' },
    },
  },
  plugins: [],
}
