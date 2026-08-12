import React, { useMemo } from 'react';
import { Habit, Completion } from '../types';
import { weeklyConsistency } from '../utils/analytics';
import { format } from 'date-fns';
import { TrendUpIcon } from './icons/TrendUpIcon';

interface ConsistencyChartProps {
  habits: Habit[];
  completions: Completion[];
}

// 12 weeks of completion rate (done ÷ scheduled). This is the one number that
// can't be gamed by adding more habits — it measures keeping promises, not
// making them. Single sequential hue (theme gold); height + selective labels
// carry the value, so color never has to.
const WEEKS = 12;

const ConsistencyChart: React.FC<ConsistencyChartProps> = ({ habits, completions }) => {
  const weeks = useMemo(() => weeklyConsistency(habits, completions, WEEKS), [habits, completions]);

  const withData = weeks.filter(w => w.rate !== null);
  if (withData.length === 0) {
    return null;
  }

  // Label only the ends and the (first) best week — a number on every bar is noise.
  const bestRate = Math.max(...withData.map(w => w.rate!));
  const labeled = new Set<number>();
  labeled.add(weeks.length - 1);
  labeled.add(weeks.findIndex(w => w.rate === bestRate));
  const firstIdx = weeks.findIndex(w => w.rate !== null);
  if (firstIdx >= 0) labeled.add(firstIdx);

  return (
    <div className="bg-[#4a3f36] border-4 border-[#8a6a4f] p-4 shadow-[8px_8px_0px_#1a1515]">
      <div className="flex items-center gap-2 mb-1">
        <TrendUpIcon className="w-5 h-5 text-[#f5b342] shrink-0" />
        <h3 className="text-xl text-white">Consistency</h3>
      </div>
      <p className="text-[10px] text-[#b0a08f] mb-4">% of scheduled habits completed, last {WEEKS} weeks</p>
      <div className="h-36 flex items-end gap-[3px]">
        {weeks.map((w, i) => {
          const pct = w.rate !== null ? Math.round(w.rate * 100) : null;
          const isCurrent = i === weeks.length - 1;
          return (
            <div
              key={w.weekStart.toISOString()}
              className="flex-1 min-w-0 h-full flex flex-col justify-end items-center"
              title={`Week of ${format(w.weekStart, 'MMM d')}: ${pct !== null ? `${w.completed}/${w.scheduled} (${pct}%)` : 'no scheduled habits'}`}
            >
              {pct !== null && labeled.has(i) && (
                <span className="text-[8px] text-[#f5b342] mb-[2px]">{pct}</span>
              )}
              {pct !== null ? (
                <div
                  className={`w-full ${isCurrent ? 'bg-[#f5b342]' : 'bg-[#c98d2e]'}`}
                  style={{ height: `${Math.max(pct, 3)}%` }}
                />
              ) : (
                <div className="w-full h-[2px] bg-[#6a5340]" />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-[#b0a08f] mt-1">
        <span>{format(weeks[0].weekStart, 'MMM d')}</span>
        <span>This week</span>
      </div>
    </div>
  );
};

export default ConsistencyChart;
