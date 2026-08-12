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

  // State, not coaching. The old copy also claimed you were "ahead of
  // yesterday's you" — nothing here looks at yesterday, so it was flattery
  // dressed as a fact, on the most-visited screen in the app.
  const message = (): string => {
    if (day.done === day.total) return 'Perfect day.';
    if (day.pending === 0) return 'Day logged.';
    if (day.done === 0) return isToday ? 'Nothing logged yet.' : 'Nothing logged.';
    return isToday ? `${day.pending} left.` : `${day.pending} unlogged.`;
  };

  const segmentColor = (status: CompletionStatus | null): string => {
    if (status === CompletionStatus.COMPLETED) return 'var(--good-soft)';
    if (status === CompletionStatus.FAILED) return 'var(--cat-health)';
    if (status === CompletionStatus.SKIPPED) return 'var(--neutral)';
    return 'var(--inset)';
  };

  return (
    <div className="mt-4 bg-surface border-4 border-frame p-3 shadow-hard">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs text-ink-dim uppercase tracking-wider truncate">
          {isToday ? 'Today' : format(viewingDate, 'MMM d')}
        </p>
        <p className="text-sm text-ink-hi whitespace-nowrap shrink-0">
          <span className="text-accent">{day.done}</span>/{day.total} · {pct}%
        </p>
      </div>

      {day.total <= SEGMENT_LIMIT ? (
        <div className="flex gap-[3px] mt-2">
          {day.statuses.map((status, i) => (
            <div
              key={i}
              className="flex-1 h-4 border-2 border-inset-deep"
              style={{ backgroundColor: segmentColor(status) }}
            />
          ))}
        </div>
      ) : (
        <div className="w-full h-4 bg-inset border-2 border-inset-deep mt-2">
          <div className="h-full bg-good-soft" style={{ width: `${pct}%` }} />
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mt-2">
        <p className="text-[10px] sm:text-xs text-ink-soft min-w-0 break-words">{message()}</p>
        {day.xp > 0 && (
          <span className="flex items-center gap-1 text-xs text-accent whitespace-nowrap shrink-0">
            <CoinIcon className="w-4 h-4" />
            +{day.xp}
          </span>
        )}
        {day.done === day.total && (
          <CheckIcon className="w-4 h-4 text-good-soft shrink-0" />
        )}
      </div>
    </div>
  );
};

export default DailyProgressBanner;
