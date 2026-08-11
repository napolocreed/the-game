import React, { useState } from 'react';
import { Quit } from '../types';
import { bestStreakDays, totalCleanDays, currentStreakDays } from '../utils/quits';
import PixelatedButton from './PixelatedButton';

interface RelapseModalProps {
  isOpen: boolean;
  quit: Quit | null;
  onClose: () => void;
  onConfirm: (quitId: string, note: string) => void;
}

// Compassion is the whole point here: a slip is data, not a verdict. Nothing
// permanent is lost (best streak and total clean days survive), and asking
// "what triggered it?" turns the moment into something useful.
const RelapseModal: React.FC<RelapseModalProps> = ({ isOpen, quit, onClose, onConfirm }) => {
  const [note, setNote] = useState('');

  if (!isOpen || !quit) return null;

  const best = Math.max(bestStreakDays(quit), currentStreakDays(quit));
  const total = totalCleanDays(quit);

  const handleClose = () => {
    setNote('');
    onClose();
  };

  const handleConfirm = () => {
    onConfirm(quit.id, note);
    setNote('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-[#4a3f36] border-4 border-[#8a6a4f] shadow-[8px_8px_0px_#1a1515] p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl text-[#f5b342] mb-4">The boss got a hit in.</h2>

        <p className="text-sm text-[#f0e9d6] leading-relaxed mb-4">
          That's all it is — a hit, not a defeat. Slips are part of almost every
          recovery that eventually works. You're still in the fight.
        </p>

        <div className="bg-[#2c2121] border-2 border-[#6a5340] p-3 mb-4 space-y-2">
          <p className="text-xs text-[#b0a08f]">What you keep, no matter what:</p>
          <div className="flex justify-between text-sm">
            <span className="text-[#b0a08f]">Best streak</span>
            <span className="text-green-400 font-bold">{best} day{best !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#b0a08f]">Total clean days</span>
            <span className="text-green-400 font-bold">{total} day{total !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#b0a08f]">Urges resisted</span>
            <span className="text-green-400 font-bold">{quit.urgesResisted}</span>
          </div>
        </div>

        <label className="block mb-2 text-sm uppercase text-[#b0a08f]">What triggered it? (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Stress, a place, a person, boredom... naming it helps you spot it next time."
          className="w-full p-2 bg-[#2c2121] border-2 border-[#8a6a4f] focus:outline-none focus:border-[#f5b342] text-sm placeholder:text-[#6a5340]"
        />

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
          <button onClick={handleClose} className="px-4 py-2 text-sm text-[#b0a08f] hover:text-white">
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
