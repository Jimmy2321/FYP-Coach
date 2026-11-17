import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#f0f4fa",
          100: "#dae3f1",
          200: "#b5c6e3",
          300: "#8ca5d1",
          400: "#5f81bb",
          500: "#3d60a3",
          600: "#2d4a85",
          700: "#233968",
          800: "#1b2c51",
          900: "#13203d",
          950: "#0b1529",
        },
        coral: {
          100: "#fff0e8",
          200: "#ffd9c4",
          300: "#ffb58f",
          400: "#ff8f5a",
          500: "#ff6e2f",
          600: "#e55619",
        },
        cream: "#faf8f5",
        mist: "#f3f1ed",
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        body: ["Outfit", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(11, 21, 41, 0.04), 0 8px 24px rgba(11, 21, 41, 0.08)",
        cardHover: "0 2px 4px rgba(11, 21, 41, 0.06), 0 14px 40px rgba(11, 21, 41, 0.12)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.5s ease-out both",
        slideInRight: "slideInRight 0.4s ease-out both",
        pulseDot: "pulseDot 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
