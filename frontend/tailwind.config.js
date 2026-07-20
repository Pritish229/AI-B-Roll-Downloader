/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        editor: {
          bg: '#0F0F12',        // Deep obsidian background
          panel: '#16161D',     // DaVinci / Premiere-style side panel
          surface: '#1E1E26',   // High-contrast slate card surface
          border: '#2A2A38',    // Sleek border divider
          accent: '#7C3AED',    // Glowing Violet primary
          accentHover: '#6D28D9',
          success: '#10B981',   // Emerald emerald
          warning: '#F59E0B',   // Warm amber
          info: '#3B82F6',      // Cyan blue
          text: '#F3F4F6'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(124, 58, 237, 0.15)',
        'glow-accent': '0 0 25px rgba(124, 58, 237, 0.4)',
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(15px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        }
      }
    },
  },
  plugins: [],
}
