/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050505", // The deep, premium black
        accent: "#3b82f6",     // Sharp tech blue for active states
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
};