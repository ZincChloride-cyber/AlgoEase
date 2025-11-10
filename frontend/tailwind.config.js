/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          900: '#050716',
          800: '#080b1f',
          700: '#0d132d',
          600: '#111a3a',
        },
        primary: {
          50: '#f5f4ff',
          100: '#ebe8ff',
          200: '#d4ceff',
          300: '#b0a4ff',
          400: '#8b78ff',
          500: '#6f52ff',
          600: '#5a34ff',
          700: '#4e26e0',
          800: '#411fc0',
          900: '#2d108f',
        },
        secondary: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        accent: {
          50: '#fdfbe6',
          100: '#fcf6c4',
          200: '#f9ed88',
          300: '#f4dd46',
          400: '#f0ca16',
          500: '#d5a704',
          600: '#aa7d02',
          700: '#805a04',
          800: '#644708',
          900: '#523c0b',
        }
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'noise': 'radial-gradient(circle at 10% 20%, rgba(110, 15, 255, 0.25) 0%, rgba(7, 25, 45, 0) 25%), radial-gradient(circle at 90% 0%, rgba(34, 211, 238, 0.25) 0%, rgba(7, 25, 45, 0) 30%)',
        'grid': 'linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 0), linear-gradient(0deg, rgba(255,255,255,0.03) 1px, transparent 0)',
      },
      boxShadow: {
        glow: '0 0 40px rgba(111, 82, 255, 0.35)',
        'inner-glow': 'inset 0 0 40px rgba(111, 82, 255, 0.12)',
      },
      dropShadow: {
        neon: '0 0 12px rgba(111, 82, 255, 0.65)',
      },
      animation: {
        float: 'float 12s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 6s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.6s ease-out both',
        'slide-loop': 'slide 18s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: 0.6 },
          '50%': { opacity: 1 },
        },
        'fade-in-up': {
          '0%': { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        slide: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}
