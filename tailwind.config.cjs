/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ejs,ts,js}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Fraunces", "sans-serif"],
        body: ["Fraunces", "sans-serif"],
      },
      colors: {
        "brand-primary": "#FE8009",
        "brand-primary-2": "#FD9272",
        "brand-secondary": "#8B1763",
        "brand-secondary-2": "#B25D99",
        "brand-secondary-3": "#F2F2F8",
        "secondary-2": "var(--color-secondary-2)",
        "secondary-3": "var(--color-secondary-3)",
        "pricing-single-bg": "var(--pricing-single-bg)",
      },
    },
  },
  darkMode: ["selector", "class"],
  plugins: [],
};
