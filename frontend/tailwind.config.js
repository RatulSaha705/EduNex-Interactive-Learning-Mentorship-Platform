/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // tells tailwind to scan all React files
    "./public/index.html",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
