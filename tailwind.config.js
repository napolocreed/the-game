/** @type {import('tailwindcss').Config} */

// Every colour resolves through a CSS custom property so a skin can repaint
// the whole app by writing variables on <html>. The names describe the ROLE a
// colour plays, never the colour itself — see utils/theme.ts.
const token = name => `var(--${name})`;

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
      colors: {
        canvas: token('canvas'),
        surface: token('surface'),
        raised: token('raised'),
        inset: token('inset'),
        'inset-deep': token('inset-deep'),

        frame: token('frame'),
        'frame-dim': token('frame-dim'),
        shadowc: token('shadow'),

        'ink-hi': token('ink-hi'),
        ink: token('ink'),
        'ink-soft': token('ink-soft'),
        'ink-dim': token('ink-dim'),
        'ink-faint': token('ink-faint'),

        accent: token('accent'),
        'accent-dim': token('accent-dim'),
        title: token('title'),

        good: token('good'),
        'good-hi': token('good-hi'),
        'good-edge': token('good-edge'),
        'good-soft': token('good-soft'),
        miss: token('miss'),
        'miss-hi': token('miss-hi'),
        'miss-edge': token('miss-edge'),
        danger: token('danger'),
        'danger-hi': token('danger-hi'),
        'danger-edge': token('danger-edge'),
        warn: token('warn'),
        xp: token('xp'),
        info: token('info'),
        neutral: token('neutral'),
        notice: token('notice'),
        'notice-edge': token('notice-edge'),

        'mood-worst': token('mood-worst'),
        'mood-bad': token('mood-bad'),
        'mood-mid': token('mood-mid'),
        'mood-good': token('mood-good'),
        'mood-best': token('mood-best'),

        'cat-health': token('cat-health'),
        'cat-wellness': token('cat-wellness'),
        'cat-productivity': token('cat-productivity'),
        'cat-lifestyle': token('cat-lifestyle'),

        scrim: token('scrim'),
      },
      boxShadow: {
        // The pixel theme's hard offset shadows. Depth is a skin parameter too:
        // --shadow-far/near let a flatter skin soften the whole app at once.
        hard: 'var(--shadow-far, 8px 8px 0px) var(--shadow)',
        'hard-sm': 'var(--shadow-near, 4px 4px 0px) var(--shadow)',
        'hard-xs': '2px 2px 0px var(--shadow)',
        'hard-press': '2px 2px 0px var(--shadow)',
        good: '4px 4px 0px var(--good-edge)',
        danger: '4px 4px 0px var(--danger-edge)',
        miss: '4px 4px 0px var(--miss-edge)',
        neutral: '4px 4px 0px var(--shadow)',
      },
    },
  },
  plugins: [],
};
