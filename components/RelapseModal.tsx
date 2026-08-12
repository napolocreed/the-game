import React, { useState } from 'react';
import { Quit } from '../types';
import { bestStreakDays, totalCleanDays, currentStreakDays, TRIGGER_OPTIONS } from '../utils/quits';
import PixelatedButton from './PixelatedButton';

interface RelapseModalProps {
  isOpen: boolean;
  quit: Quit | null;
  onClose: () => void;
  onConfirm: (quitId: string, note: string, trigger?: string) => void;
}

// Compassion is the whole point here: a slip is data, not a verdict. Nothing
// permanent is lost (best streak and total clean days survive), and asking
// "what triggered it?" turns the moment into something useful.
const RelapseModal: React.FC<RelapseModalProps> = ({ isOpen, quit, onClose, onConfirm }) => {
  const [note, setNote] = useState('');
  const [trigger, setTrigger] = useState<string | null>(null);

  if (!isOpen || !quit) return null;

  const best = Math.max(bestStreakDays(quit), currentStreakDays(quit));
  const total = totalCleanDays(quit);

  const handleClose = () => {
    setNote('');
    setTrigger(null);
    onClose();
  };

  const handleConfirm = () => {
    onConfirm(quit.id, note, trigger || undefined);
    setNote('');
    setTrigger(null);
  };

  return (
    <div className="fixed inset-0 bg-scrim flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-surface border-4 border-frame shadow-hard p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl text-accent mb-4">The boss got a hit in.</h2>

        <p className="text-sm text-ink leading-relaxed mb-4">
          A hit, not a defeat. You're still in the fight.
        </p>

        <div className="bg-inset border-2 border-frame-dim p-3 mb-4 space-y-2">
          <p className="text-xs text-ink-dim">You keep:</p>
          <div className="flex justify-between text-sm">
            <span className="text-ink-dim">Best streak</span>
            <span className="text-good-soft font-bold">{best} day{best !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-dim">Total clean days</span>
            <span className="text-good-soft font-bold">{total} day{total !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-dim">Urges resisted</span>
            <span className="text-good-soft font-bold">{quit.urgesResisted}</span>
          </div>
        </div>

        <label className="block mb-2 text-sm uppercase text-ink-dim">What triggered it? (optional)</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {TRIGGER_OPTIONS.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTrigger(trigger === t ? null : t)}
              className={`px-2 py-1 text-xs border-2 transition-colors ${trigger === t
                ? 'bg-accent text-black border-accent'
                : 'bg-inset border-frame-dim text-ink-dim hover:border-frame'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Stress, a place, boredom..."
          className="w-full p-2 bg-inset border-2 border-frame focus:outline-none focus:border-accent text-sm placeholder:text-ink-faint"
        />

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
          <button onClick={handleClose} className="px-4 py-2 text-sm text-ink-dim hover:text-ink-hi">
            Cancel
          </button>
          <PixelatedButton onClick={handleConfirm} className="text-sm">
            Log it & restart the streak
          </PixelatedButton>
        </div>
      </div>
    </div>
  );
};

export default RelapseModal;
