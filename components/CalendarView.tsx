import React, { useState } from 'react';
import { Habit, Completion, CompletionStatus, DayNote, Quit } from '../types';
// Fix: Removed 'startOfMonth' and 'startOfWeek' from date-fns import as they are causing errors.
import { format, formatISO, endOfMonth, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';

const MOOD_EMOJIS: { [mood: number]: string } = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' };

interface CalendarViewProps {
  habits: Habit[];
  completions: Completion[];
  dayNotes: { [dateKey: string]: DayNote };
  quits: Quit[];
  onDayClick: (date: Date) => void;
}

const CalendarHeader: React.FC<{
  currentMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}> = ({ currentMonth, onPreviousMonth, onNextMonth }) => (
  <div className="flex justify-between items-center mb-4">
    <button onClick={onPreviousMonth} className="p-2 bg-raised border-2 border-frame hover:bg-frame">&lt;</button>
    <h2 className="text-xl text-ink-hi">{format(currentMonth, 'MMMM yyyy')}</h2>
    <button onClick={onNextMonth} className="p-2 bg-raised border-2 border-frame hover:bg-frame">&gt;</button>
  </div>
);

const CalendarDays: React.FC = () => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return (
    <div className="grid grid-cols-7 text-center text-xs text-ink-dim">
      {days.map(day => <div key={day} className="py-2">{day}</div>)}
    </div>
  );
};

const CalendarView: React.FC<CalendarViewProps> = ({ habits, completions, dayNotes, quits, onDayClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Relapse days shown as 💥 so patterns can be spotted next to mood entries.
  const relapseDayKeys = new Set(
    quits.flatMap(q => q.relapses.map(r => formatISO(new Date(r.date), { representation: 'date' })))
  );

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
    <div className="bg-surface border-4 border-frame p-4 shadow-hard">
      <CalendarHeader
        currentMonth={currentMonth}
        onPreviousMonth={() => setCurrentMonth(prev => new Date(prev.setMonth(prev.getMonth() - 1)))}
        onNextMonth={() => setCurrentMonth(prev => new Date(prev.setMonth(prev.getMonth() + 1)))}
      />
      <CalendarDays />
      <div className="grid grid-cols-7">
        {days.map(day => {
          const statuses = getStatusesForDay(day);
          const dayKey = formatISO(day, { representation: 'date' });
          const note = dayNotes[dayKey];
          const hadRelapse = relapseDayKeys.has(dayKey);
          const dotColors = {
              [CompletionStatus.COMPLETED]: 'bg-good-soft',
              [CompletionStatus.FAILED]: 'bg-miss-hi',
              [CompletionStatus.SKIPPED]: 'bg-raised',
          };

          return (
            <div
              key={day.toString()}
              onClick={() => onDayClick(day)}
              className={`h-20 border-2 border-inset p-1 flex flex-col overflow-hidden cursor-pointer hover:bg-raised
                ${!isSameMonth(day, currentMonth) ? 'bg-inset opacity-70' : ''}
                ${isToday(day) ? 'border-accent' : ''}`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-xs ${isToday(day) ? 'text-accent' : 'text-ink-hi'}`}>
                  {format(day, 'd')}
                </span>
                <span className="text-[10px] leading-none">
                  {hadRelapse && <span title="Relapse logged this day">💥</span>}
                  {note && <span title={note.text}>{note.mood ? MOOD_EMOJIS[note.mood] : '📝'}</span>}
                </span>
              </div>
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
