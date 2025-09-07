/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Gem colors from Bizarre Underground Treasure Quest
        'gem': {
          'gold': '#FFD700',      // Main gold/treasure color
          'crystal': '#44D0A7',   // Crystal ball green
          'blue': '#00FFFF',      // Blue gems/cyan
          'purple': '#9932CC',    // Purple chest glow
          'teal': '#008B8B',      // Dark teal
          'pink': '#FF69B4',      // Free life pink
          'cursed': '#580641',    // Dark purple cursed
          'blessed': '#49A79C',   // Blessed teal
        },
        // Keep dark backgrounds
        'dark': {
          'bg': '#000000',        // Pure black background
          'panel': '#0A0A0A',     // Slightly lighter panels
          'card': '#111111',      // Card backgrounds
          'border': '#1A1A1A',    // Subtle borders
        },
        // Accent colors for UI
        'accent': {
          'primary': '#44D0A7',   // Crystal green primary
          'secondary': '#FFD700',  // Gold secondary
          'hover': '#00FFFF',     // Cyan hover states
          'danger': '#FF69B4',    // Pink for warnings
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        // Gem-inspired gradients
        'gem-glow': 'radial-gradient(circle, #44D0A7 0%, transparent 70%)',
        'gold-shimmer': 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
        'crystal-shine': 'linear-gradient(135deg, #44D0A7 0%, #00FFFF 50%, #44D0A7 100%)',
      },
      animation: {
        'sparkle': 'sparkle 2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        sparkle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(68, 208, 167, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(68, 208, 167, 0.8)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        'gem': '0 0 30px rgba(68, 208, 167, 0.3)',
        'gold': '0 0 30px rgba(255, 215, 0, 0.3)',
        'crystal': '0 0 40px rgba(0, 255, 255, 0.2)',
      },
    },
  },
  plugins: [],
}