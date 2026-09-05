import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f4f7f5",
          100: "#e3ebe5",
          200: "#c4d6c9",
          300: "#9cb9a4",
          400: "#6f957c",
          500: "#4f7a5d",
          600: "#3c6148",
          700: "#324e3c",
          800: "#2b4033",
          900: "#25352c",
          950: "#121e18",
        },
      },
    },
  },
  plugins: [],
};

export default config;
