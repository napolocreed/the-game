import React, { useState } from 'react';
import { Quit } from '../types';
import { currentStreakDays, currentStreakHours, bestStreakDays, totalCleanDays, moneySaved, nextMilestone, previousMilestoneDays, topTriggers } from '../utils/quits';
import PixelatedButton from './PixelatedButton';
import ProgressBar from './ProgressBar';
import { ArchiveIcon } from './icons/ArchiveIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { format } from 'date-fns';

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
  const [showLog, setShowLog] = useState(false);
  const days = currentStreakDays(quit);
  const hours = currentStreakHours(quit);
  const best = bestStreakDays(quit);
  const total = totalCleanDays(quit);
  const saved = moneySaved(quit);
  const next = nextMilestone(quit);
  const prevMilestone = previousMilestoneDays(quit);

  const goal = quit.savingsGoal;
  const goalReached = goal && saved !== null && saved >= goal.price;
  const quitTriggers = topTriggers([quit], 1);
  const hasLogContent = quit.relapses.length > 0 || quitTriggers.length > 0;

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

      {goal && saved !== null && (
        <div className="bg-[#2c2121] border-2 border-[#6a5340] p-3 mb-4">
          {goalReached ? (
            <p className="text-sm text-center text-[#f5b342]">
              🎁 <span className="font-bold">{goal.name}</span> is paid for! Treat yourself — you've earned it.
            </p>
          ) : (
            <>
              <div className="flex justify-between text-xs text-[#b0a08f] mb-2">
                <span>🎁 Saving for: <span className="text-[#f0e9d6]">{goal.name}</span></span>
                <span>{saved.toLocaleString()} / {goal.price.toLocaleString()}€</span>
              </div>
              <div className="w-full h-3 bg-[#4a3f36] border border-[#6a5340]">
                <div
                  className="h-full bg-gradient-to-r from-green-600 to-green-400"
                  style={{ width: `${Math.min(100, (saved / goal.price) * 100)}%` }}
                />
              </div>
            </>
          )}
        </div>
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

      {hasLogContent && (
        <div className="mt-4 pt-3 border-t-2 border-[#6a5340]">
          <button
            onClick={() => setShowLog(s => !s)}
            className="w-full text-left text-xs text-[#b0a08f] hover:text-white flex justify-between items-center"
          >
            <span>📜 Battle log</span>
            <ChevronDownIcon className={`w-4 h-4 shrink-0 ${showLog ? 'scale-y-[-1]' : ''}`} />
          </button>
          {showLog && (
            <div className="mt-3 space-y-2">
              {quitTriggers.length > 0 && (
                <p className="text-xs text-amber-300">
                  ⚡ Your #1 trigger: <span className="font-bold">{quitTriggers[0].trigger}</span> ({quitTriggers[0].count}×) — plan for it.
                </p>
              )}
              {quit.relapses.length > 0 && (
                <ul className="space-y-1.5">
                  {[...quit.relapses].reverse().slice(0, 5).map((relapse, i) => (
                    <li key={i} className="text-xs text-[#b0a08f] bg-[#2c2121] border border-[#6a5340] p-2">
                      <span className="text-red-400">💥 {format(new Date(relapse.date), 'MMM d, yyyy')}</span>
                      {relapse.trigger && <span className="ml-2 text-amber-300">[{relapse.trigger}]</span>}
                      {relapse.note && <p className="mt-1 italic">"{relapse.note}"</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuitCard;
