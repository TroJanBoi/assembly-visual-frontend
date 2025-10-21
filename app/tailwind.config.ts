/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // ใช้ class .dark
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
      },
      gridTemplateColumns: {
        "16": "repeat(16, minmax(0, 1fr))",
      },
    },
  },
  plugins: [require("@tailwindcss/line-clamp")],
};
