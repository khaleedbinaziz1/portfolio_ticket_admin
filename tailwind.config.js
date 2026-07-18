/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'custom-bg': "url('/better-client/src/images/bg.svg')",
      },
    },

    keyframes: {
      pop: {
        '0%, 100%': { transform: 'scale(1)' },
        '50%': { transform: 'scale(1.2)' },
      },
    },
    animation: {
      pop: 'pop 1.8s ease-in-out',
    },

  },
  daisyui: {
    themes: [
      {
        mytheme: {

          "primary": "#49AABB",

          "secondary": "#DEF9EC",

          "accent": "#FFD200",

          "neutral": "#e9f5e3",

          "base-100": "#FFFFFF",

          "info": "#FF534D",

          "success": "#00A96E",

          "warning": "#F57223",



          "error": "#F87272",
        },
      },
    ],
    screens: {
      'sm': '640px',
      // => @media (min-width: 640px) { ... }

      'md': '768px',
      // => @media (min-width: 768px) { ... }

      'lg': '1024px',
      // => @media (min-width: 1024px) { ... }

      'xl': '1280px',
      // => @media (min-width: 1280px) { ... }

      '2xl': '1536px',
      // => @media (min-width: 1536px) { ... }
    }
  },
  plugins: [require("daisyui")],
}