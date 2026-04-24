import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        moss: {
          DEFAULT: "#1A9E74",
          dark: "#0E6E51",
          deep: "#072E21",
          deeper: "#041C14",
          light: "#E0F4ED",
          mid: "#56C99E",
        },
        ink: {
          DEFAULT: "#0C1A15",
          2: "#2E4A3E",
          3: "#5E7A6E",
          4: "#9BB5AA",
          5: "#C8DDD7",
        },
        surface: "#F4F8F6",
        border1: "#DDE9E4",
        border2: "#EBF3EF",
        hero: {
          bg: "#071812",
          card: "#0D2318",
        },
        accent: {
          amber: "#E8920A",
          blue: "#2563EB",
          purple: "#7C3AED",
        },
      },
      fontFamily: {
        serif: ['"Instrument Serif"', "Georgia", "serif"],
        sans: ['"Geist"', "system-ui", "sans-serif"],
        mono: ['"Geist Mono"', '"Courier New"', "monospace"],
      },
      maxWidth: {
        container: "1160px",
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        float1: "float1 6s ease-in-out infinite",
        float2: "float2 7s ease-in-out infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(86,201,158,0.6)" },
          "50%": { boxShadow: "0 0 0 6px rgba(86,201,158,0)" },
        },
        float1: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        float2: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(6px)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
