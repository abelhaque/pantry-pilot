/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: '#1A2119',
        forest: '#2C3A2B',
        sage: '#8DAA81',
      },
    },
  },
  plugins: [],
}
