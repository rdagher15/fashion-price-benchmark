import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Green — positive actions & completed states
        brand: {
          50: "#f2f9ee",
          100: "#e2f1d8",
          200: "#c6e3b3",
          300: "#a1d183",
          400: "#7dbb5a",
          500: "#5a9c3a",
          600: "#437c2c",
          700: "#356225",
          800: "#2d4f21",
          900: "#27431f",
        },
        // Mustard / dark yellow — primary accent & CTAs
        mustard: {
          50: "#fdf8ec",
          100: "#faedc7",
          200: "#f4da8f",
          300: "#eec257",
          400: "#e5a930",
          500: "#d38f1f",
          600: "#b5721a",
          700: "#92591b",
        },
        // Warm brown — secondary text & elements
        brown: {
          50: "#f8f4ee",
          100: "#ede2d1",
          200: "#d9c2a3",
          300: "#bd9c76",
          400: "#a17f58",
          500: "#846747",
          600: "#6b533a",
          700: "#54412e",
          800: "#3f3123",
        },
        // Cream / beige — backgrounds & neutral surfaces
        cream: {
          50: "#fdfbf7",
          100: "#f9f4ea",
          200: "#f2e9d8",
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
