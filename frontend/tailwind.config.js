/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-background)',
        charcoal: 'var(--bg-charcoal)',
        elevated: 'var(--bg-elevated)',
        card: 'var(--bg-card)',
        border: 'var(--border-color)',
        divider: 'var(--divider-color)',
        orange: {
          DEFAULT: '#FF6E1A',
          hover: '#E85A0C',
          active: '#C94A08',
        },
        teal: {
          DEFAULT: '#2DD4A0',
          hover: '#22B589',
          active: '#1B8F6E',
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
        // Deliberately independent of orange/teal — see DESIGN_SYSTEM.md.
        // Reusing the brand's own primary color for warning states would
        // create real ambiguity between "this matters" and "something's
        // wrong." status.info moves from the old emerald value to teal,
        // since emerald no longer exists in the palette.
        status: {
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#2DD4A0',
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
        // Unchanged on purpose — this animation has no color baked into
        // it (only opacity/scale), so its name isn't actually wrong
        // after the palette change. Renaming it would mean a blind,
        // unverified rename across every file that references it, for
        // zero real correctness benefit. See DESIGN_SYSTEM.md note.
        pulseEmerald: {
          '0%, 100%': { opacity: 0.5, transform: 'scale(0.96)' },
          '50%': { opacity: 1, transform: 'scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(4px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        pressScale: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.97)' },
          '100%': { transform: 'scale(1)' },
        },
        slideFadeIn: {
          '0%': { opacity: 0, transform: 'translateY(-8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        celebrate: {
          '0%': { transform: 'scale(0.9)', opacity: 0 },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      },
      animation: {
        'pulse-emerald': 'pulseEmerald 1.6s ease-in-out infinite',
        'fade-in': 'fadeIn 250ms ease-out',
        'press-scale': 'pressScale 220ms ease-out',
        'slide-fade-in': 'slideFadeIn 220ms ease-out',
        'celebrate': 'celebrate 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      spacing: {
        18: '4.5rem',
      },
    },
  },
  plugins: [],
};