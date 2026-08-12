import React, { useMemo } from 'react';
import { Completion, CompletionStatus, Habit } from '../types';
import { isSameDay, format } from 'date-fns';
import { CheckIcon } from './icons/CheckIcon';
import { CoinIcon } from './icons/CoinIcon';

interface DailyProgressBannerProps {
  habits: Habit[];
  completions: Completion[];
  viewingDate: Date;
}

// The Progress tab knows the completion rate; the screen you actually act on
// did not. This puts the day's rate where the decisions happen — one segment
// per scheduled habit, so "2 left" is a thing you can see, not compute.
//
// It deliberately mirrors HabitList's own day filter rather than the analytics
// engine's: the numbers here must agree with the cards directly beneath them.

const SEGMENT_LIMIT = 16;

const DailyProgressBanner: React.FC<DailyProgressBannerProps> = ({ habits, completions, viewingDate }) => {
  const day = useMemo(() => {
    const scheduled = habits.filter(h => h.scheduleDays?.includes(viewingDate.getDay()));
    const statuses = scheduled.map(h => {
      const log = completions.find(c => c.habitId === h.id && isSameDay(new Date(c.date), viewingDate));
      return log ? log.status : null;
    });
    const xp = completions
      .filter(c => isSameDay(new Date(c.date), viewingDate))
      .reduce((sum, c) => sum + (c.xpGained ?? 0), 0);

    return {
      statuses,
      total: scheduled.length,
      done: statuses.filter(s => s === CompletionStatus.COMPLETED).length,
      missed: statuses.filter(s => s === CompletionStatus.FAILED).length,
      pending: statuses.filter(s => s === null).length,
      xp,
    };
  }, [habits, completions, viewingDate]);

  if (day.total === 0) {
    return null;
  }

  const isToday = isSameDay(viewingDate, new Date());
  const pct = Math.round((day.done / day.total) * 100);

  const message = (): string => {
    if (day.done === day.total) return 'Perfect day. Every promise kept.';
    if (day.pending === 0) return 'Day logged. Tomorrow is a fresh board.';
    if (day.done === 0) return isToday ? 'Nothing logged yet. Start with the easiest one.' : 'Nothing was logged this day.';
    if (day.pending === 1) return isToday ? 'One left. Finish it.' : 'One was left unlogged.';
    return isToday ? `${day.pending} left — you're already ahead of yesterday's you.` : `${day.pending} were left unlogged.`;
  };

  const segmentColor = (status: CompletionStatus | null): string => {
    if (status === CompletionStatus.COMPLETED) return '#3b9b73';
    if (status === CompletionStatus.FAILED) return '#c84141';
    if (status === CompletionStatus.SKIPPED) return '#8a7a68';
    return '#2c2121';
  };

  return (
    <div className="mt-4 bg-[#4a3f36] border-4 border-[#8a6a4f] p-3 shadow-[8px_8px_0px_#1a1515]">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs text-[#b0a08f] uppercase tracking-wider truncate">
          {isToday ? "Today's Board" : format(viewingDate, 'MMM d')}
        </p>
        <p className="text-sm text-white whitespace-nowrap shrink-0">
          <span className="text-[#f5b342]">{day.done}</span>/{day.total} · {pct}%
        </p>
      </div>

      {day.total <= SEGMENT_LIMIT ? (
        <div className="flex gap-[3px] mt-2">
          {day.statuses.map((status, i) => (
            <div
              key={i}
              className="flex-1 h-4 border-2 border-[#1f1717]"
              style={{ backgroundColor: segmentColor(status) }}
            />
          ))}
        </div>
      ) : (
        <div className="w-full h-4 bg-[#2c2121] border-2 border-[#1f1717] mt-2">
          <div className="h-full bg-[#3b9b73]" style={{ width: `${pct}%` }} />
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mt-2">
        <p className="text-[10px] sm:text-xs text-[#d8cbb8] min-w-0 break-words">{message()}</p>
        {day.xp > 0 && (
          <span className="flex items-center gap-1 text-xs text-[#f5b342] whitespace-nowrap shrink-0">
            <CoinIcon className="w-4 h-4" />
            +{day.xp}
          </span>
        )}
        {day.done === day.total && (
          <CheckIcon className="w-4 h-4 text-[#3b9b73] shrink-0" />
        )}
      </div>
    </div>
  );
};

export default DailyProgressBanner;
