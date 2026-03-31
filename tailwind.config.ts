import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0056b3',
        secondary: '#e63946'
      },
      borderRadius: {
        button: '8px'
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        brand: ['Pacifico', 'cursive']
      }
    }
  },
  plugins: []
};

export default config;
