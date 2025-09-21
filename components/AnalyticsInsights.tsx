import React, { useMemo } from 'react';
import { Completion, Habit } from '../types';
import { InsightIcon } from './icons/InsightIcon';

interface AnalyticsInsightsProps {
  completions: Completion[];
  habits: Habit[];
}

const InsightCard: React.FC<{ title: string; value: string | number; children?: React.ReactNode }> = ({ title, value }) => (
  <div className="bg-[#2c2121] border-2 border-[#8a6a4f] p-3 flex-1 min-w-[150px]">
    <p className="text-xs text-[#b0a08f] uppercase tracking-wider">{title}</p>
    <p className="text-xl font-bold text-white mt-1">{value}</p>
  </div>
);

const AnalyticsInsights: React.FC<AnalyticsInsightsProps> = ({ completions, habits }) => {
  const insights = useMemo(() => {
    if (completions.length === 0) {
      return { productiveDay: 'N/A', avgStreak: 0, weekdayPercent: 0 };
    }

    const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun -> Sat
    let weekdayCompletions = 0;
    
    completions.forEach(c => {
      const dayOfWeek = new Date(c.date).getDay();
      dayCounts[dayOfWeek]++;
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        weekdayCompletions++;
      }
    });

    const maxCompletions = Math.max(...dayCounts);
    const productiveDayIndex = dayCounts.indexOf(maxCompletions);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const productiveDay = dayNames[productiveDayIndex];

    const habitsWithStreaks = habits.filter(h => h.streak > 0);
    const avgStreak = habitsWithStreaks.length > 0
      ? Math.round(habitsWithStreaks.reduce((sum, h) => sum + h.streak, 0) / habitsWithStreaks.length * 10) / 10
      : 0;
    
    const weekdayPercent = Math.round((weekdayCompletions / completions.length) * 100);

    return { productiveDay, avgStreak, weekdayPercent };
  }, [completions, habits]);

  return (
    <div className="bg-[#4a3f36] border-4 border-[#8a6a4f] p-4 shadow-[8px_8px_0px_#1a1515]">
      <div className="flex items-center gap-3 mb-4">
        <InsightIcon className="w-8 h-8 text-yellow-400" />
        <h3 className="text-xl text-white">Player Insights</h3>
      </div>
      <div className="flex flex-wrap gap-3">
        <InsightCard title="Most Productive Day" value={insights.productiveDay} />
        <InsightCard title="Average Streak" value={`${insights.avgStreak} Days`} />
        <InsightCard title="Weekday Activity" value={`${insights.weekdayPercent}%`} />
      </div>
    </div>
  );
};

export default AnalyticsInsights;
