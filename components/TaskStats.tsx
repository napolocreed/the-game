import React, { useMemo } from 'react';
import { Task } from '../types';
import {
  anchor,
  anchorHistory,
  cohorts,
  cohortsAreMeaningful,
  openTasks,
  rescues,
  resolved,
  typicalWait,
} from '../utils/tasks';
import { HourglassIcon } from './icons/TaskIcons';
import { TrendUpIcon } from './icons/TrendUpIcon';
import { format } from 'date-fns';

interface TaskStatsProps {
  tasks: Task[];
}

/**
 * Statistics for things you postpone.
 *
 * Every figure here survives one test: adding a task must not improve it. That
 * rules out counts of completed tasks (rewards adding trivial ones), any
 * completion rate (there is no schedule, so no honest denominator) and any
 * burndown (it lies when new work arrives continuously). What is left is the
 * old tail of the open set, where the only input is elapsed time.
 */
const TaskStats: React.FC<TaskStatsProps> = ({ tasks }) => {
  const open = openTasks(tasks);
  const top = anchor(tasks);
  const bands = cohorts(tasks);
  const showBands = cohortsAreMeaningful(tasks);
  const history = useMemo(() => anchorHistory(tasks, 12), [tasks]);
  const wait = typicalWait(tasks);
  const saved = rescues(tasks);
  const closed = resolved(tasks);

  if (tasks.length === 0) {
    return <p className="text-ink-dim text-center p-8">No side quests yet.</p>;
  }

  const maxCount = Math.max(1, ...bands.map(b => b.count));
  const maxDays = history ? Math.max(1, ...history.map(h => h.days ?? 0)) : 1;

  return (
    <div className="space-y-6">
      {/* The anchor and the typical wait must sit together: a small wait beside
          a large anchor is the actual diagnosis — you clear the easy new ones
          and the pile is untouched. Either number alone misleads. */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface border-4 border-frame p-3 shadow-hard">
          <HourglassIcon className="w-5 h-5 text-accent mb-1" />
          <p className="text-2xl text-ink-hi font-bold">{top ? `${top.days}d` : '—'}</p>
          <p className="text-[10px] text-ink-dim uppercase mt-1">Longest wait</p>
          {top && <p className="text-[9px] text-ink-faint mt-1 break-words">{top.task.name}</p>}
        </div>
        <div className="bg-surface border-4 border-frame p-3 shadow-hard">
          <p className="text-2xl text-ink-hi font-bold">{open.length}</p>
          <p className="text-[10px] text-ink-dim uppercase mt-1">Open</p>
          {wait !== null && (
            <p className="text-[9px] text-ink-faint mt-1">usually done in {wait}d</p>
          )}
        </div>
      </div>

      {showBands && (
        <div className="bg-surface border-4 border-frame p-4 shadow-hard">
          <h3 className="text-lg text-ink-hi">How long they've waited</h3>
          {/* Absolute counts, never percentages: a "% fresh" figure would rise
              every time you write something down, rewarding logging over doing. */}
          <p className="text-[10px] text-ink-dim mb-3">open side quests</p>
          <div className="space-y-2">
            {bands.map(band => (
              <div key={band.label}>
                <div className="flex justify-between items-baseline gap-2 text-xs mb-1">
                  <span className="text-ink truncate">{band.label}</span>
                  <span className="text-ink-dim shrink-0">{band.count}</span>
                </div>
                <div className="w-full h-3 bg-inset border-2 border-inset-deep">
                  <div
                    className="h-full bg-accent-dim"
                    style={{ width: `${(band.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {history && (
        <div className="bg-surface border-4 border-frame p-4 shadow-hard">
          <div className="flex items-center gap-2 mb-1">
            <TrendUpIcon className="w-5 h-5 text-accent shrink-0" />
            <h3 className="text-lg text-ink-hi">The oldest thing</h3>
          </div>
          {/* This chart needs no caption. Age grows exactly one day per day with
              zero action, so a straight rising line IS "nothing was resolved".
              Only clearing the oldest item can bend it. */}
          <p className="text-[10px] text-ink-dim mb-4">age of the longest-waiting quest, 12 weeks</p>
          <div className="h-32 flex items-end gap-[3px]">
            {history.map(point => (
              <div
                key={point.weekStart.toISOString()}
                className="flex-1 min-w-0 h-full flex items-end"
                title={`Week of ${format(point.weekStart, 'MMM d')}: ${point.days === null ? 'nothing open' : `${point.days}d`}`}
              >
                {point.days === null ? (
                  <div className="w-full h-[2px] bg-raised" />
                ) : (
                  <div
                    // A step down looks identical whether the item was finished
                    // or abandoned, so abandoned weeks use the "skipped" grey
                    // already established in the habit legend.
                    className={`w-full ${point.fellBecauseDropped ? 'bg-neutral' : 'bg-accent-dim'}`}
                    style={{ height: `${Math.max((point.days / maxDays) * 100, 2)}%` }}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-ink-dim mt-1">
            <span>{format(history[0].weekStart, 'MMM d')}</span>
            <span>{maxDays}d peak</span>
          </div>
        </div>
      )}

      {saved && (
        <div className="bg-surface border-4 border-frame p-4 shadow-hard">
          <h3 className="text-lg text-ink-hi mb-1">Dug out</h3>
          <p className="text-[10px] text-ink-dim mb-3">finished after waiting a month or more</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl text-good-soft font-bold">{saved.lifetime}</span>
            <span className="text-xs text-ink-dim">
              {saved.last90} in the last 90 days
            </span>
          </div>
          {saved.oldestRescueDays > 0 && (
            <p className="text-xs text-accent mt-2">
              Best: cleared after {saved.oldestRescueDays} days.
            </p>
          )}
        </div>
      )}

      {/* Two counts, never a rate. A drop rate has no honest good direction:
          low means you never admit a task is dead, high means you delete
          instead of doing. A percentage would imply a direction that does not
          exist. */}
      <div className="bg-inset border-2 border-frame p-3">
        <p className="text-xs text-ink-dim">
          Last 180 days: <span className="text-good-soft">{closed.completed} done</span>
          {' · '}
          <span className="text-ink-faint">{closed.dropped} let go</span>
        </p>
      </div>
    </div>
  );
};

export default TaskStats;
