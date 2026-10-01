export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cream: "#F4F0E4",
        parchment: "#FFF9F0",
        sage: { 100: "#E4EEDD", 300: "#B7C9A8", 500: "#7A9A6A", 700: "#4F6B40" },
        terra: { 400: "#D08A5A", 500: "#C4845A", 700: "#8B5A38" },
        wood: "#C9A27A",
        ink: "#3D4A38",
      },
      fontFamily: {
        display: ["Cormorant Garamond", "Georgia", "serif"],
        body: ["Nunito", "Segoe UI", "sans-serif"],
      },
      borderRadius: { card: "1.4rem", pill: "999px" },
      boxShadow: { soft: "0 10px 30px rgba(79, 107, 64, 0.08)" },
    },
  },
  plugins: [],
};
