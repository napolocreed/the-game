
import React, { useState, useRef, useEffect } from 'react';
import { Habit, CompletionStatus } from '../types';
import PixelatedButton from './PixelatedButton';
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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isActionTakenToday = todaysStatus !== null;
  const canPerformAction = isEditable && !isActionTakenToday;
  const xpGained = calculateXP(habit);

  // Same validated hues as the charts — the old blue/purple pair was
  // indistinguishable under deuteranopia, and the icon carries the identity too.
  const CategoryIcon = CATEGORY_ICONS[habit.category];

  const baseContainerStyle = 'p-4 bg-[#4a3f36] border-4 border-[#8a6a4f] shadow-[8px_8px_0px_#1a1515] transition-all duration-200';
  const hoverStyle = 'hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_#1a1515]';

  const containerStyle = `${baseContainerStyle} ${canPerformAction ? hoverStyle : ''} ${todaysStatus === CompletionStatus.FAILED ? 'border-orange-600' : ''} ${todaysStatus === CompletionStatus.SKIPPED ? 'opacity-70' : ''}`;

  return (
    <div 
      className={containerStyle}
      draggable={isEditable}
      onDragStart={onDragStart}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-white shrink-0"
          style={{
            backgroundColor: CATEGORY_HEX[habit.category],
            boxShadow: `4px 4px 0px ${CATEGORY_SHADOW_HEX[habit.category]}`,
          }}
        >
          <CategoryIcon className="w-3 h-3" />
          {habit.category}
        </span>
        <p className={`flex-1 text-lg text-[#f0e9d6] break-words min-w-0 ${todaysStatus === CompletionStatus.COMPLETED ? 'line-through' : ''}`}>{habit.name}</p>
      </div>
      
      <div className="flex items-center justify-between flex-wrap gap-x-4 gap-y-2 mt-3">
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm">
          {habit.streak > 0 && (
            <div className="flex items-center text-orange-400 font-bold" title={`${habit.streak} day streak`}>
              <StreakIcon className="w-4 h-4" />
              <span className="ml-1">{habit.streak} Day Streak</span>
            </div>
          )}
          <div className="font-bold text-purple-300" title={`Base reward: ${habit.xpReward} XP`}>
            +{xpGained} XP
          </div>
          {habit.reminderTime && (
            <div className="flex items-center text-cyan-300" title={`Reminder at ${formatTimeForDisplay(habit.reminderTime)}`}>
              <ClockIcon className="w-4 h-4" />
              <span className="ml-1">{formatTimeForDisplay(habit.reminderTime)}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {isActionTakenToday && isEditable ? (
            <PixelatedButton
              onClick={() => onUndo(habit.id)}
              title={
                  todaysStatus === CompletionStatus.COMPLETED ? 'Undo completion' :
                  todaysStatus === CompletionStatus.FAILED ? 'Undo miss' : 'Undo skip'
              }
              className="bg-gray-600 hover:bg-gray-500 border-gray-700 shadow-[4px_4px_0px_#1f2937] p-2"
              isIconOnly={true}
            >
              <UndoIcon className="w-5 h-5" />
            </PixelatedButton>
          ) : (
            <>
              <PixelatedButton 
                onClick={() => onComplete(habit.id)}
                disabled={!canPerformAction}
                title="Complete habit"
                className={`${todaysStatus === CompletionStatus.COMPLETED ? 'bg-green-800 text-gray-400 border-green-900 shadow-[4px_4px_0px_#052e16] hover:bg-green-800' : 'bg-green-700 hover:bg-green-600 border-green-800 shadow-[4px_4px_0px_#14532d]'} p-2`}
                isIconOnly={true}
              >
                <CheckIcon className="w-5 h-5" />
              </PixelatedButton>
              <PixelatedButton
                onClick={() => onFail(habit.id)}
                disabled={!canPerformAction}
                title="Mark as missed"
                className="bg-orange-700 hover:bg-orange-600 border-orange-800 shadow-[4px_4px_0px_#7c2d12] p-2"
                isIconOnly={true}
              >
                <FailIcon className="w-5 h-5" />
              </PixelatedButton>
              <div className="relative" ref={menuRef}>
                  <PixelatedButton
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      disabled={!isEditable}
                      title="More options"
                      className="bg-gray-600 hover:bg-gray-500 border-gray-700 shadow-[4px_4px_0px_#1f2937] p-2"
                      isIconOnly={true}
                  >
                      <MoreIcon className="w-5 h-5" />
                  </PixelatedButton>
                  {isMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-[#2c2121] border-2 border-[#8a6a4f] shadow-lg z-10">
                          <button 
                              onClick={() => { onSkip(habit.id); setIsMenuOpen(false); }} 
                              disabled={!canPerformAction}
                              title="Skip for today (won't break streak)"
                              className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm hover:bg-[#4a3f36] disabled:opacity-50 disabled:cursor-not-allowed">
                              <SkipIcon className="w-4 h-4" /> Skip Today
                          </button>
                          <button onClick={() => { onDuplicate(habit); setIsMenuOpen(false); }} title="Create a copy of this habit" className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm hover:bg-[#4a3f36]">
                              <DuplicateIcon className="w-4 h-4" /> Duplicate Habit
                          </button>
                          <button onClick={() => { onArchive(habit); setIsMenuOpen(false); }} title="Hide habit from daily list" className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-yellow-300 hover:bg-[#4a3f36]">
                              <ArchiveIcon className="w-4 h-4" /> Archive Habit
                          </button>
                      </div>
                  )}
              </div>
            </>
          )}
        </div>
      </div>
       {todaysStatus === CompletionStatus.FAILED && (
        <p className="text-sm text-orange-300 mt-2">It's okay! Tomorrow is a new day.</p>
      )}
    </div>
  );
};

export default HabitItem;
