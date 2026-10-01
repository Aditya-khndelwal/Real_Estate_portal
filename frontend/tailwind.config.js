/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#102a2a',
        forest: '#157a6e',
        mist: '#f6f8f7',
        line: '#dce7e3'
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        display: ['DM Sans', 'sans-serif']
      },
      boxShadow: {
        soft: '0 16px 50px rgba(16, 42, 42, 0.08)'
      }
    }
  },
  plugins: []
};
