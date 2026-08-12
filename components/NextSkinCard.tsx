import React from 'react';
import { Skin } from '../types';
import { previewStyle } from '../utils/skins';
import { UnlockContext, isUnlocked, nextUnlocks, unlockLabel, unlockProgress } from '../utils/skinUnlocks';

interface NextSkinCardProps {
  skins: Skin[];
  ctx: UnlockContext;
  onOpenGallery: () => void;
}

/**
 * What levelling up actually buys you, shown before you get there.
 *
 * The whole point of the skin ladder is that progress has something visible at
 * the end of it — which only works if you can see the next rung. Only skins
 * with measurable progress appear here: a feat you either did or didn't do has
 * no "how close am I", and pretending otherwise would be noise.
 */
const NextSkinCard: React.FC<NextSkinCardProps> = ({ skins, ctx, onOpenGallery }) => {
  const next = nextUnlocks(skins, ctx, 3);
  const unlocked = skins.filter(s => isUnlocked(s.unlock, ctx)).length;

  if (next.length === 0) return null;

  return (
    <div className="bg-surface border-4 border-frame shadow-hard-sm p-3 mb-4">
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <h3 className="text-sm text-accent">Next skins</h3>
        <button onClick={onOpenGallery} className="text-[10px] text-ink-dim hover:text-ink-hi underline shrink-0">
          see all {unlocked}/{skins.length}
        </button>
      </div>

      <div className="space-y-2">
        {next.map(skin => {
          const p = unlockProgress(skin.unlock, ctx) ?? 0;
          return (
            <div key={skin.id} className="flex items-center gap-2">
              <div
                style={previewStyle(skin)}
                aria-hidden="true"
                className="w-12 h-9 shrink-0 bg-canvas border-2 border-frame p-1 opacity-70"
              >
                <span className="block h-2 bg-surface border border-frame" />
                <span className="block h-1.5 mt-1 bg-good" />
                <span className="block h-1 mt-0.5 bg-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[11px] text-ink truncate">{skin.name}</p>
                  <p className="text-[10px] text-ink-faint shrink-0">{unlockLabel(skin.unlock)}</p>
                </div>
                <div className="w-full h-1.5 bg-inset-deep mt-1">
                  <div className="h-full bg-accent-dim" style={{ width: `${Math.round(p * 100)}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NextSkinCard;
