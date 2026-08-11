import React, { useEffect, useState } from 'react';
import { Quit } from '../types';
import { TRIGGER_OPTIONS } from '../utils/quits';
import PixelatedButton from './PixelatedButton';

interface UrgeModalProps {
  isOpen: boolean;
  quit: Quit | null;
  onClose: () => void;
  onResisted: (quitId: string) => number; // returns XP granted
  onTagTrigger: (quitId: string, trigger: string) => void;
}

const RIDE_SECONDS = 90;
const BREATH_CYCLE = 12; // 4s in, 4s hold, 4s out

// "Urge surfing": cravings rise, peak and pass like a wave — usually within
// minutes. This modal helps ride one out with box breathing instead of acting
// on it. The exit button is never locked: someone in a hard moment should
// never feel trapped by their own tool.
const UrgeModal: React.FC<UrgeModalProps> = ({ isOpen, quit, onClose, onResisted, onTagTrigger }) => {
  const [secondsLeft, setSecondsLeft] = useState(RIDE_SECONDS);
  const [xpGained, setXpGained] = useState<number | null>(null);
  const [taggedTrigger, setTaggedTrigger] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(RIDE_SECONDS);
      setXpGained(null);
      setTaggedTrigger(null);
      return;
    }
    const id = window.setInterval(() => {
      setSecondsLeft(s => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [isOpen]);

  if (!isOpen || !quit) return null;

  const elapsed = RIDE_SECONDS - secondsLeft;
  const phase = elapsed % BREATH_CYCLE;
  const breathText = phase < 4 ? 'Breathe in...' : phase < 8 ? 'Hold...' : 'Breathe out...';
  const breathScale = phase < 4 ? 1 + (phase + 1) * 0.09 : phase < 8 ? 1.36 : 1.36 - (phase - 7) * 0.09;

  const handleResisted = () => {
    const xp = onResisted(quit.id);
    setXpGained(xp);
  };

  const handleTag = (trigger: string) => {
    setTaggedTrigger(trigger);
    onTagTrigger(quit.id, trigger);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-[#4a3f36] border-4 border-[#8a6a4f] shadow-[8px_8px_0px_#1a1515] p-6 text-center max-h-[95vh] overflow-y-auto">
        {xpGained === null ? (
          <>
            <h2 className="text-xl text-[#f5b342] mb-2">🌊 Ride the Wave</h2>
            <p className="text-xs text-[#b0a08f] leading-relaxed mb-4">
              An urge is a wave: it rises, peaks, and always passes.
              You don't have to fight it — just don't feed it. Breathe with the box.
            </p>

            {quit.motivation && (
              <div className="bg-[#2c2121] border-l-4 border-[#f5b342] p-3 mb-4 text-left">
                <p className="text-[10px] text-[#b0a08f] uppercase mb-1">Remember why you started:</p>
                <p className="text-sm text-[#f5b342] italic">"{quit.motivation}"</p>
              </div>
            )}

            <div className="flex items-center justify-center h-36 mb-4">
              <div
                className="w-20 h-20 bg-green-800 border-4 border-green-500 transition-transform duration-1000 ease-in-out flex items-center justify-center"
                style={{ transform: `scale(${breathScale})` }}
              >
                <span className="text-2xl">🧘</span>
              </div>
            </div>
            <p className="text-sm text-green-300 mb-4 h-5">{breathText}</p>

            <p className="text-3xl text-white mb-6">
              {secondsLeft > 0
                ? `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`
                : 'You rode it out. 🏄'}
            </p>

            <div className="flex flex-col gap-3">
              <PixelatedButton onClick={handleResisted} className="bg-green-800 border-green-900 hover:bg-green-700">
                💪 The urge passed — I resisted
              </PixelatedButton>
              <button onClick={onClose} className="text-xs text-[#b0a08f] hover:text-white p-2">
                Close (it still counts that you paused)
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl text-green-400 mb-4">Victory! 💪</h2>
            <p className="text-sm text-[#f0e9d6] mb-2">
              You just beat an urge against <span className="text-[#f5b342]">{quit.name}</span>.
            </p>
            <p className="text-xs text-[#b0a08f] mb-4">
              {xpGained > 0
                ? 'Every urge you resist makes the next one weaker.'
                : "XP cap reached for today — but this one still counts, and it's the ones no reward sees that matter most."}
            </p>
            {xpGained > 0 && <p className="text-3xl text-[#f5b342] mb-4">+{xpGained} XP</p>}

            <div className="mb-5">
              <p className="text-xs text-[#b0a08f] uppercase mb-2">What triggered it? (optional — helps you spot patterns)</p>
              <div className="flex flex-wrap justify-center gap-2">
                {TRIGGER_OPTIONS.map(trigger => (
                  <button
                    key={trigger}
                    type="button"
                    onClick={() => handleTag(trigger)}
                    className={`px-2 py-1 text-xs border-2 transition-colors ${taggedTrigger === trigger
                      ? 'bg-[#f5b342] text-black border-[#f5b342]'
                      : 'bg-[#2c2121] border-[#6a5340] text-[#b0a08f] hover:border-[#8a6a4f]'}`}
                  >
                    {trigger}
                  </button>
                ))}
              </div>
            </div>

            <PixelatedButton onClick={onClose}>Continue</PixelatedButton>
          </>
        )}
      </div>
    </div>
  );
};

export default UrgeModal;
