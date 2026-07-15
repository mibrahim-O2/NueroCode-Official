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
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        dialog: '0 10px 30px rgba(0,0,0,0.5)',
        dropdown: '0 8px 20px rgba(0,0,0,0.45)',
        button: '0 1px 2px rgba(0,0,0,0.3)',
      },
      keyframes: {
        pulseEmerald: {
          '0%, 100%': { opacity: 0.5, transform: 'scale(0.96)' },
          '50%': { opacity: 1, transform: 'scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(4px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-emerald': 'pulseEmerald 1.6s ease-in-out infinite',
        'fade-in': 'fadeIn 250ms ease-out',
      },
      spacing: {
        18: '4.5rem',
      },
    },
  },
  plugins: [],
};