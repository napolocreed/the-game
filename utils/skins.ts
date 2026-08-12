import React from 'react';
import { Skin, SkinFxLayer, SkinMaterial, SkinRarity, SkinUnlock } from '../types';
import { CLASSIC, SkinTokens, TOKEN_KEYS, cssVar } from './theme';
import { contrast, ensureContrast, isDark, lighten, mix, ramp, saturate } from './color';
import { patina } from './patina';

/**
 * The compact form a skin is written in.
 *
 * Only what makes a skin ITSELF is declared; everything else is derived, so a
 * palette stays internally consistent — the border is always darker than its
 * fill, the hover always lighter, the faint ink always the one that recedes —
 * without an author having to remember thirty relationships forty times over.
 *
 * Anything derivation gets wrong for a particular skin can still be overridden
 * outright via `tokens`.
 */
export interface SkinSpec {
  id: string;
  name: string;
  blurb: string;
  rarity: SkinRarity;
  unlock: SkinUnlock;

  /** The page behind everything. Its darkness decides which way ramps go. */
  canvas: string;
  /** The card. */
  surface: string;
  /** The border that draws the pixel frame. */
  frame: string;
  /** The signature highlight. */
  accent: string;
  /** Body text. */
  ink: string;

  /** Optional character overrides. */
  raised?: string;
  inset?: string;
  shadow?: string;
  title?: string;
  good?: string;
  miss?: string;
  danger?: string;
  warn?: string;
  xp?: string;
  info?: string;
  categories?: [string, string, string, string];

  material?: SkinMaterial;
  livingId?: string;
  /** Escape hatch for anything derivation gets wrong. */
  tokens?: Partial<Record<keyof SkinTokens, string>>;
}

const DEFAULT_CATEGORIES: [string, string, string, string] = [
  CLASSIC.catHealth, CLASSIC.catWellness, CLASSIC.catProductivity, CLASSIC.catLifestyle,
];

/** Expand a spec into the full token set. */
export const buildSkin = (spec: SkinSpec): Skin => {
  const dark = isDark(spec.canvas);
  const sign = dark ? 1 : -1; // "brighter" means lighter on dark, darker on light

  const surface = spec.surface;
  const raised = spec.raised ?? lighten(surface, sign * 0.07);
  const inset = spec.inset ?? lighten(spec.canvas, sign * -0.02);
  const insetDeep = lighten(inset, sign * -0.04);
  const shadow = spec.shadow ?? lighten(spec.canvas, dark ? -0.07 : -0.35);

  const ink = spec.ink;
  const inkHi = lighten(ink, sign * 0.12);
  const inkSoft = mix(ink, surface, 0.18);
  const inkDim = mix(ink, surface, 0.38);
  const inkFaint = mix(ink, surface, 0.58);

  // Action fills carry a label, so they are not free to be chosen for looks
  // alone. Nudging them here makes "the button text is readable" true by
  // construction for every skin, including ones not written yet.
  const LABEL_MIN = 3.2;
  const onFill = (c: string) => ensureContrast(c, inkHi, LABEL_MIN);
  const good = ramp(onFill(spec.good ?? '#15803d'), dark);
  const miss = ramp(onFill(spec.miss ?? '#9a3412'), dark);
  const danger = ramp(onFill(spec.danger ?? '#991b1b'), dark);
  const cats = spec.categories ?? DEFAULT_CATEGORIES;

  // The frame's job is to delimit a card. It only has to be visible against
  // ONE of the two things it sits between — but against neither, the pixel
  // look collapses into a flat field.
  const frame = contrast(spec.frame, spec.canvas) >= 2.4 || contrast(spec.frame, surface) >= 2.4
    ? spec.frame
    : ensureContrast(spec.frame, spec.canvas, 2.4);

  const tokens: Record<string, string> = {
    canvas: spec.canvas,
    surface,
    raised,
    inset,
    insetDeep,

    frame,
    frameDim: lighten(frame, sign * -0.1),
    shadow,

    inkHi,
    ink,
    inkSoft,
    inkDim,
    inkFaint,

    accent: spec.accent,
    accentDim: lighten(spec.accent, sign * -0.12),
    title: spec.title ?? spec.accent,

    good: good.base,
    goodHi: good.hi,
    goodEdge: good.edge,
    goodSoft: saturate(lighten(good.base, dark ? 0.12 : 0.0), -0.1),
    miss: miss.base,
    missHi: miss.hi,
    missEdge: miss.edge,
    danger: danger.base,
    dangerHi: danger.hi,
    dangerEdge: danger.edge,
    warn: spec.warn ?? lighten(spec.accent, dark ? 0.12 : -0.1),
    xp: spec.xp ?? CLASSIC.xp,
    info: spec.info ?? CLASSIC.info,
    neutral: mix(ink, surface, 0.5),
    notice: mix(spec.canvas, spec.accent, dark ? 0.18 : 0.3),
    noticeEdge: mix(frame, spec.accent, 0.5),

    // The mood scale stays diverging: two hues meeting at the skin's own
    // neutral, so it reads as one ordered axis in every palette.
    moodWorst: danger.base,
    moodBad: mix(danger.base, mix(ink, surface, 0.5), 0.45),
    moodMid: mix(ink, surface, 0.5),
    moodGood: mix(good.base, mix(ink, surface, 0.5), 0.45),
    moodBest: good.base,

    catHealth: cats[0],
    catWellness: cats[1],
    catProductivity: cats[2],
    catLifestyle: cats[3],
    catHealthSh: lighten(cats[0], -0.22),
    catWellnessSh: lighten(cats[1], -0.22),
    catProductivitySh: lighten(cats[2], -0.22),
    catLifestyleSh: lighten(cats[3], -0.22),

    scrim: dark ? 'rgba(0,0,0,0.75)' : 'rgba(20,16,14,0.6)',
    ...(spec.tokens ?? {}),
  };

  return {
    id: spec.id,
    name: spec.name,
    blurb: spec.blurb,
    rarity: spec.rarity,
    unlock: spec.unlock,
    tokens,
    material: spec.material,
    livingId: spec.livingId,
  };
};

