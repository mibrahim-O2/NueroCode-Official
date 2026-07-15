/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#0B0B0C',
        charcoal: '#17181C',
        elevated: '#21242B',
        card: '#1C1F24',
        border: '#2A2D34',
        divider: '#343843',
        emerald: {
          DEFAULT: '#00A676',
          hover: '#00B67F',
          active: '#008F65',
        },
        mint: {
          DEFAULT: '#00C48C',
          hover: '#00D99B',
        },
        gold: {
          DEFAULT: '#D4AF37',
          hover: '#E6C65C',
          soft: '#F3DE8A',
        },
        text: {
          primary: '#F8FAFC',
          secondary: '#CBD5E1',
          muted: '#94A3B8',
          disabled: '#4B5563',
        },
        status: {
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#00A676',
        },
      },
      fontFamily: {
        heading: ['Sora', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        button: '12px',
        input: '12px',
        card: '16px',
        dialog: '20px',
        badge: '999px',
      },
      spacing: {
        18: '4.5rem',
      },
    },
  },
  plugins: [],
};