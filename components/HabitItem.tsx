
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
import { formatTimeForDisplay } from '../utils/time';


const FireIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M12.267 3.11a.75.75 0 01.264 1.042l-1.08 1.8a.75.75 0 00.316 1.056l3.626 2.092a.75.75 0 01-.53 1.348l-2.459-1.42a1.5 1.5 0 00-1.056.316l-1.8 1.08a.75.75 0 01-1.042-.264l-2.092-3.626a.75.75 0 011.348-.53l1.42 2.459a1.5 1.5 0 001.056-.316l1.08-1.8a.75.75 0 011.042-.264z" clipRule="evenodd" />
        <path fillRule="evenodd" d="M9.166 3.818a.75.75 0 01.53-1.348l2.46 1.42a1.5 1.5 0 001.056-.316l1.8-1.08a.75.75 0 011.042.264l2.092 3.626a.75.75 0 01-1.348.53l-1.42-2.459a1.5 1.5 0 00-1.056.316l-1.8 1.08a.75.75 0 01-1.042-.264l-3.626-2.092a.75.75 0 01.264-1.042l1.08-1.8zM8.5 6.5a.5.5 0 01.5-.5h2a.5.5 0 010 1h-2a.5.5 0 01-.5-.5z" clipRule="evenodd" />
        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM5.93 5.93a.75.75 0 011.06-1.06 6.5 6.5 0 11-1.06 1.06z" />
    </svg>
);


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

  const categoryColor = {
    'Health': 'bg-red-700',
    'Wellness': 'bg-blue-700',
    'Productivity': 'bg-purple-700',
    'Lifestyle': 'bg-green-700',
  };

  const categoryShadow = {
    'Health': 'shadow-[4px_4px_0px_#4c1d1d]',
    'Wellness': 'shadow-[4px_4px_0px_#1e3a8a]',
    'Productivity': 'shadow-[4px_4px_0px_#581c87]',
    'Lifestyle': 'shadow-[4px_4px_0px_#14532d]',
  };

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
        <span className={`px-2 py-1 text-xs text-white ${categoryColor[habit.category]} ${categoryShadow[habit.category]} shrink-0`}>{habit.category}</span>
        <p className={`flex-1 text-lg text-[#f0e9d6] break-words min-w-0 ${todaysStatus === CompletionStatus.COMPLETED ? 'line-through' : ''}`}>{habit.name}</p>
      </div>
      
      <div className="flex items-center justify-between flex-wrap gap-x-4 gap-y-2 mt-3">
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm">
          {habit.streak > 0 && (
            <div className="flex items-center text-orange-400 font-bold" title={`${habit.streak} day streak`}>
              <FireIcon />
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
