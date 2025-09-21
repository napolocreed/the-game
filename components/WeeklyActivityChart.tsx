import React from 'react';
import { Completion } from '../types';
// Fix: Removed 'startOfToday' and 'subDays' from date-fns import as they are causing errors.
import { format, isSameDay } from 'date-fns';

interface WeeklyActivityChartProps {
  completions: Completion[];
}

const WeeklyActivityChart: React.FC<WeeklyActivityChartProps> = ({ completions }) => {
  // Fix: Replaced startOfToday() with manual date object creation to avoid import error.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fix: Replaced subDays() with manual date calculation to avoid import error.
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const day = new Date(today);
    day.setDate(day.getDate() - (6 - i));
    return day;
  });

  const data = last7Days.map(day => {
    const dayCompletions = completions.filter(c => isSameDay(new Date(c.date), day)).length;
    return {
      name: format(day, 'EEE'),
      completions: dayCompletions,
    };
  });

  const maxCompletions = Math.max(...data.map(d => d.completions), 1);

  return (
    <div className="bg-[#4a3f36] border-4 border-[#8a6a4f] p-4 shadow-[8px_8px_0px_#1a1515]">
      <h3 className="text-xl text-white mb-4">Last 7 Days Activity</h3>
      <div className="h-48 flex justify-between items-end gap-2">
        {data.map((day, index) => (
          <div key={index} className="flex-1 flex flex-col items-center h-full">
            <div className="w-full h-full flex items-end justify-center">
               <div
                 className="w-full bg-gradient-to-t from-yellow-400 to-orange-500"
                 style={{ height: `${(day.completions / maxCompletions) * 100}%` }}
                 title={`${day.completions} completions on ${day.name}`}
               />
            </div>
            <span className="text-xs text-[#b0a08f] mt-1">{day.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyActivityChart;
