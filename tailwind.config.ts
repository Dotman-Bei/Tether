import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#060606",
        surface: {
          1: "#0D0D0D",
          2: "#141414",
          3: "#1A1A1A",
        },
        accent: {
          orange: "#FF3E14",
          "orange-hover": "#E63510",
          "orange-surface": "#EC3C17",
        },
        signal: {
          green: "#10B981",
          red: "#EF4444",
          amber: "#F59E0B",
        },
        edge: {
          subtle: "#1C1C1C",
          strong: "#2E2E2E",
          bright: "#444444",
        },
        ink: {
          primary: "#FFFFFF",
          secondary: "#A1A1AA",
          muted: "#52525B",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Poppins", "Futura", "Century Gothic", "sans-serif"],
        body: ["var(--font-body)", "Inter", "Geist Sans", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "Geist Mono", "monospace"],
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "radar-sweep": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.85)", opacity: "0.7" },
          "80%, 100%": { transform: "scale(1.9)", opacity: "0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "flow-dash": {
          "0%": { strokeDashoffset: "24" },
          "100%": { strokeDashoffset: "0" },
        },
        blink: {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        eq: {
          "0%, 100%": { transform: "scaleY(0.35)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
      animation: {
        marquee: "marquee 38s linear infinite",
        "radar-sweep": "radar-sweep 4s linear infinite",
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.24, 0, 0.38, 1) infinite",
        "fade-up": "fade-up 260ms ease-out both",
        "flow-dash": "flow-dash 900ms linear infinite",
        blink: "blink 1.1s step-end infinite",
        eq: "eq 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
