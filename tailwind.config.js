/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf6f0",
          100: "#fae9da",
          200: "#f4ceab",
          300: "#e8a971",
          400: "#dc8240",
          500: "#c86521",
          600: "#a54e19",
          700: "#823d18",
          800: "#5f2d13",
          900: "#3d1d0c",
        },
      },
      fontFamily: {
        display: ["Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
