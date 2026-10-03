/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b1220",
        panel: "#132033",
        line: "#24344d",
        emerald: { DEFAULT: "#10b981", dim: "#064e3b" },
        slateblue: "#3d5a80",
        amberx: "#f59e0b",
      },
      fontFamily: {
        sans: ["Segoe UI", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
