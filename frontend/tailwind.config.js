/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#0B0D12",
          900: "#0F1219",
          800: "#14171F",
          700: "#1B1F2A",
          600: "#232733",
        },
        ink: {
          100: "#E6E8EE",
          300: "#B4B9C6",
          500: "#8B92A5",
        },
        signal: {
          DEFAULT: "#7C5CFF",
          soft: "#9B85FF",
          dim: "#4C3B99",
        },
        amber: { DEFAULT: "#FFB86B" },
        mint: { DEFAULT: "#4ADE80" },
        coral: { DEFAULT: "#FF6B6B" },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
