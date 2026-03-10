/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        rose: {
          50:  '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
        lavender: {
          50:  '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '12px',
        lg: '24px',
        xl: '40px',
      },
      animation: {
        'confetti':          'confetti 3s ease-out forwards',
        'celebration-bounce':'celebrationBounce 0.6s ease-out',
        'bounce-subtle':     'bounceSubtle 2s ease-in-out infinite',
        'pulse-slow':        'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'heartbeat':         'heartbeat 1s ease-in-out infinite',
        'pop-in':            'popIn 0.4s ease-out',
        'score-popup':       'scorePopup 1s ease-out forwards',
        'spin-slow':         'spin 3s linear infinite',
        'wiggle':            'wiggle 1s ease-in-out infinite',
        'float':             'float 3s ease-in-out infinite',
        'slide-in-right':    'slideInRight 0.3s ease-out',
        'slide-in-left':     'slideInLeft 0.3s ease-out',
        'fade-in':           'fadeIn 0.5s ease-out',
        'scale-in':          'scaleIn 0.3s ease-out',
        'shimmer':           'shimmer 2s linear infinite',
        'glow-pulse':        'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        confetti: {
          '0%':   { transform: 'translateY(0) rotate(0deg)',      opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
        celebrationBounce: {
          '0%':   { transform: 'scale(0) rotate(-180deg)', opacity: '0' },
          '50%':  { transform: 'scale(1.2) rotate(0deg)',  opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)',    opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '25%':      { transform: 'scale(1.2)' },
          '50%':      { transform: 'scale(1)' },
        },
        popIn: {
          '0%':   { transform: 'scale(0)',   opacity: '0' },
          '50%':  { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
        scorePopup: {
          '0%':   { transform: 'translateY(0) scale(1)',      opacity: '1' },
          '100%': { transform: 'translateY(-100px) scale(1.5)', opacity: '0' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%':      { transform: 'rotate(3deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-20px)' },
        },
        slideInRight: {
          '0%':   { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
        slideInLeft: {
          '0%':   { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)',     opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%':   { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(236,72,153,0.3)' },
          '50%':      { boxShadow: '0 0 28px rgba(236,72,153,0.7)' },
        },
      },
    },
  },
  plugins: [],
};
