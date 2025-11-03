/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./{src,components,hooks,services}/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'marquee': 'marquee 30s linear infinite',
        'marquee-slow': 'marquee-slow 45s linear infinite',
        'pulse-bg': 'pulse-bg 1s ease-out',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'marquee-slow': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'pulse-bg': {
          '0%': { backgroundColor: 'rgba(79, 70, 229, 0.2)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
    },
  },
  plugins: [],
};
