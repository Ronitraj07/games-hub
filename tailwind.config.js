/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        // Celebration animations
        'confetti': 'confetti 3s ease-out forwards',
        'celebration-bounce': 'celebrationBounce 0.6s ease-out',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'heartbeat': 'heartbeat 1s ease-in-out infinite',
        'pop-in': 'popIn 0.4s ease-out',
        'score-popup': 'scorePopup 1s ease-out forwards',
        'spin-slow': 'spin 3s linear infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        confetti: {
          '0%': { 
            transform: 'translateY(0) rotate(0deg)',
            opacity: '1'
          },
          '100%': { 
            transform: 'translateY(100vh) rotate(720deg)',
            opacity: '0'
          },
        },
        celebrationBounce: {
          '0%': { 
            transform: 'scale(0) rotate(-180deg)',
            opacity: '0'
          },
          '50%': { 
            transform: 'scale(1.2) rotate(0deg)',
            opacity: '1'
          },
          '100%': { 
            transform: 'scale(1) rotate(0deg)',
            opacity: '1'
          },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.2)' },
          '50%': { transform: 'scale(1)' },
        },
        popIn: {
          '0%': { 
            transform: 'scale(0)',
            opacity: '0'
          },
          '50%': { transform: 'scale(1.1)' },
          '100%': { 
            transform: 'scale(1)',
            opacity: '1'
          },
        },
        scorePopup: {
          '0%': { 
            transform: 'translateY(0) scale(1)',
            opacity: '1'
          },
          '100%': { 
            transform: 'translateY(-100px) scale(1.5)',
            opacity: '0'
          },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        slideInRight: {
          '0%': { 
            transform: 'translateX(100%)',
            opacity: '0'
          },
          '100%': { 
            transform: 'translateX(0)',
            opacity: '1'
          },
        },
        slideInLeft: {
          '0%': { 
            transform: 'translateX(-100%)',
            opacity: '0'
          },
          '100%': { 
            transform: 'translateX(0)',
            opacity: '1'
          },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { 
            transform: 'scale(0)',
            opacity: '0'
          },
          '100%': { 
            transform: 'scale(1)',
            opacity: '1'
          },
        },
      },
    },
  },
  plugins: [],
};