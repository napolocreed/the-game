/**
 * Small colour maths, used to derive a whole skin from a handful of anchors
 * and to prove afterwards that the result is readable.
 *
 * Forty hand-written palettes with thirty tokens each would be twelve hundred
 * hex values nobody could keep consistent. Deriving the ramps means a skin
 * declares only what makes it itself, and the relationships — a border darker
 * than its fill, a hover lighter than its rest — hold everywhere by
 * construction.
 */

export interface Hsl { h: number; s: number; l: number }

export const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
};

export const rgbToHex = (r: number, g: number, b: number): string =>
  '#' + [r, g, b]
    .map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
    .join('');

export const hexToHsl = (hex: string): Hsl => {
  const [r0, g0, b0] = hexToRgb(hex).map(v => v / 255);
  const max = Math.max(r0, g0, b0);
  const min = Math.min(r0, g0, b0);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r0) h = ((g0 - b0) / d + (g0 < b0 ? 6 : 0)) / 6;
  else if (max === g0) h = ((b0 - r0) / d + 2) / 6;
  else h = ((r0 - g0) / d + 4) / 6;
  return { h: h * 360, s, l };
};

export const hslToHex = ({ h, s, l }: Hsl): string => {
  const hh = ((h % 360) + 360) % 360 / 360;
  const ss = Math.max(0, Math.min(1, s));
  const ll = Math.max(0, Math.min(1, l));
  if (ss === 0) {
    const v = ll * 255;
    return rgbToHex(v, v, v);
  }
  const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
  const p = 2 * ll - q;
  const channel = (t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  return rgbToHex(channel(hh + 1 / 3) * 255, channel(hh) * 255, channel(hh - 1 / 3) * 255);
};

/** Shift lightness by an absolute amount (-1..1), keeping hue and saturation. */
export const lighten = (hex: string, amount: number): string => {
  const c = hexToHsl(hex);
  return hslToHex({ ...c, l: Math.max(0, Math.min(1, c.l + amount)) });
};

export const saturate = (hex: string, amount: number): string => {
  const c = hexToHsl(hex);
  return hslToHex({ ...c, s: Math.max(0, Math.min(1, c.s + amount)) });
};

/** Blend two colours, 0 = a, 1 = b. */
export const mix = (a: string, b: string, t: number): string => {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
};

const channelLuminance = (v: number): number => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

export const relativeLuminance = (hex: string): number => {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
};

/** WCAG contrast ratio, 1 (identical) to 21 (black on white). */
export const contrast = (a: string, b: string): number => {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

export const isDark = (hex: string): boolean => relativeLuminance(hex) < 0.35;

/**
 * A three-step ramp for an actionable colour: the fill, a lighter hover, and a
 * darker border. Directions flip on a light skin so the border is always the
 * one that recedes.
 */
export const ramp = (base: string, onDark = true): { base: string; hi: string; edge: string } => ({
  base,
  hi: lighten(base, onDark ? 0.08 : 0.1),
  edge: lighten(base, onDark ? -0.12 : -0.18),
});

/** Simulate the three common colour-vision deficiencies (Brettel-style). */
export const simulateCvd = (hex: string, kind: 'deutan' | 'protan' | 'tritan'): string => {
  const [r, g, b] = hexToRgb(hex);
  const m = {
    deutan: [[0.625, 0.375, 0], [0.7, 0.3, 0], [0, 0.3, 0.7]],
    protan: [[0.567, 0.433, 0], [0.558, 0.442, 0], [0, 0.242, 0.758]],
    tritan: [[0.95, 0.05, 0], [0, 0.433, 0.567], [0, 0.475, 0.525]],
  }[kind];
  return rgbToHex(
    m[0][0] * r + m[0][1] * g + m[0][2] * b,
    m[1][0] * r + m[1][1] * g + m[1][2] * b,
    m[2][0] * r + m[2][1] * g + m[2][2] * b,
  );
};

/** Perceptual distance, adequate for "can these two be told apart?". */
export const distance = (a: string, b: string): number => {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const rm = (ar + br) / 2;
  return Math.sqrt(
    (2 + rm / 256) * (ar - br) ** 2 +
    4 * (ag - bg) ** 2 +
    (2 + (255 - rm) / 256) * (ab - bb) ** 2,
  );
};

/**
 * Push a fill away from a text colour until the label on it is readable.
 *
 * Action buttons carry a label, so their fill cannot be chosen for looks
 * alone. Rather than trusting forty palettes to have got this right by hand,
 * the skin builder runs every actionable colour through here — the property
 * then holds by construction, for skins that do not exist yet as much as for
 * the ones that do.
 */
export const ensureContrast = (fill: string, against: string, min: number): string => {
  if (contrast(fill, against) >= min) return fill;
  // Move away from the text: darker if the text is light, lighter if it is dark.
  const step = relativeLuminance(against) > 0.4 ? -0.02 : 0.02;
  let out = fill;
  for (let i = 0; i < 40; i++) {
    out = lighten(out, step);
    if (contrast(out, against) >= min) return out;
  }
  return out;
};
