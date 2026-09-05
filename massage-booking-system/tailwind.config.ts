import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Warm terracotta-to-espresso ramp, drawn from the shop's brick
        // facade, wood battens, and dark interior — not a generic
        // "wellness app" teal/green.
        brand: {
          50: "#faf6ef",
          100: "#f2e9da",
          200: "#e6d3b6",
          300: "#d5b88c",
          400: "#c09761",
          500: "#a97645",
          600: "#8b5a34",
          700: "#6e4527",
          800: "#52321c",
          900: "#3a2314",
          950: "#26160c",
        },
        // Used sparingly for a single deliberate cool accent (the
        // wordmark, a focus ring) — echoes the grey signage panel against
        // the warm brick, the one intentional non-warm note.
        slate: {
          500: "#75767a",
          600: "#5c5d61",
          700: "#46474a",
        },
        // Warm brass/gold, for glows and quiet highlights only.
        gold: {
          400: "#d3a24f",
          500: "#bb8636",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif TC"', "serif"],
        sans: ['"Noto Sans TC"', "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
