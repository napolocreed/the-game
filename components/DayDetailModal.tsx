import React from 'react';
import { Habit, Completion, CompletionStatus } from '../types';
import { format, isSameDay } from 'date-fns';

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  habits: Habit[];
  completions: Completion[];
}

const StatusIndicator: React.FC<{ status: CompletionStatus | 'pending' }> = ({ status }) => {
    const statusMap = {
        [CompletionStatus.COMPLETED]: { text: 'Done', color: 'bg-green-500' },
        [CompletionStatus.FAILED]: { text: 'Missed', color: 'bg-orange-500' },
        [CompletionStatus.SKIPPED]: { text: 'Skipped', color: 'bg-gray-500' },
        'pending': { text: 'Pending', color: 'bg-yellow-700' },
    };
    const { text, color } = statusMap[status];
    return <span className={`px-2 py-0.5 text-xs text-white ${color}`}>{text}</span>;
};

const DayDetailModal: React.FC<DayDetailModalProps> = ({ isOpen, onClose, date, habits, completions }) => {
  if (!isOpen || !date) return null;

  const dayOfWeek = date.getDay();
  const scheduledHabits = habits.filter(h => !h.isArchived && h.scheduleDays.includes(dayOfWeek));

  const getStatusForHabit = (habitId: string): CompletionStatus | 'pending' => {
      const completion = completions.find(c => c.habitId === habitId && isSameDay(new Date(c.date), date!));
      return completion ? completion.status : 'pending';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-[#4a3f36] border-4 border-[#8a6a4f] shadow-[8px_8px_0px_#1a1515] p-6 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl text-[#f5b342]">{format(date, 'MMMM d, yyyy')}</h2>
          <button onClick={onClose} className="text-3xl text-[#f0e9d6] hover:text-red-500 leading-none">&times;</button>
        </div>
        <div className="overflow-y-auto pr-2">
            {scheduledHabits.length > 0 ? (
                 <ul className="space-y-3">
                    {scheduledHabits.map(habit => (
                        <li key={habit.id} className="flex justify-between items-center p-3 bg-[#2c2121] border-2 border-[#6a5340]">
                           <span className="text-white">{habit.name}</span>
                           <StatusIndicator status={getStatusForHabit(habit.id)} />
                        </li>
                    ))}
                 </ul>
            ) : (
                <p className="text-center text-[#b0a08f] p-4">No habits were scheduled for this day.</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default DayDetailModal;
