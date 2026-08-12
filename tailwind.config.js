/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './App.tsx', './index.tsx', './components/**/*.{ts,tsx}', './hooks/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Tailwind's first default breakpoint is 640px, which NO phone reaches:
      // a Pixel 8 is 412 CSS px, a Pixel 9 is 360, an iPhone 15 is 393. That
      // meant every `sm:` refinement was really desktop-only and every phone —
      // including big ones — got the 320px emergency layout. These two land
      // inside the phone range so real devices get the roomy layout they have
      // space for.
      screens: {
        xs: '360px', // most Android phones and up
        pm: '400px', // "phone medium": Pixel 8 (412), iPhone Pro Max, Pixel 9 Pro (427)
      },
    },
  },
  plugins: [],
};
