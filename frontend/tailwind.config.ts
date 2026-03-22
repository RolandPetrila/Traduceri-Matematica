import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tema "Tabla verde + creta"
        chalkboard: {
          DEFAULT: "#2d5016",
          dark: "#1a3009",
          light: "#3d6b1e",
          border: "#4a7a2e",
        },
        chalk: {
          white: "#f0ebe3",
          yellow: "#f5d565",
          red: "#e8836b",
          blue: "#7bb8d4",
          green: "#8bc48a",
        },
      },
      fontFamily: {
        chalk: ['"Patrick Hand"', "cursive"],
        math: ['"Cambria Math"', "Cambria", "serif"],
      },
      backgroundImage: {
        "chalkboard-texture": "radial-gradient(ellipse at center, #2d5016 0%, #1a3009 100%)",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
};

export default config;
