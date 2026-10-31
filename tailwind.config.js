/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bright: {
          bg: '#251A32',
          deep: '#1e1428',
          sidebar: '#30203F',
          sidebarHover: '#3c2850',
          card: '#29232F',
          cardSec: '#34243E',
          cardHover: '#3d2b4b',
          violet: '#8524E5',
          violetHover: '#7022B9',
          yellow: '#F2C400',
          yellowHover: '#dbae00',
          textMuted: '#C5B9D0',
          border: 'rgba(255, 255, 255, 0.08)',
          borderLight: 'rgba(255, 255, 255, 0.15)',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Poppins', 'sans-serif'],
      },
      backgroundImage: {
        'purple-radial': 'radial-gradient(ellipse at top left, #452168 0%, #2e1844 50%, #1c1328 100%)',
        'purple-card': 'linear-gradient(135deg, rgba(45, 33, 56, 0.9) 0%, rgba(35, 26, 45, 0.8) 100%)',
      }
    },
  },
  plugins: [],
}

