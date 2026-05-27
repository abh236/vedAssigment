import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        bricolage: ["var(--font-bricolage)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },
      colors: {
        primary: "#303030",
        secondary: "rgba(94,94,94,0.8)",
        muted: "rgba(94,94,94,0.55)",
        accent: "#FF5623",
        "bg-gradient-start": "#EEEEEE",
        "bg-gradient-end": "#DADADA",
        "off-white": "#F6F6F6",
        "dark-btn": "#181818",
        "dark-grey": "#2B2B2B",
        disabled: "#A9A9A9",
        success: "#4BC26D",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
    },
  },
  plugins: [],
};
export default config;
