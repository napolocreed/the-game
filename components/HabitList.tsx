import React, { useState } from 'react';
import { Habit, Completion, CompletionStatus } from '../types';
import HabitItem from './HabitItem';
import { isSameDay } from 'date-fns';
import { PlusIcon } from './icons/PlusIcon';

interface HabitListProps {
  habits: Habit[];
  completions: Completion[];
  viewingDate: Date;
  isEditable: boolean;
  onComplete: (habitId: string) => void;
  onFail: (habitId: string) => void;
  onSkip: (habitId: string) => void;
  onUndo: (habitId: string) => void;
  onArchive: (habit: Habit) => void;
  onReorder: (draggedHabitId: string, targetHabitId: string) => void;
  onDuplicate: (habit: Habit) => void;
  onAddNewHabit: () => void;
  dailyHabitLimit: number | null;
}

const HabitList: React.FC<HabitListProps> = ({ habits, completions, viewingDate, isEditable, onComplete, onFail, onSkip, onUndo, onArchive, onReorder, onDuplicate, onAddNewHabit, dailyHabitLimit }) => {
  const [draggedHabitId, setDraggedHabitId] = useState<string | null>(null);

  const dayOfWeek = viewingDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
  
  const sortedHabits = [...habits].sort((a,b) => (a.order ?? 0) - (b.order ?? 0));
  const habitsForDay = sortedHabits.filter(habit => habit.scheduleDays?.includes(dayOfWeek));

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, habitId: string) => {
    setDraggedHabitId(habitId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetHabitId: string) => {
    e.preventDefault();
    if (draggedHabitId && draggedHabitId !== targetHabitId) {
      onReorder(draggedHabitId, targetHabitId);
    }
    setDraggedHabitId(null);
  };

  const limitReached = dailyHabitLimit !== null && habitsForDay.length >= dailyHabitLimit;

  const AddNewHabitButton = isEditable ? (
    limitReached ? (
      <div className="text-center p-4 bg-[#6a5340] border-4 border-dashed border-yellow-700 text-yellow-200 mt-4 shadow-[8px_8px_0px_#1a1515]">
        <p className="font-bold">Daily Habit Limit Reached</p>
        <p className="text-sm mt-1">You can change this in Settings.</p>
      </div>
    ) : (
      <button 
        onClick={onAddNewHabit} 
        className="w-full text-center border-4 border-dashed border-[#6a5340] p-4 bg-[#4a3f36] shadow-[8px_8px_0px_#1a1515] hover:bg-[#6a5340] hover:border-yellow-400 transition-colors flex items-center justify-center gap-2 text-lg text-[#f0e9d6] mt-4"
      >
        <PlusIcon className="w-6 h-6" />
        New Habit
      </button>
    )
  ) : null;
  
  if (habits.length === 0) {
    return (
      <>
        <div className="text-center border-4 border-dashed border-[#6a5340] p-10 bg-[#4a3f36] shadow-[8px_8px_0px_#1a1515]">
          <p className="text-xl text-[#f0e9d6]">Your adventure awaits!</p>
          <p className="mt-2 text-[#b0a08f]">Click "New Habit" to add your first quest.</p>
        </div>
        {AddNewHabitButton}
      </>
    );
  }

  if (habitsForDay.length === 0) {
     return (
      <>
        <div className="text-center border-4 border-dashed border-[#6a5340] p-10 bg-[#4a3f36] shadow-[8px_8px_0px_#1a1515]">
          <p className="text-xl text-[#f0e9d6]">No habits scheduled for this day.</p>
          <p className="mt-2 text-[#b0a08f]">Enjoy your rest day! You've earned it.</p>
        </div>
        {AddNewHabitButton}
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {habitsForDay.map(habit => {
          const todaysCompletion = completions.find(c => c.habitId === habit.id && isSameDay(new Date(c.date), viewingDate));
          const todaysStatus = todaysCompletion ? todaysCompletion.status : null;
          
          return (
            <div 
              key={habit.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, habit.id)}
              style={{ opacity: draggedHabitId === habit.id ? 0.5 : 1 }}
            >
              <HabitItem 
                habit={habit}
                todaysStatus={todaysStatus}
                isEditable={isEditable}
                onComplete={onComplete}
                onFail={onFail}
                onSkip={onSkip}
                onUndo={onUndo}
                onArchive={onArchive} 
                onDuplicate={onDuplicate}
                onDragStart={(e) => handleDragStart(e, habit.id)}
              />
            </div>
          );
        })}
      </div>
      {AddNewHabitButton}
    </>
  );
};

export default HabitList;