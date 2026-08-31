import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
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
        harvest: {
          50: "#fff8ed",
          100: "#ffefd4",
          400: "#ffb84d",
          500: "#fa9a1f",
          600: "#eb7c15",
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
