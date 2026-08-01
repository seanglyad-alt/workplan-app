/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: {
          650: '#546e7a',
        },
      },
      fontFamily: {
        sans: ["Inter", "Battambang", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Battambang", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};
