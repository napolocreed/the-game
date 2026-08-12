/**
 * The skin token vocabulary.
 *
 * Every colour in the app resolves through one of these names. They are named
 * for the ROLE a colour plays, never for the colour itself: `frame`, not
 * `brown`; `good`, not `green`. That is what makes a light skin, a monochrome
 * skin or a cold-blue skin possible at all — a token called `brown` would have
 * to lie in every one of them.
 *
 * The default values below are the app exactly as it shipped, so the
 * tokenisation is a no-op on screen and every later skin is a delta from a
 * known-good baseline.
 */

export interface SkinTokens {
  // Surfaces, from furthest back to closest.
  canvas: string;      // the page itself
  surface: string;     // a card
  raised: string;      // a control sitting on a card
  inset: string;       // a well: inputs, empty cells, progress troughs
  insetDeep: string;   // the darkest hole, for missed/absent states

  // Structure.
  frame: string;       // the 4px border that makes the pixel look
  frameDim: string;    // secondary borders and dividers
  shadow: string;      // the hard drop shadow

  // Ink, brightest to faintest.
  inkHi: string;       // emphasis text (was `text-white`)
  ink: string;         // body text
  inkSoft: string;     // secondary body text
  inkDim: string;      // labels, captions
  inkFaint: string;    // disabled, tertiary

  // Identity.
  accent: string;      // the app's signature highlight
  accentDim: string;   // its recessive twin, for chart fills
  title: string;       // the wordmark

  // Semantics. Each is a 3-step ramp: fill / hover / border.
  good: string;
  goodHi: string;
  goodEdge: string;
  goodSoft: string;    // the DATA green (charts, indicators) — not an action
  miss: string;        // a missed habit: regrettable, not dangerous
  missHi: string;
  missEdge: string;
  danger: string;      // destructive actions only
  dangerHi: string;
  dangerEdge: string;
  warn: string;        // cautionary text
  xp: string;
  info: string;
  neutral: string;     // skipped, paused, "let go"
  notice: string;      // the surface of an inline warning strip
  noticeEdge: string;

  // Mood, a five-point DIVERGING scale: two hues around a neutral middle.
  // It used to be a red-orange-yellow-lime-green rainbow, which reads as five
  // unrelated categories rather than one ordered axis.
  moodWorst: string;
  moodBad: string;
  moodMid: string;
  moodGood: string;
  moodBest: string;

  // Category identity. Validated for colour-vision deficiency per skin.
  catHealth: string;
  catWellness: string;
  catProductivity: string;
  catLifestyle: string;
  catHealthSh: string;
  catWellnessSh: string;
  catProductivitySh: string;
  catLifestyleSh: string;

  // Overlays.
  scrim: string;       // the dimmer behind a modal
}

/** CSS custom property name for a token. */
export const cssVar = (key: keyof SkinTokens): string =>
  '--' + key.replace(/[A-Z]/g, m => '-' + m.toLowerCase());

/**
 * "Classic" — the original tavern palette. Every value here is lifted
 * unchanged from the hardcoded hexes it replaces.
 */
export const CLASSIC: SkinTokens = {
  canvas: '#2c2121',
  surface: '#4a3f36',
  raised: '#6a5340',
  inset: '#2c2121',
  insetDeep: '#1f1717',

  frame: '#8a6a4f',
  frameDim: '#6a5340',
  shadow: '#1a1515',

  inkHi: '#ffffff',
  ink: '#f0e9d6',
  inkSoft: '#d8cbb8',
  inkDim: '#b0a08f',
  inkFaint: '#8a7a68',

  accent: '#f5b342',
  accentDim: '#c98d2e',
  title: '#ff9a00',

  good: '#15803d',
  goodHi: '#16a34a',
  goodEdge: '#14532d',
  goodSoft: '#3b9b73',
  miss: '#9a3412',
  missHi: '#c2410c',
  missEdge: '#7c2d12',
  danger: '#991b1b',
  dangerHi: '#b91c1c',
  dangerEdge: '#7f1d1d',
  warn: '#fcd34d',
  xp: '#d8b4fe',
  info: '#67e8f9',
  neutral: '#8a7a68',
  notice: '#4a3210',
  noticeEdge: '#a16207',

  moodWorst: '#a33131',
  moodBad: '#c87b6a',
  moodMid: '#8a7a68',
  moodGood: '#6aab8a',
  moodBest: '#2f8f66',

  catHealth: '#c84141',
  catWellness: '#4185c8',
  catProductivity: '#d147af',
  catLifestyle: '#3b9b73',
  catHealthSh: '#5e1c1c',
  catWellnessSh: '#173d5e',
  catProductivitySh: '#63174f',
  catLifestyleSh: '#164934',

  scrim: 'rgba(0,0,0,0.75)',
};

export const TOKEN_KEYS = Object.keys(CLASSIC) as (keyof SkinTokens)[];

/** Write a token set onto an element (the document root in practice). */
export const applyTokens = (tokens: SkinTokens, el: HTMLElement): void => {
  for (const key of TOKEN_KEYS) {
    el.style.setProperty(cssVar(key), tokens[key]);
  }
};

/** The same, as a CSS text block — used to build preview swatches. */
export const tokensToCss = (tokens: SkinTokens): string =>
  TOKEN_KEYS.map(k => `${cssVar(k)}:${tokens[k]}`).join(';');
