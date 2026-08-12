import React, { useMemo } from 'react';
import { Completion, CompletionStatus, Habit } from '../types';
import { InsightIcon } from './icons/InsightIcon';
import { goldenHour, mostProductiveWeekday } from '../utils/analytics';

interface AnalyticsInsightsProps {
  completions: Completion[];
  habits: Habit[];
}

const InsightCard: React.FC<{ title: string; value: React.ReactNode }> = ({ title, value }) => (
  <div className="bg-inset border-2 border-frame p-3 flex-1 min-w-[140px]">
    <p className="text-xs text-ink-dim uppercase tracking-wider">{title}</p>
    <p className="text-sm sm:text-lg font-bold text-ink-hi mt-1 break-words">{value}</p>
  </div>
);

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Full weekday names don't fit a half-width card in the pixel font on phones.
const WeekdayValue: React.FC<{ dayIndex: number }> = ({ dayIndex }) => (
  <>
    <span className="sm:hidden">{DAY_ABBR[dayIndex]}</span>
    <span className="hidden sm:inline">{DAY_NAMES[dayIndex]}</span>
  </>
);

const AnalyticsInsights: React.FC<AnalyticsInsightsProps> = ({ completions, habits }) => {
  const insights = useMemo(() => {
    const done = completions.filter(c => c.status === CompletionStatus.COMPLETED);
    if (done.length === 0) {
      return null;
    }

    const productiveDayIdx = mostProductiveWeekday(completions);
    const weekdayCompletions = done.filter(c => {
      const d = new Date(c.date).getDay();
      return d >= 1 && d <= 5;
    }).length;

    const habitsWithStreaks = habits.filter(h => !h.isArchived && h.streak > 0);
    const avgStreak = habitsWithStreaks.length > 0
      ? Math.round(habitsWithStreaks.reduce((sum, h) => sum + h.streak, 0) / habitsWithStreaks.length * 10) / 10
      : 0;

    return {
      productiveDayIdx,
      avgStreak,
      weekdayPercent: Math.round((weekdayCompletions / done.length) * 100),
      goldenHour: goldenHour(completions),
    };
  }, [completions, habits]);

  if (!insights) {
    return null;
  }

  return (
    <div className="bg-surface border-4 border-frame p-4 shadow-hard">
      <div className="flex items-center gap-3 mb-4">
        <InsightIcon className="w-8 h-8 text-accent" />
        <h3 className="text-xl text-ink-hi">Player Insights</h3>
      </div>
      <div className="flex flex-wrap gap-3">
        <InsightCard
          title="Top Weekday"
          value={insights.productiveDayIdx !== null ? <WeekdayValue dayIndex={insights.productiveDayIdx} /> : 'N/A'}
        />
        {insights.goldenHour && <InsightCard title="Golden Hour" value={insights.goldenHour} />}
        <InsightCard title="Average Streak" value={`${insights.avgStreak} Days`} />
        <InsightCard title="Weekday Activity" value={`${insights.weekdayPercent}%`} />
      </div>
    </div>
  );
};

export default AnalyticsInsights;
