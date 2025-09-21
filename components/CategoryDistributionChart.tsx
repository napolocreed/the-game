import React from 'react';
import { Completion, HabitCategory } from '../types';

interface CategoryDistributionChartProps {
  completions: Completion[];
}

const categoryColors: { [key in HabitCategory]: string } = {
  [HabitCategory.HEALTH]: 'bg-red-600',
  [HabitCategory.WELLNESS]: 'bg-blue-600',
  [HabitCategory.PRODUCTIVITY]: 'bg-purple-600',
  [HabitCategory.LIFESTYLE]: 'bg-green-600',
};

const CategoryDistributionChart: React.FC<CategoryDistributionChartProps> = ({ completions }) => {
  const categoryCounts = completions.reduce((acc, completion) => {
    acc[completion.habitCategory] = (acc[completion.habitCategory] || 0) + 1;
    return acc;
  }, {} as { [key in HabitCategory]?: number });

  const totalCompletions = completions.length;

  const sortedCategories = (Object.values(HabitCategory)).filter(cat => categoryCounts[cat] > 0)
    .sort((a, b) => (categoryCounts[b] ?? 0) - (categoryCounts[a] ?? 0));

  return (
    <div className="bg-[#4a3f36] border-4 border-[#8a6a4f] p-4 shadow-[8px_8px_0px_#1a1515]">
      <h3 className="text-xl text-white mb-4">Habit Category Focus</h3>
      <div className="space-y-3">
        {sortedCategories.length > 0 ? sortedCategories.map(category => {
          const count = categoryCounts[category] ?? 0;
          const percentage = totalCompletions > 0 ? (count / totalCompletions) * 100 : 0;
          return (
            <div key={category}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white">{category}</span>
                <span className="text-[#b0a08f]">{count} completions</span>
              </div>
              <div className="w-full h-4 bg-[#2c2121] border-2 border-[#8a6a4f]">
                <div 
                  className={`h-full ${categoryColors[category]}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        }) : <p className="text-[#b0a08f]">Complete some habits to see your focus areas!</p>}
      </div>
    </div>
  );
};

export default CategoryDistributionChart;