/** Merge a skin's overrides onto Classic and return a complete token set. */
export const resolveTokens = (skin: Skin | null): SkinTokens => {
  const out: SkinTokens = { ...CLASSIC };
  if (skin) for (const k of TOKEN_KEYS) {
    const override = skin.tokens[k];
    if (override) out[k] = override;
  }
  return out;
};

/**
 * Apply a skin to the document: colours first, then its material.
 *
 * `stage` is how far a living skin has aged (0..1) and is ignored by every
 * other skin. It is passed in rather than read here so this stays a pure
 * function of its arguments — the same age always paints the same screen.
 */
export const applySkin = (skin: Skin | null, root: HTMLElement, stage = 0): void => {
  const tokens = resolveTokens(skin);
  for (const k of TOKEN_KEYS) root.style.setProperty(cssVar(k), tokens[k]);

  const m = skin?.livingId ? patina(skin.livingId, stage, skin.material) : skin?.material;
  root.style.setProperty('--shadow-far', m?.shadowFar ?? '8px 8px 0px');
  root.style.setProperty('--shadow-near', m?.shadowNear ?? '4px 4px 0px');
  root.style.setProperty('--border-w', `${m?.borderWidth ?? 4}px`);
  root.style.setProperty('--texture', m?.texture ?? 'none');
  root.style.setProperty('--overlay', m?.overlay ?? 'none');
  root.style.setProperty('--glow', m?.glow ?? 'none');
  applyFxLayer(root, 'a', m?.fx?.a);
  applyFxLayer(root, 'b', m?.fx?.b);
  root.dataset.skin = skin?.id ?? 'classic';
};

/**
 * One animated weather layer.
 *
 * The layer travels exactly one tile per cycle, which is why the tile size is
 * published as a custom property: the keyframes translate by `var(--tile)`, so
 * the loop closes on itself and the seam is never visible.
 */
const applyFxLayer = (root: HTMLElement, slot: 'a' | 'b', layer?: SkinFxLayer): void => {
  root.style.setProperty(`--fx-${slot}-img`, layer?.image ?? 'none');
  root.style.setProperty(`--fx-${slot}-tile`, `${layer?.tile ?? 0}px`);
  root.style.setProperty(`--fx-${slot}-dur`, `${layer?.duration ?? 0}s`);
  root.style.setProperty(`--fx-${slot}-anim`, layer ? `fx-${layer.motion}` : 'none');
};

/** Inline style object for a preview swatch, no document mutation. */
export const previewStyle = (skin: Skin, stage = 1): React.CSSProperties => {
  const tokens = resolveTokens(skin);
  const style: Record<string, string> = {};
  for (const k of TOKEN_KEYS) style[cssVar(k)] = tokens[k];
  // Material too, so a preview sells the surface and not just the palette —
  // and so a stone skin's swatch is not framed in the border weight of
  // whatever skin happens to be worn right now.
  const m = skin.livingId ? patina(skin.livingId, stage, skin.material) : skin.material;
  style['--shadow-far'] = m?.shadowFar ?? '8px 8px 0px';
  style['--shadow-near'] = m?.shadowNear ?? '4px 4px 0px';
  style['--border-w'] = `${m?.borderWidth ?? 4}px`;
  style['--texture'] = m?.texture ?? 'none';
  // A still frame of the skin's weather, so the gallery can show that this one
  // moves without every tile having to animate.
  style['--fx-still'] = m?.fx?.a.image ?? 'none';
  return style as React.CSSProperties;
};
