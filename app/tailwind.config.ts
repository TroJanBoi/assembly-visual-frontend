/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // ใช้ class .dark
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-poppins)', 'Poppins', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      gridTemplateColumns: {
        "16": "repeat(16, minmax(0, 1fr))",
      },
    },
  },
  plugins: [require("@tailwindcss/line-clamp")],
};
