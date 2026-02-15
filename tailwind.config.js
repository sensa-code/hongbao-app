/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Noto Serif TC', 'serif'],
      },
      colors: {
        gold: {
          DEFAULT: '#ffd700',
          dark: '#b8860b',
          dim: 'rgba(255,215,0,0.6)',
        },
        red: {
          envelope: '#cc0000',
          bright: '#ff2200',
          dark: '#1a0000',
          deeper: '#330000',
        },
      },
      keyframes: {
        sway: {
          '0%': { transform: 'rotate(-5deg)' },
          '100%': { transform: 'rotate(5deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        popIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        sway: 'sway 3s ease-in-out infinite alternate',
        float: 'float 3s ease-in-out infinite',
        shimmer: 'shimmer 3s linear infinite',
        popIn: 'popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        fadeIn: 'fadeIn 0.5s ease',
      },
    },
  },
  plugins: [],
}
