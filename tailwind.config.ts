import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        moss: {
          DEFAULT: "rgb(var(--accent-rgb) / <alpha-value>)",
          dark: "rgb(var(--accent-strong-rgb) / <alpha-value>)",
          deep: "rgb(var(--bg-deep-rgb) / <alpha-value>)",
          deeper: "rgb(var(--bg-deeper-rgb) / <alpha-value>)",
          light: "rgb(var(--accent-soft-rgb) / <alpha-value>)",
          mid: "rgb(var(--accent-mid-rgb) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--text-rgb) / <alpha-value>)",
          2: "rgb(var(--text-2-rgb) / <alpha-value>)",
          3: "rgb(var(--text-3-rgb) / <alpha-value>)",
          4: "rgb(var(--text-4-rgb) / <alpha-value>)",
          5: "rgb(var(--text-5-rgb) / <alpha-value>)",
        },
        page: "rgb(var(--bg-rgb) / <alpha-value>)",
        surface: "rgb(var(--bg-elevated-rgb) / <alpha-value>)",
        border1: "rgb(var(--border-rgb) / <alpha-value>)",
        border2: "rgb(var(--border-2-rgb) / <alpha-value>)",
        hero: {
          bg: "rgb(var(--bg-deep-rgb) / <alpha-value>)",
          card: "rgb(var(--bg-deep-card-rgb) / <alpha-value>)",
        },
        accent: {
          amber: "#E8920A",
          blue: "#2563EB",
          purple: "#7C3AED",
        },
        // Fixed brand-green for bookMySlot product (never themed)
        "moss-brand": "#1A9E74",
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"Geist Mono"', '"Courier New"', "monospace"],
      },
      maxWidth: {
        container: "1160px",
      },
      animation: {
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        "ai-pulse": "ai-pulse 3s ease-in-out infinite",
        float1: "float1 6s ease-in-out infinite",
        float2: "float2 7s ease-in-out infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(34,211,238,0.55)" },
          "50%": { boxShadow: "0 0 0 6px rgba(34,211,238,0)" },
        },
        "ai-pulse": {
          "0%,100%": {
            filter:
              "drop-shadow(0 0 6px rgba(34,211,238,0.55)) drop-shadow(0 0 14px rgba(59,130,246,0.25))",
          },
          "50%": {
            filter:
              "drop-shadow(0 0 12px rgba(34,211,238,0.85)) drop-shadow(0 0 24px rgba(59,130,246,0.5))",
          },
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
