import React from 'react';
import { HabitStats } from '../utils/analytics';
import { CompletionStatus } from '../types';
import { CATEGORY_HEX } from '../utils/categoryColors';
import { format } from 'date-fns';

interface HabitStatsCardProps {
  stats: HabitStats;
}

// One habit's last 30 days at a glance: rate, streaks, and a day strip.
// Completed and failed differ by height as well as color (full vs half bar),
// so the strip stays readable under red/green color blindness.
const cellClass = (status: CompletionStatus | null, scheduled: boolean): { cls: string; h: string } => {
  if (status === CompletionStatus.COMPLETED) return { cls: 'bg-[#3b9b73]', h: '100%' };
  if (status === CompletionStatus.FAILED) return { cls: 'bg-[#c84141]', h: '45%' };
  if (status === CompletionStatus.SKIPPED) return { cls: 'bg-[#8a7a68]', h: '70%' };
  if (scheduled) return { cls: 'bg-[#1f1717]', h: '100%' }; // scheduled, no record → visible gap
  return { cls: 'bg-transparent', h: '100%' };
};

const HabitStatsCard: React.FC<HabitStatsCardProps> = ({ stats }) => {
  const { habit, cells, rate, completed, scheduled, bestStreak } = stats;
  const pct = rate !== null ? Math.round(rate * 100) : null;

  return (
    <div className="bg-[#4a3f36] border-4 border-[#8a6a4f] p-3 shadow-[8px_8px_0px_#1a1515]">
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-3 h-3 shrink-0 border border-black/40"
          style={{ backgroundColor: CATEGORY_HEX[habit.category] }}
          title={habit.category}
        />
        <span className="text-sm text-white truncate flex-1 min-w-0">{habit.name}</span>
        <span className="text-lg text-[#f5b342] shrink-0">{pct !== null ? `${pct}%` : '—'}</span>
      </div>

      <div className="h-6 flex items-end gap-[2px] bg-[#2c2121] border-2 border-[#1a1515] p-[2px]">
        {cells.map(cell => {
          const { cls, h } = cellClass(cell.status, cell.scheduled);
          const label = cell.status
            ? cell.status
            : cell.scheduled ? 'missed' : 'not scheduled';
          return (
            <div key={cell.dateKey} className="flex-1 min-w-0 h-full flex items-end" title={`${format(new Date(cell.dateKey), 'MMM d')} — ${label}`}>
              <div className={`w-full ${cls}`} style={{ height: h }} />
            </div>
          );
        })}
      </div>

      <div className="flex justify-between text-[10px] text-[#b0a08f] mt-2">
        <span>🔥 {habit.streak} now · best {bestStreak}</span>
        <span>{completed}/{scheduled} in 30d</span>
      </div>
    </div>
  );
};

export default HabitStatsCard;
