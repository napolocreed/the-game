import React, { useMemo, useState } from 'react';
import { Skin, SkinRarity } from '../types';
import { previewStyle } from '../utils/skins';
import { RARITY_ORDER } from '../utils/skinCatalog';
import { UnlockContext, isUnlocked, unlockLabel, unlockProgress } from '../utils/skinUnlocks';
import { CheckIcon } from './icons/CheckIcon';
import { HourglassIcon } from './icons/TaskIcons';
import { CrownIcon } from './icons/CrownIcon';
import { LevelUpIcon } from './icons/LevelUpIcon';
import { TrophyIcon } from './icons/TrophyIcon';

interface SkinGalleryProps {
  skins: Skin[];
  activeSkinId: string;
  ctx: UnlockContext;
  onSelect: (id: string) => void;
  /** Workshop mode: locked tiles become tappable and preview instead of wear. */
  previewId?: string | null;
  onPreview?: (id: string) => void;
}

const RARITY_LABEL: Record<SkinRarity, string> = {
  common: 'Common', rare: 'Rare', epic: 'Epic', legend: 'Legend',
};

// Rarity is the only signal of what a skin cost to reach, so it gets colour
// rather than being four identical grey words.
const RARITY_INK: Record<SkinRarity, string> = {
  common: 'text-ink-faint', rare: 'text-info', epic: 'text-accent-dim', legend: 'text-accent',
};

/** Which icon signals how a skin is earned — the three routes read differently. */
const UnlockIcon: React.FC<{ kind: string; className?: string }> = ({ kind, className }) => {
  if (kind === 'seniority') return <HourglassIcon className={className} />;
  if (kind === 'feat') return <TrophyIcon className={className} />;
  if (kind === 'badge') return <CrownIcon className={className} />;
  return <LevelUpIcon className={className} />;
};

/**
 * A live miniature of the skin, built from its own tokens.
 *
 * Painted with the real components' classes rather than a hand-drawn swatch
 * row, so what you see is genuinely what the app becomes — a palette strip can
 * look lovely while the actual screen is unreadable.
 */
const SkinPreview: React.FC<{ skin: Skin; locked: boolean }> = ({ skin, locked }) => (
  <div
    style={previewStyle(skin)}
    // Locked skins are dimmed, not hidden: the thing you are working toward has
    // to be visible enough to want. Only the label says "locked".
    className={`skin-texture skin-still relative bg-canvas border-2 border-frame p-1.5 ${
      locked ? 'opacity-70' : ''
    }`}
    aria-hidden="true"
  >
    <div className="bg-surface border-2 border-frame p-1 shadow-hard-xs">
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 bg-cat-health" />
        <span className="flex-1 h-1.5 bg-ink" />
        <span className="w-1.5 h-1.5 bg-accent" />
      </div>
      <div className="flex gap-1 mt-1">
        <span className="flex-[3] h-2 bg-good" />
        <span className="flex-1 h-2 bg-miss" />
      </div>
    </div>
    <div className="flex gap-0.5 mt-1">
      <span className="flex-1 h-1 bg-cat-wellness" />
      <span className="flex-1 h-1 bg-cat-productivity" />
      <span className="flex-1 h-1 bg-cat-lifestyle" />
      <span className="flex-1 h-1 bg-accent-dim" />
    </div>
  </div>
);

const SkinGallery: React.FC<SkinGalleryProps> = ({ skins, activeSkinId, ctx, onSelect, previewId, onPreview }) => {
  const [showLocked, setShowLocked] = useState(true);

  const rows = useMemo(() => {
    const decorated = skins.map(skin => ({
      skin,
      unlocked: isUnlocked(skin.unlock, ctx),
      progress: unlockProgress(skin.unlock, ctx),
    }));
    // Unlocked first, then the ones you are closest to — so the list itself
    // answers "what is next" without needing to be read.
    return decorated.sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
      if (a.unlocked) return RARITY_ORDER[a.skin.rarity] - RARITY_ORDER[b.skin.rarity];
      return (b.progress ?? -1) - (a.progress ?? -1);
    });
  }, [skins, ctx]);

  const unlockedCount = rows.filter(r => r.unlocked).length;
  const visible = showLocked ? rows : rows.filter(r => r.unlocked);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <p className="text-xs text-ink-dim">{unlockedCount}/{skins.length} unlocked</p>
        <button
          onClick={() => setShowLocked(s => !s)}
          className="text-[10px] text-ink-dim hover:text-ink-hi underline shrink-0"
        >
          {showLocked ? 'hide locked' : 'show all'}
        </button>
      </div>

      <div data-testid="skin-grid" className="grid grid-cols-2 pm:grid-cols-3 gap-2">
        {visible.map(({ skin, unlocked, progress }) => {
          // In workshop mode a locked tile previews rather than wears, so the
          // ladder still means something: nothing here grants a skin.
          const tappable = unlocked || !!onPreview;
          const active = previewId ? skin.id === previewId : skin.id === activeSkinId;
          return (
            <button
              key={skin.id}
              onClick={() => {
                if (unlocked && !onPreview) onSelect(skin.id);
                else if (onPreview) onPreview(skin.id);
              }}
              disabled={!tappable}
              aria-pressed={active}
              title={unlocked ? skin.blurb : `${skin.name} — ${unlockLabel(skin.unlock)}`}
              className={`text-left p-1 border-2 transition-colors ${
                active ? 'border-accent bg-raised' : 'border-frame-dim bg-inset'
              } ${tappable ? 'hover:bg-raised cursor-pointer' : 'cursor-not-allowed'}`}
            >
              <div className="relative">
                <SkinPreview skin={skin} locked={!unlocked} />
                {active && (
                  <span className="absolute -top-1 -right-1 bg-accent border-2 border-frame p-px">
                    <CheckIcon className="w-2.5 h-2.5 text-canvas" />
                  </span>
                )}
              </div>

              {/* Wraps, never truncates: the name IS the skin. A tile three to a
                  row is too narrow for "Dusk Harbour" on one line, and
                  "Dusk Ha…" is not a thing anyone can want. 9px because the
                  pixel font advances exactly 1em, so the longest single word in
                  the catalogue (9 characters) has to fit inside the tile. */}
              <p
                className={`text-[9px] leading-tight mt-1.5 min-h-[1.7em] break-words ${
                  unlocked ? 'text-ink' : 'text-ink-faint'
                }`}
              >
                {skin.name}
              </p>

              {unlocked ? (
                <p className={`text-[8px] leading-tight ${RARITY_INK[skin.rarity]}`}>
                  {RARITY_LABEL[skin.rarity]}
                </p>
              ) : (
                <div className="flex items-start gap-1">
                  <UnlockIcon kind={skin.unlock.kind} className="w-2.5 h-2.5 mt-px text-ink-faint shrink-0" />
                  <p className="text-[8px] leading-tight text-ink-faint break-words">
                    {unlockLabel(skin.unlock)}
                  </p>
                </div>
              )}

              {/* Only drawn where progress is genuinely measurable. A feat is
                  binary; a bar that jumps 0 to 100 lies about how close you were. */}
              {!unlocked && progress !== null && (
                <div className="w-full h-1 bg-inset-deep mt-1">
                  <div className="h-full bg-accent-dim" style={{ width: `${Math.round(progress * 100)}%` }} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SkinGallery;
