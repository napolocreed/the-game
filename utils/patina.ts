import { SkinFx, SkinMaterial } from '../types';

/**
 * Ageing effects for the "living" skins.
 *
 * A seniority skin is not just a colour scheme you happen to own late — it
 * keeps changing after you earn it. Moss creeps up from the bottom edge, the
 * frame crazes, varnish darkens at the corners. The stage is a plain 0..1
 * number driven by how long the account has existed, so the whole thing stays
 * a pure function: same age, same picture, on every device.
 *
 * Everything here is drawn as pixel rectangles with `crispEdges` and tiled as
 * a data URI. No images to ship, no network, and the browser rasterises each
 * tile once.
 */

const url = (svg: string): string =>
  `url("data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}")`;

const svgTag = (w: number, h: number, body: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${body}</svg>`;

/** Deterministic noise: the same account age always draws the same cracks. */
const lcg = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

/**
 * Hairline cracks across a large tile.
 *
 * Few and faint on purpose: this sits above the entire interface, and anything
 * strong enough to notice on a single card is far too strong across a screen.
 */
const cracks = (stage: number, colour: string, count: number, maxAlpha: number): string => {
  const rand = lcg(0x5eed);
  const alpha = (maxAlpha * clamp01(stage)).toFixed(3);
  const parts: string[] = [];
  const drawn = Math.max(1, Math.round(count * (0.4 + 0.6 * clamp01(stage))));
  for (let i = 0; i < drawn; i++) {
    let x = Math.round(rand() * 320);
    let y = Math.round(rand() * 320);
    let dx = rand() < 0.5 ? 1 : -1;
    const segments = 10 + Math.round(rand() * 14);
    const d: string[] = [`M${x} ${y}`];
    for (let s = 0; s < segments; s++) {
      // A crack runs mostly one way and jinks a little — a straight line reads
      // as a scratch, a random walk reads as noise.
      x += dx * (2 + Math.round(rand() * 5));
      y += Math.round(rand() * 5) - 1;
      if (rand() < 0.15) dx = -dx;
      d.push(`L${x} ${y}`);
    }
    parts.push(`<path d="${d.join('')}" fill="none" stroke="${colour}" stroke-width="1" opacity="${alpha}"/>`);
  }
  return url(svgTag(320, 320, parts.join('')));
};

/**
 * A row of pixel vines rooted at the bottom of the screen.
 *
 * Drawn at its true height rather than scaled, so the pixels stay square as it
 * grows — a sprite stretched to 1.7× is the one thing that would give the whole
 * look away.
 */
const vines = (
  stage: number, stem: string, leaf: string, leafDim: string, bloom: string | null,
): { image: string; height: number; width: number } => {
  const s = clamp01(stage);
  // Capped low on purpose: this strip is fixed to the bottom of the viewport,
  // so every pixel of it is a pixel of the app it covers forever.
  const h = Math.max(4, Math.round(5 + s * 29));
  const rand = lcg(0xf0f1a);
  const TILE = 192;
  // Uneven spacing and heights — evenly pitched stems read as a comb, not a
  // hedge — across 192px of tile, because a narrower one repeats four times
  // on a phone and the eye finds the seam immediately.
  const columns = [
    { x: 3, f: 0.55 }, { x: 11, f: 0.86 }, { x: 21, f: 0.42 }, { x: 30, f: 1 },
    { x: 41, f: 0.66 }, { x: 52, f: 0.92 }, { x: 61, f: 0.38 }, { x: 71, f: 0.78 },
    { x: 82, f: 0.6 }, { x: 90, f: 0.95 }, { x: 101, f: 0.47 }, { x: 109, f: 0.72 },
    { x: 120, f: 0.98 }, { x: 130, f: 0.35 }, { x: 138, f: 0.64 }, { x: 149, f: 0.88 },
    { x: 159, f: 0.5 }, { x: 168, f: 0.76 }, { x: 178, f: 0.44 }, { x: 186, f: 0.9 },
  ];
  const parts: string[] = [];
  // A line of ground moss so the stems grow out of something.
  parts.push(`<rect x="0" y="${h - 2}" width="${TILE}" height="2" fill="${leafDim}"/>`);

  for (const { x, f } of columns) {
    const top = h - Math.max(3, Math.round(h * f));
    let cx = x;
    // Stems lean as they climb: one step sideways every few pixels. Emitted as
    // one rect per straight run rather than per pixel row — the whole sprite
    // ends up in a CSS custom property, so its length is not free.
    let runTop = h - 1;
    for (let y = h - 1; y >= top; y--) {
      if ((h - y) % 5 === 4 && y > top) {
        parts.push(`<rect x="${cx}" y="${y}" width="2" height="${runTop - y + 1}" fill="${stem}"/>`);
        cx += rand() < 0.5 ? -1 : 1;
        runTop = y - 1;
      }
    }
    parts.push(`<rect x="${cx}" y="${top}" width="2" height="${Math.max(1, runTop - top + 1)}" fill="${stem}"/>`);
    // Leaves alternate sides going up, thinning toward the tip.
    let side = rand() < 0.5 ? 1 : -1;
    for (let y = h - 4; y > top + 1; y -= 4) {
      const lx = side > 0 ? cx + 2 : cx - 4;
      parts.push(`<rect x="${lx}" y="${y}" width="4" height="2" fill="${leaf}"/>`);
      parts.push(`<rect x="${side > 0 ? lx + 1 : lx + 1}" y="${y - 1}" width="2" height="1" fill="${leafDim}"/>`);
      side = -side;
    }
    if (bloom && s > 0.7 && f > 0.8) {
      parts.push(`<rect x="${cx - 1}" y="${top - 2}" width="4" height="2" fill="${bloom}"/>`);
      parts.push(`<rect x="${cx}" y="${top - 3}" width="2" height="1" fill="${bloom}"/>`);
    }
  }
  return { image: url(svgTag(TILE, h, parts.join(''))), height: h, width: TILE };
};

/* --- Weather ------------------------------------------------------------
   Animated layers. Each is a seamlessly tiled sprite that travels exactly one
   tile per cycle, so the loop is invisible and the whole effect costs one
   compositor transform instead of a repaint per frame.

   Everything is scattered by a seeded generator rather than laid on a grid:
   the eye finds a lattice instantly and stops believing in the rain. */

/** Scatter n sprites through a tile, each drawn by the caller. */
const scatter = (
  seed: number, w: number, h: number, n: number,
  draw: (x: number, y: number, r: () => number) => string,
): string => {
  const rand = lcg(seed);
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    parts.push(draw(Math.floor(rand() * w), Math.floor(rand() * h), rand));
  }
  return url(svgTag(w, h, parts.join('')));
};

const px = (x: number, y: number, w: number, h: number, fill: string, o = 1): string =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${o < 1 ? ` opacity="${o.toFixed(2)}"` : ''}/>`;

/** Diagonal streaks. Two lengths so the wall of rain has depth. */
const rain = (seed: number, colour: string, n: number): string =>
  scatter(seed, 64, 96, n, (x, y, r) => {
    const len = 4 + Math.floor(r() * 6);
    // Faint on purpose. Rain is the densest effect here and the only one that
    // covers the whole screen at once, so it has to sit under the text rather
    // than compete with it.
    const o = 0.12 + r() * 0.22;
    // Each streak is a staircase of 1px steps — a diagonal drawn with square
    // pixels, which is what rain looks like in this font's world.
    let out = '';
    for (let i = 0; i < len; i++) out += px(x + i, y + i * 2, 1, 2, colour, o);
    return out;
  });

/** Petals: two-tone, tumbling, never quite the same shape twice. */
const petals = (seed: number, light: string, dark: string, n: number): string =>
  scatter(seed, 112, 112, n, (x, y, r) => {
    const c = r() < 0.5 ? light : dark;
    const o = 0.45 + r() * 0.4;
    return r() < 0.5
      ? px(x, y, 3, 2, c, o) + px(x + 2, y + 1, 2, 1, c, o)
      : px(x, y, 2, 3, c, o) + px(x + 1, y + 2, 1, 2, c, o);
  });

/** Sparks going up. Small, hot, and mostly gone before they reach the top. */
const embers = (seed: number, hot: string, cool: string, n: number): string =>
  scatter(seed, 80, 120, n, (x, y, r) => {
    const big = r() < 0.3;
    const c = r() < 0.6 ? hot : cool;
    return px(x, y, big ? 2 : 1, big ? 2 : 1, c, 0.3 + r() * 0.6);
  });

/** Snow: slow, round-ish, and never more than two pixels across. */
const snow = (seed: number, colour: string, n: number): string =>
  scatter(seed, 96, 96, n, (x, y, r) => {
    const big = r() < 0.25;
    return big
      ? px(x, y, 2, 1, colour, 0.55) + px(x, y - 1, 1, 1, colour, 0.55) + px(x + 1, y + 1, 1, 1, colour, 0.4)
      : px(x, y, 1, 1, colour, 0.35 + r() * 0.4);
  });

/** A field of stars, with a handful of bright ones. */
const stars = (seed: number, colour: string, bright: string, n: number): string =>
  scatter(seed, 160, 160, n, (x, y, r) => {
    if (r() < 0.08) {
      // The bright ones get a cross of single pixels — a pixel-art twinkle.
      return px(x, y, 1, 1, bright) + px(x - 1, y, 1, 1, bright, 0.4) +
        px(x + 1, y, 1, 1, bright, 0.4) + px(x, y - 1, 1, 1, bright, 0.4) +
        px(x, y + 1, 1, 1, bright, 0.4);
    }
    return px(x, y, 1, 1, colour, 0.2 + r() * 0.55);
  });

/** Dust hanging in a shaft of light. Barely there, and very slow. */
const motes = (seed: number, colour: string, n: number): string =>
  scatter(seed, 128, 128, n, (x, y, r) => px(x, y, 1, 1, colour, 0.12 + r() * 0.25));

/** Bubbles: a ring of pixels with a highlight, rising. */
const bubbles = (seed: number, colour: string, n: number): string =>
  scatter(seed, 88, 128, n, (x, y, r) => {
    if (r() < 0.4) return px(x, y, 1, 1, colour, 0.3 + r() * 0.3);
    return px(x + 1, y, 2, 1, colour, 0.45) + px(x, y + 1, 1, 2, colour, 0.45) +
      px(x + 3, y + 1, 1, 2, colour, 0.45) + px(x + 1, y + 3, 2, 1, colour, 0.45) +
      px(x + 1, y + 1, 1, 1, colour, 0.7);
  });

/** One bright line rolling down the screen, the way a CRT never quite syncs. */
const scanRoll = (colour: string, period: number): string =>
  `repeating-linear-gradient(to bottom, ${colour} 0 1px, transparent 1px ${period}px)`;

/** A band of light travelling across the surface. */
const sheen = (colour: string): string =>
  `linear-gradient(105deg, transparent 42%, ${colour} 50%, transparent 58%)`;

/** Fine, uneven grain — the tooth of paper or the grit of stone. */
const grain = (alpha: number, frequency: number): string =>
  url(svgTag(140, 140,
    `<filter id="g"><feTurbulence type="fractalNoise" baseFrequency="${frequency}" numOctaves="3"/>` +
    `<feColorMatrix type="saturate" values="0"/></filter>` +
    `<rect width="140" height="140" filter="url(#g)" opacity="${alpha}"/>`));

/** Craquelure: the crosshatch a varnished surface breaks into as it dries. */
const craquelure = (alpha: number): string =>
  `repeating-linear-gradient(45deg, rgba(0,0,0,${alpha}) 0 1px, transparent 1px 7px), ` +
  `repeating-linear-gradient(-45deg, rgba(0,0,0,${alpha}) 0 1px, transparent 1px 9px)`;

/** Darkening at the edges, as old varnish does. */
const vignette = (alpha: number, tint: string): string =>
  `radial-gradient(ellipse at center, transparent 52%, ${tint.replace('ALPHA', alpha.toFixed(3))} 100%)`;

/**
 * How far a living skin has aged, 0..1.
 *
 * It keeps maturing for as long again as it took to earn: a skin unlocked at
 * 90 days is fully weathered at 180, one earned at two years finishes at four.
 * The reward for staying is that it is still changing long after you got it.
 */
export const livingStage = (seniorityDays: number, unlockDays: number): number =>
  clamp01((seniorityDays - unlockDays) / Math.max(1, unlockDays));

/** The material a living skin wears at this stage, merged over its own. */
export const patina = (livingId: string, stage: number, base?: SkinMaterial): SkinMaterial => {
  const s = clamp01(stage);
  const m: SkinMaterial = { ...base };
  const layers: string[] = [];

  switch (livingId) {
    case 'weathered': {
      // Paint that has been out in the weather: grain first, then cracks that
      // multiply as the years pass.
      m.texture = [grain(0.05 + s * 0.05, 0.9), base?.texture].filter(Boolean).join(', ');
      layers.push(cracks(s, '#1b1512', 7, 0.5));
      layers.push(vignette(0.10 + s * 0.14, 'rgba(20,16,14,ALPHA)'));
      break;
    }
    case 'overgrown': {
      const v = vines(s, '#3f6b34', '#5f9a44', '#2f5228', '#c9d97a');
      m.texture = grain(0.05, 1.1);
      // Rooted at the bottom edge and repeating across it: a hedge line, not a
      // pattern spread over the content.
      layers.push(`${v.image} bottom left / ${v.width}px ${v.height}px repeat-x`);
      layers.push(vignette(0.08 + s * 0.10, 'rgba(14,26,14,ALPHA)'));
      break;
    }
    case 'heirloom': {
      m.texture = [craquelure(0.02 + s * 0.03), grain(0.05, 0.7)].join(', ');
      layers.push(cracks(s * 0.7, '#2a1c0c', 4, 0.35));
      layers.push(vignette(0.14 + s * 0.20, 'rgba(46,28,8,ALPHA)'));
      break;
    }
    case 'monument': {
      // Stone: heavy grain, deep cracks, and moss finally taking the base.
      const v = vines(s * 0.7, '#3d5a3a', '#557a45', '#2c4231', null);
      m.texture = grain(0.09 + s * 0.05, 0.55);
      layers.push(cracks(s, '#0d0d0f', 9, 0.55));
      if (s > 0.15) layers.push(`${v.image} bottom left / ${v.width}px ${v.height}px repeat-x`);
      layers.push(vignette(0.16 + s * 0.18, 'rgba(10,10,12,ALPHA)'));
      break;
    }
    default:
      return m;
  }

  m.overlay = [base?.overlay, ...layers].filter(Boolean).join(', ');
  return m;
};

/**
 * The signature effects.
 *
 * Reserved for skins worth a spectacle rather than sprinkled everywhere: if
 * every skin had weather, none of them would feel like a reward. Two of them
 * (Ember, Tidepool) sit early on the ladder on purpose, as proof that skins
 * keep getting stranger.
 *
 * Every layer is slow and low-contrast. This runs behind an app someone opens
 * at 7am to decide whether they went for a run, and nothing here is allowed to
 * make that harder to read.
 */
export const FX: Record<string, SkinFx> = {
  // Two speeds of rain, the near one faster — parallax with two layers.
  rain: {
    a: { image: rain(0x9a11, '#7fe8ff', 12), tile: 96, duration: 1.8, motion: 'fall' },
    b: { image: rain(0x5c22, '#ff6fd0', 8), tile: 96, duration: 3.1, motion: 'fall' },
  },
  petals: {
    a: { image: petals(0x5a11, '#ffc2d8', '#e087a8', 11), tile: 112, duration: 26, motion: 'fall' },
    b: { image: petals(0x7c33, '#f7a8c4', '#c96f92', 7), tile: 112, duration: 44, motion: 'fall' },
  },
  embers: {
    a: { image: embers(0xe111, '#ff9a3c', '#ffd88a', 14), tile: 120, duration: 13, motion: 'rise' },
    b: { image: embers(0xe222, '#d4552a', '#ff8a4c', 9), tile: 120, duration: 23, motion: 'rise' },
  },
  snow: {
    a: { image: snow(0x50f1, '#ffffff', 14), tile: 96, duration: 22, motion: 'fall' },
    b: { image: snow(0x51f2, '#cfe8ff', 9), tile: 96, duration: 40, motion: 'fall' },
  },
  stars: {
    a: { image: stars(0x57a5, '#ffffff', '#bfe0ff', 40), tile: 160, duration: 150, motion: 'fall' },
  },
  motes: {
    a: { image: motes(0xd057, '#ffe8c0', 18), tile: 128, duration: 70, motion: 'rise' },
  },
  bubbles: {
    a: { image: bubbles(0xb0b1, '#9fe8ff', 9), tile: 128, duration: 17, motion: 'rise' },
    b: { image: bubbles(0xb0b2, '#6fc8e0', 6), tile: 128, duration: 31, motion: 'rise' },
  },
  // The line a CRT never quite holds still. Slow enough to be atmosphere
  // rather than a fault.
  roll: {
    a: { image: scanRoll('rgba(255,255,255,0.055)', 5), tile: 5, duration: 6, motion: 'fall' },
  },
  sheen: {
    // Off screen for most of the cycle: the long wait between passes is what
    // makes it read as a glint rather than a strobe.
    a: { image: sheen('rgba(255,232,160,0.14)'), tile: 0, duration: 15, motion: 'sweep' },
  },
  // Rain plus the scanline roll: the alley and the sign above it.
  neon: {
    a: { image: rain(0x9a11, '#7fe8ff', 11), tile: 96, duration: 1.9, motion: 'fall' },
    b: { image: scanRoll('rgba(255,120,214,0.05)', 4), tile: 4, duration: 7, motion: 'fall' },
  },
};

/** Neon-sign glows, applied to accent and title text. */
export const GLOW: Record<string, string> = {
  pink: '0 0 6px rgba(255,92,200,0.75), 0 0 14px rgba(255,92,200,0.35)',
  mint: '0 0 6px rgba(126,255,200,0.7), 0 0 14px rgba(126,255,200,0.3)',
  amber: '0 0 6px rgba(255,176,46,0.7), 0 0 16px rgba(255,138,30,0.32)',
  violet: '0 0 6px rgba(215,168,255,0.7), 0 0 16px rgba(140,224,255,0.28)',
  gold: '0 0 5px rgba(255,207,92,0.6), 0 0 14px rgba(255,207,92,0.28)',
};

/** Ready-made materials for skins that have a surface but do not age. */
export const MATERIALS: Record<string, SkinMaterial> = {
  paper: { texture: [craquelure(0.02), grain(0.07, 0.75)].join(', '), shadowFar: '6px 6px 0px', shadowNear: '3px 3px 0px' },
  stone: { texture: grain(0.1, 0.5), borderWidth: 5, shadowFar: '8px 8px 0px' },
  glass: {
    texture: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.035) 0 1px, transparent 1px 3px)',
    shadowFar: '6px 6px 0px', shadowNear: '3px 3px 0px',
  },
  metal: {
    texture: 'repeating-linear-gradient(100deg, rgba(255,255,255,0.045) 0 1px, transparent 1px 6px)',
    borderWidth: 5,
  },
  cloth: {
    texture:
      'repeating-linear-gradient(45deg, rgba(0,0,0,0.05) 0 2px, transparent 2px 5px), ' +
      'repeating-linear-gradient(-45deg, rgba(255,255,255,0.03) 0 2px, transparent 2px 5px)',
    shadowFar: '5px 5px 0px', shadowNear: '3px 3px 0px',
  },
  crt: {
    texture: 'repeating-linear-gradient(to bottom, rgba(0,0,0,0.14) 0 1px, transparent 1px 3px)',
    overlay: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.35) 100%)',
  },
};
