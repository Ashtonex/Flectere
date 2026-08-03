import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#05070A",
          900: "#0B0E14",
          800: "#10141C",
          700: "#171C26",
          600: "#232A38",
          500: "#374153",
        },
        fog: {
          100: "#F5F7FA",
          200: "#E3E7EE",
          300: "#C3CAD6",
          400: "#9AA4B6",
          500: "#7C8598",
        },
        gold: {
          DEFAULT: "#C6A159",
          bright: "#E8D4A0",
          dim: "#8A6B32",
        },
        graphite: {
          DEFAULT: "#9BA1A8",
          bright: "#DADDE1",
          dim: "#3C3F45",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      backgroundImage: {
        "bend-gradient": "linear-gradient(115deg, #3C3F45 0%, #C6A159 45%, #E8D4A0 65%, #3C3F45 100%)",
        "bend-gradient-soft": "linear-gradient(115deg, rgba(198,161,89,0.15) 0%, rgba(60,63,69,0.15) 55%, rgba(198,161,89,0.1) 100%)",
        "radial-fade": "radial-gradient(60% 60% at 50% 40%, rgba(198,161,89,0.14) 0%, rgba(5,7,10,0) 70%)",
        grid: "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "44px 44px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "gradient-pan": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "gradient-pan": "gradient-pan 8s ease infinite",
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        marquee: "marquee 30s linear infinite",
      },
      letterSpacing: {
        widest2: "0.28em",
      },
    },
  },
  plugins: [],
};

export default config;
