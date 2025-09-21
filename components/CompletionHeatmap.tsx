import React from 'react';
import { Completion } from '../types';
import { format, isSameDay } from 'date-fns';

interface CompletionHeatmapProps {
  completions: Completion[];
}

const CompletionHeatmap: React.FC<CompletionHeatmapProps> = ({ completions }) => {
  const today = new Date();
  const yearAgo = new Date(today);
  yearAgo.setDate(today.getDate() - 364);
  
  const days = [];
  for (let d = new Date(yearAgo); d <= today; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  
  const completionsByDate = completions.reduce((acc, comp) => {
    const dateKey = format(new Date(comp.date), 'yyyy-MM-dd');
    acc[dateKey] = (acc[dateKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const firstDayOfWeek = yearAgo.getDay();
  const emptyDays = Array(firstDayOfWeek).fill(null);

  const getCellColor = (count: number) => {
    if (count === 0) return 'bg-[#2c2121]';
    if (count <= 1) return 'bg-yellow-700';
    if (count <= 3) return 'bg-yellow-500';
    return 'bg-yellow-300';
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-[#4a3f36] border-4 border-[#8a6a4f] p-4 shadow-[8px_8px_0px_#1a1515] overflow-x-auto">
       <div className="flex gap-1">
        <div className="flex flex-col w-8 text-xs text-[#b0a08f]">
          <div className="h-4"></div>
          {dayLabels.map((day, i) => i % 2 !== 0 && (
            <div key={day} className="h-4 flex items-center">{day}</div>
          ))}
           <div className="h-4"></div>
        </div>
        <div className="grid grid-flow-col grid-rows-7 gap-1">
          {emptyDays.map((_, index) => <div key={`empty-${index}`} className="w-3 h-3 md:w-4 md:h-4" />)}
          {days.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const count = completionsByDate[dateKey] || 0;
            const title = `${count} completions on ${format(day, 'MMM d, yyyy')}`;
            return (
              <div
                key={dateKey}
                className={`w-3 h-3 md:w-4 md:h-4 ${getCellColor(count)}`}
                title={title}
              />
            );
          })}
        </div>
      </div>
      <div className="flex justify-end items-center gap-2 mt-2 text-xs text-[#b0a08f]">
          <span>Less</span>
          <div className="w-3 h-3 bg-[#2c2121]"></div>
          <div className="w-3 h-3 bg-yellow-700"></div>
          <div className="w-3 h-3 bg-yellow-500"></div>
          <div className="w-3 h-3 bg-yellow-300"></div>
          <span>More</span>
      </div>
    </div>
  );
};

export default CompletionHeatmap;
