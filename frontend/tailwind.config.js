/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        krishi: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          amber: '#d97706',
          soil: '#78350f',
          earth: '#92400e',
        }
      },
      fontSize: {
        'farmer-base': '1.125rem', // 18px body font for comfortable reading
        'farmer-lg': '1.25rem',    // 20px
        'farmer-xl': '1.5rem',     // 24px
        'farmer-2xl': '1.875rem',  // 30px
        'farmer-3xl': '2.25rem',   // 36px
      }
    },
  },
  plugins: [],
}
