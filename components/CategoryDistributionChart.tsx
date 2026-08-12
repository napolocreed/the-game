import React from 'react';
import { Completion, CompletionStatus, HabitCategory } from '../types';
import { CATEGORY_HEX } from '../utils/categoryColors';

interface CategoryDistributionChartProps {
  completions: Completion[];
}

const CategoryDistributionChart: React.FC<CategoryDistributionChartProps> = ({ completions }) => {
  // Only real wins count as "focus" — failed/skipped logs are not activity.
  const done = completions.filter(c => c.status === CompletionStatus.COMPLETED);
  const categoryCounts = done.reduce((acc, completion) => {
    acc[completion.habitCategory] = (acc[completion.habitCategory] || 0) + 1;
    return acc;
  }, {} as { [key in HabitCategory]?: number });

  const totalCompletions = done.length;

  const sortedCategories = (Object.values(HabitCategory)).filter(cat => categoryCounts[cat] > 0)
    .sort((a, b) => (categoryCounts[b] ?? 0) - (categoryCounts[a] ?? 0));

  return (
    <div className="bg-surface border-4 border-frame p-4 shadow-hard">
      <h3 className="text-xl text-ink-hi mb-4">Category Focus</h3>
      <div className="space-y-3">
        {sortedCategories.length > 0 ? sortedCategories.map(category => {
          const count = categoryCounts[category] ?? 0;
          const percentage = totalCompletions > 0 ? (count / totalCompletions) * 100 : 0;
          return (
            <div key={category}>
              <div className="flex justify-between items-baseline gap-2 text-sm mb-1">
                <span className="text-ink-hi truncate">{category}</span>
                <span className="text-ink-dim text-xs whitespace-nowrap shrink-0">{count}×</span>
              </div>
              <div className="w-full h-4 bg-inset border-2 border-frame">
                <div
                  className="h-full"
                  style={{ width: `${percentage}%`, backgroundColor: CATEGORY_HEX[category] }}
                />
              </div>
            </div>
          );
        }) : <p className="text-ink-dim">No wins logged yet.</p>}
      </div>
    </div>
  );
};

export default CategoryDistributionChart;
