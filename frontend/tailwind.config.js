/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        hotel: {
          dark: '#0a0a0f',    // Obsidian Deep Black
          card: '#14141f',    // Luxurious Dark Card
          accent: '#d4af37',  // Champagne Gold (#d4af37)
          success: '#10b981', // Emerald Success
          warning: '#f59e0b', // Amber Warning
          danger: '#e11d48',  // Crimson Danger
        }

      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
