import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Deep green — positive actions & completed states (Dark 2 / Accent 1)
        brand: {
          50: "#eef4f0",
          100: "#d7e6dc",
          200: "#b0cebb",
          300: "#85b096",
          400: "#5f9476",
          500: "#427a5b",
          600: "#316248",
          700: "#274f3a",
          800: "#1f3f2e",
          900: "#172f22",
        },
        // Mustard / gold-brown — primary accent, CTAs & hyperlink (Accent 2 / Hyperlink)
        mustard: {
          50: "#f8f1e3",
          100: "#efe0c1",
          200: "#e0c88e",
          300: "#cda85c",
          400: "#bd9142",
          500: "#b8863a",
          600: "#966d2f",
          700: "#745426",
        },
        // Warm brown — secondary text & elements
        brown: {
          50: "#f7f2ea",
          100: "#ecdfcc",
          200: "#d4bd9c",
          300: "#b89b74",
          400: "#9c7e58",
          500: "#7f6549",
          600: "#66503a",
          700: "#4f3d2e",
          800: "#3a2c21",
        },
        // Cream / tan — backgrounds & neutral surfaces (Accent 3 / Accent 4)
        cream: {
          50: "#fbf9f4",
          100: "#f3ecdf",
          200: "#ecdec2",
          300: "#dfc7ac",
        },
        // Sage / olive — muted secondary accent & followed hyperlink (Accent 5 / Accent 6)
        sage: {
          50: "#f6f7ef",
          100: "#e9edd7",
          200: "#d3d9b0",
          300: "#bdc794",
          400: "#a6b584",
          500: "#8fa06a",
          600: "#758554",
          700: "#5c6942",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
