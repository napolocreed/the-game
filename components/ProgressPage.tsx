import React from 'react';
import { Habit, Completion, PlayerProfile } from '../types';
import StatCard from './StatCard';
import WeeklyActivityChart from './WeeklyActivityChart';
import CategoryDistributionChart from './CategoryDistributionChart';
import BadgeItem from './BadgeItem';
import { BADGE_CATALOG } from '../utils/badges';
import CompletionHeatmap from './CompletionHeatmap';
import AnalyticsInsights from './AnalyticsInsights';

interface ProgressPageProps {
  habits: Habit[];
  completions: Completion[];
  profile: PlayerProfile;
}

const ProgressPage: React.FC<ProgressPageProps> = ({ habits, completions, profile }) => {
  const totalCompletions = completions.filter(c => c.status === 'completed').length;
  const longestStreak = habits.reduce((max, habit) => Math.max(max, habit.streak), 0);

  return (
    <div>
      <h2 className="text-2xl md:text-3xl text-[#f5b342] mb-6">Your Progress</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <StatCard label="Total Completions" value={totalCompletions} />
        <StatCard label="Longest Current Streak" value={`${longestStreak} Days`} />
      </div>

      <div className="space-y-8">
        <AnalyticsInsights completions={completions} habits={habits} />
        
        <div>
           <h3 className="text-xl text-white mb-4">Completion History</h3>
           <CompletionHeatmap completions={completions} />
        </div>

        <WeeklyActivityChart completions={completions} />
        <CategoryDistributionChart completions={completions} />
      </div>

      <div className="mt-12">
          <h2 className="text-2xl md:text-3xl text-[#f5b342] mb-6">Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {BADGE_CATALOG.map(badge => (
              <BadgeItem 
                key={badge.id} 
                badge={badge} 
                unlockedTierNum={profile.unlockedBadges[badge.id] || 0}
                profile={profile}
                habits={habits}
                completions={completions}
              />
            ))}
          </div>
      </div>
    </div>
  );
};

export default ProgressPage;