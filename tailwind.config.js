/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/renderer/index.html',
    './src/renderer/src/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: {
          bg: '#08070D',
          surface: '#120F1D',
          card: '#161324',
          hover: '#1F1B33',
          border: '#2A2344',
          active: '#392F5C'
        },
        purple: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',
          700: '#7E22CE',
          800: '#6B21A8',
          900: '#581C87',
          950: '#3B0764',
          neon: '#8B5CF6',
          glow: '#A855F7'
        }
      },
      boxShadow: {
        'neon-purple': '0 0 20px -3px rgba(168, 85, 247, 0.4), 0 0 8px -2px rgba(139, 92, 246, 0.6)',
        'neon-glow': '0 0 35px -5px rgba(139, 92, 246, 0.5)'
      }
    }
  },
  plugins: []
}
