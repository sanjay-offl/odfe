/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FBF6EE',
        foam: '#FFFFFF',
        espresso: '#2B1B14',
        roast: '#4A2E22',
        ink: '#2B1B14',
        muted: '#8E7E72',
        faint: '#A99A8E',
        line: '#EEE3D9',
        sand: '#F2E9DF',
        caramel: { DEFAULT: '#C47F3B', dark: '#A9662A', light: '#E8B04B' },
        sage: { DEFAULT: '#6B8F71', soft: '#E8F2E8' },
        brick: { DEFAULT: '#B4452F', soft: '#FBEBE7' },
        honey: '#E8B04B',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'Segoe UI', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      borderRadius: { xl: '14px', '2xl': '18px', '3xl': '24px' },
      boxShadow: {
        card: '0 7px 25px rgba(58,31,10,0.05)',
        lift: '0 14px 32px rgba(58,31,10,0.14)',
        pop: '0 22px 70px rgba(43,27,20,0.25)',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.55' } },
      },
      animation: {
        'fade-in': 'fadeIn .2s ease-out',
        'slide-up': 'slideUp .25s cubic-bezier(.2,.8,.2,1)',
        shimmer: 'shimmer 1.4s infinite',
        'pulse-soft': 'pulseSoft 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
