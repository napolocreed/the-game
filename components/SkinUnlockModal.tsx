import React, { useMemo, useState } from 'react';
import { Skin } from '../types';
import { previewStyle } from '../utils/skins';
import { RARITY_ORDER } from '../utils/skinCatalog';
import { unlockLabel } from '../utils/skinUnlocks';
import PixelatedButton from './PixelatedButton';

interface SkinUnlockModalProps {
  skins: Skin[];
  activeSkinId: string;
  onWear: (id: string) => void;
  onClose: () => void;
}

/**
 * The moment a skin is earned.
 *
 * Shown in the new skin's own colours, because the reward IS the look —
 * describing it in the old palette would undersell the only thing the player
 * just won.
 *
 * One panel, never a queue. Several skins can land at once (a big level jump,
 * a restored backup), and six modals in a row turns a reward into a chore: the
 * rarest one headlines, the rest sit under it as a strip you can tap to bring
 * forward. Dismissing acknowledges all of them — they are already yours.
 */
const SkinUnlockModal: React.FC<SkinUnlockModalProps> = ({ skins, activeSkinId, onWear, onClose }) => {
  // Rarest first, so the headline is the one worth celebrating.
  const ordered = useMemo(
    () => [...skins].sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity]),
    [skins],
  );
  const [pickId, setPickId] = useState<string | null>(null);
  if (ordered.length === 0) return null;

  const skin = ordered.find(s => s.id === pickId) ?? ordered[0];
  const worn = skin.id === activeSkinId;

  return (
    <div className="fixed inset-0 bg-scrim flex items-center justify-center p-4 z-50">
      {/* The panel carries the NEW skin's tokens, so every swatch, border and
          shadow inside it is the actual thing being unlocked. */}
      <div
        style={previewStyle(skin)}
        className="w-full max-w-sm bg-surface border-4 border-frame shadow-hard p-4 pm:p-5 text-center"
      >
        <p className="text-[10px] text-ink-dim uppercase tracking-wider">
          {ordered.length > 1 ? `${ordered.length} new skins` : 'New skin'}
        </p>
        <h2 className="text-lg pm:text-2xl text-accent mt-1 break-words">{skin.name}</h2>
        <p className="text-[10px] text-ink-faint mt-1">{unlockLabel(skin.unlock)}</p>

        <div className="bg-canvas border-2 border-frame p-3 my-4">
          <div className="bg-surface border-2 border-frame p-2 shadow-hard-xs text-left">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-cat-health shrink-0" />
              <span className="flex-1 h-2 bg-ink" />
              <span className="w-3 h-3 bg-accent shrink-0" />
            </div>
            <div className="flex gap-1.5 mt-2">
              <span className="flex-[3] h-5 bg-good border-2 border-good-edge" />
              <span className="flex-1 h-5 bg-miss border-2 border-miss-edge" />
            </div>
          </div>
          <div className="flex gap-1 mt-2">
            <span className="flex-1 h-2 bg-cat-wellness" />
            <span className="flex-1 h-2 bg-cat-productivity" />
            <span className="flex-1 h-2 bg-cat-lifestyle" />
            <span className="flex-1 h-2 bg-accent-dim" />
          </div>
        </div>

        <p className="text-xs text-ink-soft break-words">{skin.blurb}</p>

        {ordered.length > 1 && (
          <div className="flex flex-wrap justify-center gap-1.5 mt-4">
            {ordered.map(s => (
              <button
                key={s.id}
                onClick={() => setPickId(s.id)}
                aria-label={s.name}
                aria-pressed={s.id === skin.id}
                style={previewStyle(s)}
                className={`w-9 h-7 bg-canvas border-2 p-0.5 ${
                  s.id === skin.id ? 'border-accent' : 'border-frame-dim'
                }`}
              >
                <span className="block h-1.5 bg-surface" />
                <span className="block h-1 mt-0.5 bg-good" />
                <span className="block h-1 mt-0.5 bg-accent" />
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 text-xs text-ink-dim border-2 border-dashed border-frame-dim hover:text-ink-hi"
          >
            Later
          </button>
          <PixelatedButton
            onClick={() => { onWear(skin.id); onClose(); }}
            disabled={worn}
            className="flex-1 text-xs"
          >
            {worn ? 'Worn' : 'Wear it'}
          </PixelatedButton>
        </div>
      </div>
    </div>
  );
};

export default SkinUnlockModal;
