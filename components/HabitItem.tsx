import React, { useState, useRef, useEffect } from 'react';
import { Habit, CompletionStatus } from '../types';
import { CheckIcon } from './icons/CheckIcon';
import { calculateXP } from '../utils/xp';
import { MoreIcon } from './icons/MoreIcon';
import { SkipIcon } from './icons/SkipIcon';
import { ArchiveIcon } from './icons/ArchiveIcon';
import { FailIcon } from './icons/FailIcon';
import { DuplicateIcon } from './icons/DuplicateIcon';
import { ClockIcon } from './icons/ClockIcon';
import { UndoIcon } from './icons/UndoIcon';
import { StreakIcon } from './icons/StreakIcon';
import { CATEGORY_ICONS } from './icons/CategoryIcons';
import { CATEGORY_HEX, CATEGORY_SHADOW_HEX } from '../utils/categoryColors';
import { formatTimeForDisplay } from '../utils/time';

interface HabitItemProps {
  habit: Habit;
  todaysStatus: CompletionStatus | null;
  isEditable: boolean;
  onComplete: (habitId: string) => void;
  onFail: (habitId: string) => void;
  onSkip: (habitId: string) => void;
  onUndo: (habitId: string) => void;
  onArchive: (habit: Habit) => void;
  onDuplicate: (habit: Habit) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
}

/**
 * Three fixed rows, always: identity, metadata, actions.
 *
 * The old card put a full-width category chip on the same flex line as the
 * habit name. The chip was `shrink-0` and the name had no `min-w-0`, so on a
 * phone "Deep work block" got squeezed into a one-character column six lines
 * tall with dead space beside it. The category is now a small square badge and
 * its name moved to the metadata line, which costs nothing and gives the habit
 * name the whole width.
 *
 * The action row's buttons flex to fill, so the already-logged state is one
 * full-width Undo instead of a small square floating in an empty row, and every
 * card in the list has the same geometry regardless of how much metadata it
 * carries.
 */
const HabitItem: React.FC<HabitItemProps> = ({ habit, todaysStatus, isEditable, onComplete, onFail, onSkip, onUndo, onArchive, onDuplicate, onDragStart }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActionTakenToday = todaysStatus !== null;
  const canPerformAction = isEditable && !isActionTakenToday;
  const xpGained = calculateXP(habit);

  // Same validated hues as the charts — the old blue/purple pair was
  // indistinguishable under deuteranopia, and the icon carries the identity too.
  const CategoryIcon = CATEGORY_ICONS[habit.category];

  const isDone = todaysStatus === CompletionStatus.COMPLETED;
  const isFailed = todaysStatus === CompletionStatus.FAILED;
  const isSkipped = todaysStatus === CompletionStatus.SKIPPED;

  const container = [
    'p-3 pm:p-4 bg-[#4a3f36] border-4 shadow-[8px_8px_0px_#1a1515] transition-all duration-200',
    canPerformAction ? 'hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_#1a1515]' : '',
    isFailed ? 'border-orange-600' : 'border-[#8a6a4f]',
    isSkipped ? 'opacity-70' : '',
  ].join(' ');

  const actionBase = 'flex items-center justify-center gap-2 h-11 border-4 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const undoTitle = isDone ? 'Undo completion' : isFailed ? 'Undo miss' : 'Undo skip';

  return (
    <div className={container} draggable={isEditable} onDragStart={onDragStart}>
      {/* Row 1 — identity. The badge is 28px instead of a ~140px text chip, so
          the name keeps the width even at 320px. */}
      <div className="flex items-start gap-2 pm:gap-3">
        <span
          className="shrink-0 w-7 h-7 pm:w-8 pm:h-8 flex items-center justify-center"
          style={{
            backgroundColor: CATEGORY_HEX[habit.category],
            boxShadow: `3px 3px 0px ${CATEGORY_SHADOW_HEX[habit.category]}`,
          }}
          title={habit.category}
        >
          <CategoryIcon className="w-4 h-4 pm:w-5 pm:h-5 text-white" />
        </span>

        <p className={`flex-1 min-w-0 text-base pm:text-lg leading-snug text-[#f0e9d6] break-words ${isDone ? 'line-through' : ''}`}>
          {habit.name}
        </p>

        {habit.streak > 0 && (
          <span className="shrink-0 flex items-center gap-1 text-orange-400 font-bold text-sm" title={`${habit.streak} day streak`}>
            <StreakIcon className="w-4 h-4" />
            {habit.streak}
          </span>
        )}
      </div>

      {/* Row 2 — metadata, one line, muted. */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] pm:text-xs text-[#b0a08f]">
        <span>{habit.category}</span>
        <span className="text-purple-300">+{xpGained} XP</span>
        {habit.reminderTime && (
          <span className="flex items-center gap-1 text-cyan-300">
            <ClockIcon className="w-3 h-3" />
            {formatTimeForDisplay(habit.reminderTime)}
          </span>
        )}
      </div>

      {/* Row 3 — actions. Buttons flex to fill so no state leaves a void. */}
      <div className="mt-3 flex gap-2">
        {isActionTakenToday && isEditable ? (
          <button
            onClick={() => onUndo(habit.id)}
            title={undoTitle}
            className={`${actionBase} flex-1 bg-[#6a5340] hover:bg-[#8a6a4f] border-[#4a3f36] text-[#f0e9d6]`}
          >
            <UndoIcon className="w-5 h-5" />
            {isDone ? 'Done' : isFailed ? 'Missed' : 'Skipped'}
          </button>
        ) : (
          <>
            <button
              onClick={() => onComplete(habit.id)}
              disabled={!canPerformAction}
              title="Complete habit"
              aria-label="Complete habit"
              className={`${actionBase} flex-[3] bg-green-700 hover:bg-green-600 border-green-900 text-white`}
            >
              <CheckIcon className="w-5 h-5" />
              <span className="hidden xs:inline">Done</span>
            </button>
            <button
              onClick={() => onFail(habit.id)}
              disabled={!canPerformAction}
              title="Mark as missed"
              aria-label="Mark as missed"
              className={`${actionBase} flex-1 bg-orange-800 hover:bg-orange-700 border-orange-900 text-white`}
            >
              <FailIcon className="w-5 h-5" />
            </button>
            <div className="relative shrink-0" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                disabled={!isEditable}
                title="More options"
                aria-label="More options"
                className={`${actionBase} w-11 bg-[#6a5340] hover:bg-[#8a6a4f] border-[#4a3f36] text-[#f0e9d6]`}
              >
                <MoreIcon className="w-5 h-5" />
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#2c2121] border-2 border-[#8a6a4f] shadow-lg z-10">
                  <button
                    onClick={() => { onSkip(habit.id); setIsMenuOpen(false); }}
                    disabled={!canPerformAction}
                    title="Won't break your streak"
                    className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm hover:bg-[#4a3f36] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SkipIcon className="w-4 h-4" /> Skip Today
                  </button>
                  <button
                    onClick={() => { onDuplicate(habit); setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm hover:bg-[#4a3f36]"
                  >
                    <DuplicateIcon className="w-4 h-4" /> Duplicate Habit
                  </button>
                  <button
                    onClick={() => { onArchive(habit); setIsMenuOpen(false); }}
                    title="Hidden from your list, history kept"
                    className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-yellow-300 hover:bg-[#4a3f36]"
                  >
                    <ArchiveIcon className="w-4 h-4" /> Archive Habit
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HabitItem;
