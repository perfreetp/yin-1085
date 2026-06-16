/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        cream: '#FFF8F0',
        warm: {
          50: '#FFF8F0',
          100: '#FFEFD8',
          200: '#FFE0B2',
          300: '#FFCC80',
          400: '#E8985E',
          500: '#D4834A',
          600: '#8B6F47',
          700: '#6B5535',
          800: '#4A3A24',
          900: '#2D2315',
        },
        sleep: {
          100: '#E3EDF7',
          200: '#C5D9EF',
          300: '#A0C1E3',
          400: '#6B9BD2',
          500: '#4A7FB8',
          600: '#35649A',
        },
        nap: {
          bg: '#FFF3E0',
          text: '#E65100',
        },
        walk: {
          bg: '#E8F5E9',
          text: '#2E7D32',
        },
        alert: {
          bg: '#FFF3E0',
          border: '#FFB74D',
          text: '#E65100',
        },
        danger: {
          bg: '#FFEBEE',
          border: '#EF9A9A',
          text: '#C62828',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '"思源黑体"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'elder-xl': ['32px', { lineHeight: '1.8' }],
        'elder-lg': ['28px', { lineHeight: '1.8' }],
        'elder-base': ['24px', { lineHeight: '1.8' }],
        'elder-sm': ['20px', { lineHeight: '1.6' }],
        'elder-xs': ['18px', { lineHeight: '1.5' }],
      },
      borderRadius: {
        'elder': '16px',
        'elder-lg': '24px',
      },
      boxShadow: {
        'elder': '0 4px 12px rgba(139, 111, 71, 0.15), 0 2px 4px rgba(139, 111, 71, 0.1)',
        'elder-lg': '0 8px 24px rgba(139, 111, 71, 0.2), 0 4px 8px rgba(139, 111, 71, 0.12)',
        'elder-btn': '0 4px 0 #6B5535, 0 6px 16px rgba(139, 111, 71, 0.25)',
        'elder-btn-active': '0 2px 0 #6B5535, 0 2px 8px rgba(139, 111, 71, 0.2)',
      },
      animation: {
        'breathe-in': 'breatheIn 4s ease-in-out',
        'breathe-hold': 'breatheHold 7s ease-in-out',
        'breathe-out': 'breatheOut 8s ease-in-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        breatheIn: {
          '0%': { transform: 'scale(0.6)', opacity: '0.5' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        breatheHold: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
        },
        breatheOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.6)', opacity: '0.5' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
