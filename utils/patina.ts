import { SkinMaterial } from '../types';

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
