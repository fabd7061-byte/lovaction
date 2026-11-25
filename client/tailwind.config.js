/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0B0D13",
          soft: "#11141C",
          card: "#161A24",
          light: "#1E232F",
        },
        cream: {
          DEFAULT: "#FAF6ED",
          soft: "#F4EDDF",
          deep: "#EDE3D0",
        },
        gold: {
          DEFAULT: "#C9972F",
          light: "#EAC97A",
          pale: "#F6E7BF",
          dark: "#9A6F1B",
        },
        crimson: {
          DEFAULT: "#BF3438",
          dark: "#98282D",
          soft: "#F6DDDC",
        },
        slateink: "#5E5A52",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
        script: ["Caveat", "cursive"],
      },
      boxShadow: {
        soft: "0 18px 50px -24px rgba(20, 16, 8, 0.25)",
        lift: "0 30px 70px -30px rgba(15, 12, 5, 0.35)",
        gold: "0 18px 50px -20px rgba(201, 151, 47, 0.5)",
        inset: "inset 0 1px 0 rgba(255,255,255,0.06)",
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #EAC97A 0%, #C9972F 50%, #9A6F1B 100%)",
        "ink-fade": "linear-gradient(180deg, #0B0D13 0%, #11141C 100%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(22px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up .7s cubic-bezier(.22,.61,.36,1) both",
        "fade-in": "fade-in .5s ease both",
        float: "float 7s ease-in-out infinite",
        shimmer: "shimmer 2.4s linear infinite",
        "scale-in": "scale-in .25s ease both",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(.22,.61,.36,1)",
      },
    },
  },
  plugins: [],
};
