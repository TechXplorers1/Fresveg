/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        headings: ['Outfit', 'sans-serif'],
      },
      colors: {
        brand: {
          light: '#f0fdf4',
          DEFAULT: '#10b981',
          dark: '#064e3b',
          accent: '#f59e0b',
        }
      }
    },
  },
  plugins: [],
}
