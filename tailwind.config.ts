import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:  { DEFAULT: '#0D2137', dark: '#081522', mid: '#0F2D40', light: '#1A3A52' },
        teal:  { DEFAULT: '#00C48C', dark: '#009E71' },
        amber: { DEFAULT: '#F5A623' },
        danger:{ DEFAULT: '#E84545' },
        muted: { DEFAULT: '#6A8FAB' },
        gray:  { DEFAULT: '#8BAABF' },
      },
      fontFamily: {
        sans:    ['Inter', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
}
export default config
