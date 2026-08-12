import React, { useMemo, useState } from 'react';
import { Habit, Completion, CompletionStatus, PlayerProfile, Quit, DayNote } from '../types';
import StatCard from './StatCard';
import WeeklyActivityChart from './WeeklyActivityChart';
import CategoryDistributionChart from './CategoryDistributionChart';
import BadgeItem from './BadgeItem';
import { BADGE_CATALOG } from '../utils/badges';
import CompletionHeatmap from './CompletionHeatmap';
import AnalyticsInsights from './AnalyticsInsights';
import RecoverySection from './RecoverySection';
import ConsistencyChart from './ConsistencyChart';
import HabitStatsCard from './HabitStatsCard';
import { habitStats, personalRecords } from '../utils/analytics';
import { format } from 'date-fns';
import { CheckIcon } from './icons/CheckIcon';
import { CrownIcon } from './icons/CrownIcon';
import { TrophyIcon } from './icons/TrophyIcon';
import { StreakIcon } from './icons/StreakIcon';

interface ProgressPageProps {
  habits: Habit[];
  completions: Completion[];
  profile: PlayerProfile;
  quits: Quit[];
  dayNotes: { [dateKey: string]: DayNote };
}

type StatsTab = 'overview' | 'habits' | 'recovery' | 'awards';

const SUB_TABS: { id: StatsTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'habits', label: 'Habits' },
  { id: 'recovery', label: 'Recovery' },
  { id: 'awards', label: 'Awards' },
];

const ProgressPage: React.FC<ProgressPageProps> = ({ habits, completions, profile, quits, dayNotes }) => {
  const [tab, setTab] = useState<StatsTab>('overview');

  const totalCompletions = completions.filter(c => c.status === CompletionStatus.COMPLETED).length;
  const records = useMemo(() => personalRecords(habits, completions), [habits, completions]);

  const activeHabitStats = useMemo(
    () =>
      habits
        .filter(h => !h.isArchived)
        .map(h => habitStats(h, completions))
        .sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1)),
    [habits, completions]
  );

  const unlockedTiers = Object.values(profile.unlockedBadges).reduce((s, t) => s + t, 0);
  const totalTiers = BADGE_CATALOG.reduce((s, b) => s + b.tiers.length, 0);

  return (
    <div>
      <h2 className="text-2xl md:text-3xl text-[#f5b342] mb-4">Your Progress</h2>

      {/* Sub-navigation: the old single page had become a long scroll; four
          focused screens keep each question one tap away. */}
      <div className="flex border-2 border-[#8a6a4f] mb-6 overflow-hidden" role="tablist" aria-label="Progress sections">
        {SUB_TABS.map((t, i) => (
          <React.Fragment key={t.id}>
            {i > 0 && <div className="w-px bg-[#8a6a4f] shrink-0" />}
            <button
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 min-w-0 px-1 py-2 text-[9px] sm:text-xs truncate transition-colors
                ${tab === t.id ? 'bg-[#8a6a4f] text-white' : 'bg-[#2c2121] text-[#b0a08f] hover:bg-[#4a3f36]'}`}
            >
              {t.label}
            </button>
          </React.Fragment>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <StatCard label="Total Wins" value={totalCompletions} icon={<CheckIcon className="w-6 h-6" />} />
            <StatCard label="Perfect Days" value={records.perfectDays} icon={<CrownIcon className="w-6 h-6" />} sub="all habits done" />
            <StatCard
              label="Best Day"
              value={records.bestDay ? records.bestDay.count : '—'}
              icon={<TrophyIcon className="w-6 h-6" />}
              sub={records.bestDay ? format(records.bestDay.date, 'MMM d, yyyy') : 'no wins yet'}
            />
            <StatCard label="Longest Streak" value={`${records.longestStreakEver}d`} icon={<StreakIcon className="w-6 h-6" />} sub="all time" />
          </div>

          <ConsistencyChart habits={habits} completions={completions} />
          <AnalyticsInsights completions={completions} habits={habits} />

          <div>
            <h3 className="text-xl text-white mb-4">Completion History</h3>
            <CompletionHeatmap completions={completions} />
          </div>

          <WeeklyActivityChart completions={completions} />
          <CategoryDistributionChart completions={completions} />
        </div>
      )}

      {tab === 'habits' && (
        <div>
          {activeHabitStats.length === 0 ? (
            <p className="text-[#b0a08f] text-center p-8">Create some habits to see their stats here!</p>
          ) : (
            <>
              <p className="text-[10px] text-[#b0a08f] mb-3">
                Last 30 days per habit — <span className="text-[#3b9b73]">▮ done</span>{' '}
                <span className="text-[#c84141]">▖ failed</span>{' '}
                <span className="text-[#8a7a68]">▗ skipped</span> · dark = missed
              </p>
              <div className="space-y-4">
                {activeHabitStats.map(stats => (
                  <HabitStatsCard key={stats.habit.id} stats={stats} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'recovery' && (
        quits.length > 0 || Object.keys(dayNotes).length > 0 ? (
          <RecoverySection quits={quits} dayNotes={dayNotes} habits={habits} completions={completions} />
        ) : (
          <p className="text-[#b0a08f] text-center p-8">
            Start a Boss Fight in the ⚔️ Battles tab, or log your mood in the Calendar, to unlock recovery analytics.
          </p>
        )
      )}

      {tab === 'awards' && (
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="text-xl text-white">Achievements</h3>
            <span className="text-xs text-[#f5b342]">{unlockedTiers}/{totalTiers} tiers</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {BADGE_CATALOG.map(badge => (
              <BadgeItem
                key={badge.id}
                badge={badge}
                unlockedTierNum={profile.unlockedBadges[badge.id] || 0}
                profile={profile}
                habits={habits}
                completions={completions}
                quits={quits}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressPage;
