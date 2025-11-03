/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Islamic/Religious colors
        'islamic-green': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        'islamic-gold': {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Prayer times specific colors
        'imsak': {
          DEFAULT: 'rgb(147, 51, 234)', // Purple
        },
        'subuh': {
          DEFAULT: 'rgb(59, 130, 246)', // Blue
        },
        'dzuhur': {
          DEFAULT: 'rgb(245, 158, 11)', // Amber
        },
        'ashar': {
          DEFAULT: 'rgb(249, 115, 22)', // Orange
        },
        'maghrib': {
          DEFAULT: 'rgb(239, 68, 68)', // Red
        },
        'isya': {
          DEFAULT: 'rgb(99, 102, 241)', // Indigo
        },
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
      backdropFilter: {
        'none': 'none',
        'blur': 'blur(20px)',
      },
    },
  },
  plugins: [],
}