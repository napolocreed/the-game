import React, { useState } from 'react';
import { Habit, Completion, CompletionStatus } from '../types';
// Fix: Removed 'startOfMonth' and 'startOfWeek' from date-fns import as they are causing errors.
import { format, endOfMonth, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';

interface CalendarViewProps {
  habits: Habit[];
  completions: Completion[];
  onDayClick: (date: Date) => void;
}

const CalendarHeader: React.FC<{
  currentMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}> = ({ currentMonth, onPreviousMonth, onNextMonth }) => (
  <div className="flex justify-between items-center mb-4">
    <button onClick={onPreviousMonth} className="p-2 bg-[#6a5340] border-2 border-[#8a6a4f] hover:bg-[#8a6a4f]">&lt;</button>
    <h2 className="text-xl text-white">{format(currentMonth, 'MMMM yyyy')}</h2>
    <button onClick={onNextMonth} className="p-2 bg-[#6a5340] border-2 border-[#8a6a4f] hover:bg-[#8a6a4f]">&gt;</button>
  </div>
);

const CalendarDays: React.FC = () => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return (
    <div className="grid grid-cols-7 text-center text-xs text-[#b0a08f]">
      {days.map(day => <div key={day} className="py-2">{day}</div>)}
    </div>
  );
};

const CalendarView: React.FC<CalendarViewProps> = ({ habits, completions, onDayClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fix: Replaced startOfMonth from date-fns with manual date creation to resolve import error.
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = endOfMonth(currentMonth);
  // Fix: Replaced startOfWeek from date-fns with manual date creation to resolve import error.
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - monthStart.getDay());
  const endDate = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getStatusesForDay = (day: Date) => {
    const dayOfWeek = day.getDay();
    const scheduledHabitIds = new Set(habits.filter(h => !h.isArchived && h.scheduleDays.includes(dayOfWeek)).map(h => h.id));
    if (scheduledHabitIds.size === 0) return [];
    
    const dayCompletions = completions.filter(c => isSameDay(new Date(c.date), day));
    
    const statuses = new Set<CompletionStatus>();
    dayCompletions.forEach(c => {
        if(scheduledHabitIds.has(c.habitId)) {
            statuses.add(c.status);
        }
    });

    return Array.from(statuses);
  };
  
  return (
    <div className="bg-[#4a3f36] border-4 border-[#8a6a4f] p-4 shadow-[8px_8px_0px_#1a1515]">
      <CalendarHeader
        currentMonth={currentMonth}
        onPreviousMonth={() => setCurrentMonth(prev => new Date(prev.setMonth(prev.getMonth() - 1)))}
        onNextMonth={() => setCurrentMonth(prev => new Date(prev.setMonth(prev.getMonth() + 1)))}
      />
      <CalendarDays />
      <div className="grid grid-cols-7">
        {days.map(day => {
          const statuses = getStatusesForDay(day);
          const dotColors = {
              [CompletionStatus.COMPLETED]: 'bg-green-500',
              [CompletionStatus.FAILED]: 'bg-orange-500',
              [CompletionStatus.SKIPPED]: 'bg-gray-500',
          };

          return (
            <div
              key={day.toString()}
              onClick={() => onDayClick(day)}
              className={`h-20 border-2 border-[#2c2121] p-1 flex flex-col overflow-hidden cursor-pointer hover:bg-[#6a5340]
                ${!isSameMonth(day, currentMonth) ? 'bg-[#2c2121] opacity-70' : ''}
                ${isToday(day) ? 'border-yellow-400' : ''}`}
            >
              <span className={`text-xs ${isToday(day) ? 'text-yellow-400' : 'text-white'}`}>
                {format(day, 'd')}
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                 {statuses.map(status => (
                    <div key={status} className={`w-2 h-2 rounded-full ${dotColors[status]}`}></div>
                 ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
