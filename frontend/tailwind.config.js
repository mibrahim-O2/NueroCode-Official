/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: 'var(--bg-obsidian)',
        charcoal: 'var(--bg-charcoal)',
        elevated: 'var(--bg-elevated)',
        card: 'var(--bg-card)',
        border: 'var(--border-color)',
        divider: 'var(--divider-color)',
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
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          disabled: 'var(--text-disabled)',
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
        card: 'var(--shadow-card)',
        dialog: 'var(--shadow-dialog)',
        dropdown: 'var(--shadow-dropdown)',
        button: 'var(--shadow-button)',
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