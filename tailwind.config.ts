import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#161512",
        card: "#262421",
        "card-hover": "#312e2b",
        border: "#3d3a37",
        "accent-green": "#81b64c",
        "accent-green-hover": "#98ce60",
        "accent-gold": "#f7c04a",
        eval: {
          brilliant: "#1baca6",
          great: "#5c8bb0",
          best: "#96bc4b",
          excellent: "#96bc4b",
          good: "#86a666",
          book: "#d5a47d",
          inaccuracy: "#f4bf42",
          mistake: "#e68f2a",
          blunder: "#ca3431",
          miss: "#df6962",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
