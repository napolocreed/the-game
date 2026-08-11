import React from 'react';
import { Quit } from '../types';
import { currentStreakDays, currentStreakHours, bestStreakDays, totalCleanDays, moneySaved, nextMilestone, previousMilestoneDays } from '../utils/quits';
import PixelatedButton from './PixelatedButton';
import ProgressBar from './ProgressBar';
import { ArchiveIcon } from './icons/ArchiveIcon';
import { TrashIcon } from './icons/TrashIcon';

interface QuitCardProps {
  quit: Quit;
  onResistUrge: (quit: Quit) => void;
  onRelapse: (quit: Quit) => void;
  onArchive: (quitId: string) => void;
  onDelete: (quit: Quit) => void;
}

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-[#2c2121] border-2 border-[#6a5340] p-2 text-center">
    <p className="text-base sm:text-lg text-white font-bold break-words">{value}</p>
    <p className="text-[10px] text-[#b0a08f] uppercase mt-1">{label}</p>
  </div>
);

const QuitCard: React.FC<QuitCardProps> = ({ quit, onResistUrge, onRelapse, onArchive, onDelete }) => {
  const days = currentStreakDays(quit);
  const hours = currentStreakHours(quit);
  const best = bestStreakDays(quit);
  const total = totalCleanDays(quit);
  const saved = moneySaved(quit);
  const next = nextMilestone(quit);
  const prevMilestone = previousMilestoneDays(quit);

  return (
    <div className="bg-[#4a3f36] border-4 border-[#8a6a4f] shadow-[8px_8px_0px_#1a1515] p-4 sm:p-6">
      <div className="flex justify-between items-start gap-2">
        <div>
          <p className="text-xs text-red-400 uppercase">Boss Fight</p>
          <h3 className="text-xl sm:text-2xl text-[#f5b342] mt-1 break-words">{quit.name}</h3>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => onArchive(quit.id)} title="Pause this fight" className="p-1.5 hover:bg-[#6a5340]">
            <ArchiveIcon className="w-5 h-5 text-[#b0a08f]" />
          </button>
          <button onClick={() => onDelete(quit)} title="Delete permanently" className="p-1.5 hover:bg-[#6a5340]">
            <TrashIcon className="w-5 h-5 text-red-500" />
          </button>
        </div>
      </div>

      <div className="text-center my-5">
        {days >= 1 ? (
          <>
            <p className="text-4xl sm:text-5xl text-green-400 font-bold">{days}</p>
            <p className="text-sm text-[#b0a08f] uppercase mt-2">day{days > 1 ? 's' : ''} clean</p>
          </>
        ) : (
          <>
            <p className="text-4xl sm:text-5xl text-green-400 font-bold">{hours}</p>
            <p className="text-sm text-[#b0a08f] uppercase mt-2">hour{hours !== 1 ? 's' : ''} clean</p>
          </>
        )}
      </div>

      {next && (
        <div className="mb-4">
          <ProgressBar
            value={Math.max(0, days - prevMilestone)}
            max={next.days - prevMilestone}
            label={`Next milestone: ${next.label} (+${next.xp} XP)`}
          />
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Stat label="Best streak" value={`${best}d`} />
        <Stat label="Clean days total" value={`${total}d`} />
        {saved !== null
          ? <Stat label="Money saved" value={`${saved.toLocaleString()}€`} />
          : <Stat label="Urges resisted" value={`${quit.urgesResisted}`} />}
      </div>
      {saved !== null && quit.urgesResisted > 0 && (
        <p className="text-xs text-[#b0a08f] mb-4 text-center">💪 {quit.urgesResisted} urge{quit.urgesResisted > 1 ? 's' : ''} resisted</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <PixelatedButton onClick={() => onResistUrge(quit)} className="flex-1 text-sm bg-green-800 border-green-900 hover:bg-green-700">
          🌊 I have an urge
        </PixelatedButton>
        <button
          onClick={() => onRelapse(quit)}
          className="flex-1 px-4 py-2 text-sm text-[#b0a08f] border-2 border-dashed border-[#6a5340] hover:text-red-300 hover:border-red-900"
        >
          I slipped...
        </button>
      </div>
    </div>
  );
};

export default QuitCard;
