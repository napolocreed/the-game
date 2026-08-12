import React from 'react';
import { Skin } from '../types';
import { SkinPreview } from '../hooks/useSkinPreview';
import PixelatedButton from './PixelatedButton';

interface SkinWorkshopProps {
  skins: Skin[];
  preview: SkinPreview;
  realSeniorityDays: number;
}

/** Ages worth looking at: the four seniority thresholds and the far end. */
const AGE_STOPS = [0, 30, 90, 182, 365, 730, 1095, 1460, 1825];

const label = (days: number): string =>
  days >= 365 ? `${Math.round(days / 365)}y` : `${days}d`;

/**
 * The preview workshop.
 *
 * Hidden behind a gesture because it is not part of the game: being able to
 * wear a skin you have not earned would empty the only thing the ladder is
 * for. It exists so the person building the catalogue can see all of it.
 *
 * Nothing here writes to the save. The preview is held in sessionStorage and
 * the real worn skin is untouched underneath — pressing stop restores it
 * exactly.
 */
const SkinWorkshop: React.FC<SkinWorkshopProps> = ({ skins, preview, realSeniorityDays }) => {
  const previewing = skins.find(s => s.id === preview.previewSkinId) ?? null;
  const age = preview.previewAgeDays ?? realSeniorityDays;

  return (
    <div className="bg-inset border-2 border-dashed border-frame-dim p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="text-xs text-warn">Workshop</h4>
        <button
          onClick={preview.disableDevMode}
          className="text-[10px] text-ink-faint hover:text-ink-hi underline shrink-0"
        >
          hide
        </button>
      </div>
      <p className="text-[10px] text-ink-faint mt-1 leading-relaxed">
        Tap any skin, earned or not. Nothing is saved.
      </p>

      <div className="flex items-center gap-2 mt-3">
        <p className="flex-1 min-w-0 text-[11px] text-ink break-words">
          {previewing ? previewing.name : 'Nothing previewed'}
        </p>
        {previewing && (
          <PixelatedButton
            onClick={() => { preview.setPreviewSkinId(null); preview.setPreviewAgeDays(null); }}
            className="text-[10px] px-2 py-1 shrink-0"
          >
            Stop
          </PixelatedButton>
        )}
      </div>

      {/* One age control for every living skin: the tester should not have to
          know each one's threshold to answer "what does two years look like?" */}
      <div className="mt-3">
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor="workshop-age" className="text-[10px] uppercase text-ink-dim">Account age</label>
          <p className="text-[10px] text-ink">
            {label(age)}
            {preview.previewAgeDays === null && <span className="text-ink-faint"> (real)</span>}
          </p>
        </div>
        <input
          id="workshop-age"
          type="range"
          min={0}
          max={AGE_STOPS.length - 1}
          step={1}
          value={Math.max(0, AGE_STOPS.findIndex(d => d >= age))}
          onChange={e => preview.setPreviewAgeDays(AGE_STOPS[Number(e.target.value)])}
          className="w-full mt-1 accent-accent"
        />
        <div className="flex justify-between">
          {AGE_STOPS.map(d => (
            <span key={d} className="text-[8px] text-ink-faint">{label(d)}</span>
          ))}
        </div>
        {preview.previewAgeDays !== null && (
          <button
            onClick={() => preview.setPreviewAgeDays(null)}
            className="text-[10px] text-ink-faint hover:text-ink-hi underline mt-1"
          >
            back to the real age
          </button>
        )}
      </div>
    </div>
  );
};

export default SkinWorkshop;
