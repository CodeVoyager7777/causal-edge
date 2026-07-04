/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        rig: {
          bg:      "#06090F",
          surface: "#0D1520",
          panel:   "#111E2E",
          panel2:  "#162030",
          border:  "#1E2D42",
          text:    "#E2EDF8",
          muted:   "#5B7A99",
          dim:     "#2A3F58",
        },
        signal: {
          nominal:   "#00D4A1",
          info:      "#38AEFF",
          warning:   "#F5A623",
          critical:  "#FF3B5C",
          consensus: "#A78BFA",
        },
        glow: {
          teal:   "rgba(0,212,161,0.15)",
          blue:   "rgba(56,174,255,0.15)",
          red:    "rgba(255,59,92,0.15)",
          amber:  "rgba(245,166,35,0.15)",
          violet: "rgba(167,139,250,0.15)",
        },
      },
      fontFamily: {
        display: ["'Chakra Petch'", "sans-serif"],
        mono:    ["'JetBrains Mono'", "ui-monospace", "monospace"],
        body:    ["'Inter'", "sans-serif"],
      },
      boxShadow: {
        panel:    "0 0 0 1px #1E2D42, 0 20px 40px -12px rgba(0,0,0,0.7)",
        glass:    "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
        glow_teal:"0 0 24px rgba(0,212,161,0.25), 0 0 8px rgba(0,212,161,0.15)",
        glow_red: "0 0 24px rgba(255,59,92,0.3), 0 0 8px rgba(255,59,92,0.2)",
        glow_amber:"0 0 24px rgba(245,166,35,0.25), 0 0 8px rgba(245,166,35,0.15)",
        inner:    "inset 0 1px 0 rgba(255,255,255,0.05)",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "pulse-slow":   "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "fade-in":      "fadeIn 0.5s ease forwards",
        "slide-up":     "slideUp 0.4s ease forwards",
        "glow-pulse":   "glowPulse 2s ease-in-out infinite",
        "flow":         "flow 1.5s linear infinite",
        "typing":       "typing 0.05s steps(1) infinite",
        "scan":         "scan 4s linear infinite",
      },
      keyframes: {
        fadeIn:    { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        slideUp:   { "0%": { opacity: 0, transform: "translateY(20px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        glowPulse: { "0%,100%": { opacity: 0.6 }, "50%": { opacity: 1 } },
        flow:      { "0%": { strokeDashoffset: 100 }, "100%": { strokeDashoffset: 0 } },
        scan:      { "0%": { transform: "translateY(-100%)" }, "100%": { transform: "translateY(200%)" } },
      },
    },
  },
  plugins: [],
};
