import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Crypto Sharks brand palette
        navy: {
          DEFAULT: "#102635",
          50: "#E6EBEF",
          100: "#C2CCD4",
          200: "#9AAAB6",
          300: "#6E8493",
          400: "#456177",
          500: "#1F3E55",
          600: "#102635",
          700: "#0C1E2A",
          800: "#091721",
          900: "#060F16",
        },
        teal: {
          DEFAULT: "#2F7C7E",
          50: "#E7F4F4",
          100: "#C7E3E4",
          200: "#9CCDCE",
          300: "#6FB6B7",
          400: "#499FA1",
          500: "#2F7C7E",
          600: "#266567",
          700: "#1D4E50",
          800: "#143739",
          900: "#0B2122",
        },
        cyan: {
          DEFAULT: "#39D7E8",
          50: "#E8FAFC",
          100: "#C7F4F8",
          200: "#9AEBF1",
          300: "#6DE1EA",
          400: "#39D7E8",
          500: "#1FBCCD",
          600: "#178FA0",
          700: "#106473",
          800: "#0A3F49",
          900: "#051F24",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        slogan: ["var(--font-slogan)", "var(--font-display)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "radial-glow":
          "radial-gradient(ellipse at top, rgba(57, 215, 232, 0.18), transparent 60%)",
        "shark-grid":
          "linear-gradient(rgba(57,215,232,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(57,215,232,0.06) 1px, transparent 1px)",
      },
      boxShadow: {
        glow: "0 0 24px rgba(57, 215, 232, 0.35)",
        "glow-lg": "0 0 48px rgba(57, 215, 232, 0.45)",
        "inset-glow": "inset 0 0 24px rgba(57, 215, 232, 0.15)",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 16px rgba(57, 215, 232, 0.25)" },
          "50%": { boxShadow: "0 0 32px rgba(57, 215, 232, 0.55)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "float-slow": "float-slow 6s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
