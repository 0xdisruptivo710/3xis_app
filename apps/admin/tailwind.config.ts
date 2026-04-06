import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#FF6B00',
          secondary: '#1A1A2E',
          accent: '#FFD700',
          surface: '#F8F8F8',
          'on-surface': '#212121',
          success: '#00C853',
          warning: '#FFB300',
          error: '#D50000',
          muted: '#9E9E9E',
        },
      },
      fontFamily: {
        display: ['Montserrat', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      screens: {
        xs: '480px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
    },
  },
  plugins: [],
};

export default config;
