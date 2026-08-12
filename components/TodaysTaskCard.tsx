import React from 'react';
import { Task } from '../types';
import { ageDays, pushCount } from '../utils/tasks';
import { CATEGORY_HEX, CATEGORY_SHADOW_HEX } from '../utils/categoryColors';
import { CATEGORY_ICONS } from './icons/CategoryIcons';
import { CheckIcon } from './icons/CheckIcon';
import { SnoozeIcon, HourglassIcon } from './icons/TaskIcons';
import { differenceInCalendarDays, format } from 'date-fns';

interface TodaysTaskCardProps {
  task: Task | null;
  onComplete: (taskId: string) => void;
  onPush: (taskId: string) => void;
  onOpenBoard: () => void;
  /** True when there are tasks but every one has already been declined today. */
  allPushedToday: boolean;
}

/**
 * One task, on the screen the user already opens every day.
 *
 * A list of thirty postponed things is the disease, not the cure — it is the
 * object they have already been avoiding. So the app picks, and the only two
 * answers are "done" and "not today". Declining is free and never called a
 * failure; it is simply counted, because the count is a true fact and the
 * truest pressure this feature can apply.
 */
const TodaysTaskCard: React.FC<TodaysTaskCardProps> = ({ task, onComplete, onPush, onOpenBoard, allPushedToday }) => {
  if (!task) {
    if (!allPushedToday) return null;
    return (
      <button
        onClick={onOpenBoard}
        className="w-full mt-4 text-left bg-surface border-4 border-frame p-3 shadow-hard hover:bg-raised transition-colors"
      >
        <p className="text-xs text-ink-dim uppercase tracking-wider">Side Quest</p>
        <p className="text-sm text-ink mt-1">Everything pushed for today.</p>
      </button>
    );
  }

  const CategoryIcon = CATEGORY_ICONS[task.category];
  const age = ageDays(task);
  const pushes = pushCount(task);
  const dueIn = task.dueDate ? differenceInCalendarDays(new Date(task.dueDate), new Date()) : null;

  return (
    <div className="mt-4 bg-surface border-4 border-frame p-3 pm:p-4 shadow-hard">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-ink-dim uppercase tracking-wider truncate">Side Quest</p>
        <button
          onClick={onOpenBoard}
          className="text-[10px] text-ink-dim hover:text-ink-hi underline shrink-0"
        >
          see all
        </button>
      </div>

      <div className="flex items-start gap-2 pm:gap-3 mt-2">
        <span
          className="shrink-0 w-7 h-7 pm:w-8 pm:h-8 flex items-center justify-center"
          style={{
            backgroundColor: CATEGORY_HEX[task.category],
            boxShadow: `3px 3px 0px ${CATEGORY_SHADOW_HEX[task.category]}`,
          }}
          title={task.category}
        >
          <CategoryIcon className="w-4 h-4 pm:w-5 pm:h-5 text-ink-hi" />
        </span>
        <p className="flex-1 min-w-0 text-base pm:text-lg leading-snug text-ink break-words">
          {task.name}
        </p>
      </div>

      {/* Every fact on this line is computed, never asserted. */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] pm:text-xs text-ink-dim">
        <span className="flex items-center gap-1">
          <HourglassIcon className="w-4 h-4" />
          {age === 0 ? 'added today' : `${age}d waiting`}
        </span>
        {pushes > 0 && <span>pushed {pushes}×</span>}
        {dueIn !== null && (
          <span className={dueIn <= 3 ? 'text-warn' : ''}>
            {dueIn < 0
              ? `due ${Math.abs(dueIn)}d ago`
              : dueIn === 0
                ? 'due today'
                : `due ${format(new Date(task.dueDate!), 'MMM d')}`}
          </span>
        )}
      </div>

      {task.note && (
        <p className="mt-2 text-[11px] text-ink-soft italic break-words">{task.note}</p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onComplete(task.id)}
          className="flex-[3] flex items-center justify-center gap-2 h-11 border-4 border-good-edge bg-good hover:bg-good-hi text-ink-hi text-sm transition-colors"
        >
          <CheckIcon className="w-5 h-5" />
          Done
        </button>
        <button
          onClick={() => onPush(task.id)}
          title="Not today"
          aria-label="Not today"
          className="flex-1 flex items-center justify-center gap-2 h-11 border-4 border-surface bg-raised hover:bg-frame text-ink text-sm transition-colors"
        >
          <SnoozeIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default TodaysTaskCard;
