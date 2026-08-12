import React from 'react';
import { Quit } from '../types';
import { currentStreakDays, currentStreakHours } from '../utils/quits';

interface QuitChipsProps {
  quits: Quit[];
  onClick: () => void;
}

// Compact fight status on the main Habits tab: the counters someone in
// recovery checks first thing should be on the first screen they see.
const QuitChips: React.FC<QuitChipsProps> = ({ quits, onClick }) => {
  const activeQuits = quits.filter(q => !q.isArchived);
  if (activeQuits.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {activeQuits.map(quit => {
        const days = currentStreakDays(quit);
        const label = days >= 1 ? `${days}d` : `${currentStreakHours(quit)}h`;
        return (
          <button
            key={quit.id}
            onClick={onClick}
            title={`${quit.name}: ${label} clean — open Battles`}
            className="flex items-center gap-2 px-3 py-1.5 bg-surface border-2 border-frame text-xs hover:bg-raised hover:border-accent transition-colors"
          >
            <span className="text-ink-dim">⚔️ {quit.name}</span>
            <span className="text-good-soft font-bold">{label} clean</span>
          </button>
        );
      })}
    </div>
  );
};

export default QuitChips;
