import React, { useMemo, useState } from 'react';
import { Habit, Completion, CompletionStatus, PlayerProfile, Quit, DayNote, Task } from '../types';
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
import TaskStats from './TaskStats';
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
  tasks: Task[];
}

type StatsTab = 'overview' | 'habits' | 'quests' | 'recovery' | 'awards';

const SUB_TABS: { id: StatsTab; label: string; short: string }[] = [
  { id: 'overview', label: 'Overview', short: 'All' },
  { id: 'habits', label: 'Habits', short: 'Habits' },
  { id: 'quests', label: 'Quests', short: 'Quests' },
  { id: 'recovery', label: 'Recovery', short: 'Boss' },
  { id: 'awards', label: 'Awards', short: 'Awards' },
];

const ProgressPage: React.FC<ProgressPageProps> = ({ habits, completions, profile, quits, dayNotes, tasks }) => {
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

      {/* Sub-navigation: the old single page had become a long scroll; four
          focused screens keep each question one tap away. */}
      <div className="flex border-2 border-frame mb-6 overflow-hidden" role="tablist" aria-label="Progress sections">
        {SUB_TABS.map((t, i) => (
          <React.Fragment key={t.id}>
            {i > 0 && <div className="w-px bg-frame shrink-0" />}
            <button
              role="tab"
              aria-selected={tab === t.id}
              // The visible label shortens on narrow phones; the accessible
              // name must not, or the section becomes "All" to a screen reader.
              aria-label={t.label}
              onClick={() => setTab(t.id)}
              className={`flex-1 min-w-0 px-1 py-2 text-[9px] sm:text-xs truncate transition-colors
                ${tab === t.id ? 'bg-frame text-ink-hi' : 'bg-inset text-ink-dim hover:bg-surface'}`}
            >
              <span className="pm:hidden block truncate">{t.short}</span>
              <span className="hidden pm:block truncate">{t.label}</span>
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

          <CompletionHeatmap completions={completions} />

          <WeeklyActivityChart completions={completions} />
          <CategoryDistributionChart completions={completions} />
        </div>
      )}

      {tab === 'habits' && (
        <div>
          {activeHabitStats.length === 0 ? (
            <p className="text-ink-dim text-center p-8">No habits yet.</p>
          ) : (
            <>
              {/* Swatches are drawn, not typed: the pixel font has no block
                  characters, so a "▮" would silently fall back to a smooth one. */}
              <p className="text-[10px] text-ink-dim mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-3 bg-good-soft" /> done
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-[6px] bg-cat-health" /> failed
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-[9px] bg-neutral" /> skipped
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-3 bg-inset-deep" /> missed
                </span>
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

      {tab === 'quests' && <TaskStats tasks={tasks} />}

      {tab === 'recovery' && (
        quits.length > 0 || Object.keys(dayNotes).length > 0 ? (
          <RecoverySection quits={quits} dayNotes={dayNotes} habits={habits} completions={completions} />
        ) : (
          <p className="text-ink-dim text-center p-8">
            Start a Boss Fight or log a mood to unlock this.
          </p>
        )
      )}

      {tab === 'awards' && (
        <div>
          <p className="text-xs text-accent mb-4">{unlockedTiers}/{totalTiers} tiers</p>
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
                tasks={tasks}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressPage;
