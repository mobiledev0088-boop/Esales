/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class',  
  theme: {
    extend: {
      colors: {
        // Primary brand palette
        primary: {
          DEFAULT: "#00539B",
          // dark: "#2c334d"
          // dark: "#1D4559"
          dark: "#3399FF"
        },
        secondary: {
          DEFAULT: "#0077b6",
          // dark: "#38bdf8"
          dark: "#66CCFF"
        },

        // UI States
        success: {
          DEFAULT: "#34D399",
          dark: "#059669"
        },
        warning: {
          DEFAULT: "#FBBF24",
          dark: "#D97706"
        },
        error: {
          DEFAULT: "#EF4444",
          dark: "#B91C1C"
        },

        // Text
        text: {
          DEFAULT: "#1F2937",
          // dark: "#374151"
          dark: "#E5E7EB"
        },


        // Backgrounds
        background: {
          DEFAULT: "#E1E2E1",
          dark: "#C7C8C7"
        },
        darkBg: {
          base: "#121212",
          surface: "#1F1F1F"
        },
        lightBg: {
          base: "#f8fafc",
          surface: "#ffffff"
        },

        // Typography themes
        heading: {
          DEFAULT: "#2D3B44",
          dark: "#f3f6f4"
        },
        subheading: {
          DEFAULT: "#000000",
          dark: "#e1e1e1"
        },

        // Component-specific
        border: "#ccc",
        tabSelected: {
          DEFAULT: "#0076ff",
          // dark: "rgba(0,118,255,0.1)"
          dark: "#3399FF"
        },
        button: "#0C5D96",
        disabled: "#060505ff",

        // Form
        formLabel: {
          DEFAULT: "#7F7F7F",
          muted: "#666a7b"
        },

        // Grid / Chart
        gridHeader: "rgba(148, 154, 159, 0.44)",

        // Utility / Material colors
        util: {
          green: "#3ebc5c",
          blue: "#2d7abc",
          red: "#ee4949",
          yellow: "#f3c12a",
          cyan: "#5bc0de",
          pink: "#e975bd",
          purple: "#9c76f7",
          orange: "#ef8b60",
          olive: "#a5a662",
          sky: "rgb(20, 152, 235)",
          grayTransparent: "rgba(222,226,230,0.5)"
        },
      },

      fontSize: {
        xss: 8,
        xs: 10,
        sm: 12,
        base: 14,
        md: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
        '5xl': 48
      },

      borderRadius: {
        none: 0,
        sm: 4,
        DEFAULT: 8,
        md: 12,
        lg: 16,
        xl: 24,
        '2xl': 32,
        full: 9999
      },

      fontFamily: {
        manrope: ["Manrope-Regular"],
        manropeMedium:  ["Manrope-Medium"],
        manropeSemibold:  ["Manrope-SemiBold"],
        manropeBold:  ["Manrope-Bold"],
        manropeExtraBold: ["Manrope-ExtraBold"]
      },

      borderWidth: {
        DEFAULT: 1,
        0: 0,
        2: 2,
        4: 4,
        8: 8
      },

      boxShadow: {
        sm: '0px 1px 3px rgba(0,0,0,0.1)',
        md: '0px 4px 6px rgba(0,0,0,0.1)',
        lg: '0px 10px 15px rgba(0,0,0,0.15)'
      },
    },
  },
  plugins: [],
};


