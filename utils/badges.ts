import { Badge, PlayerProfile, Habit, Completion, CompletionStatus, HabitCategory, BadgeTier } from '../types';
import { differenceInCalendarDays, isSameDay, format } from 'date-fns';

// Import existing icons
import { FirstStepIcon } from '../components/icons/FirstStepIcon';
import { LevelIcon } from '../components/icons/LevelIcon';
import { StreakIcon } from '../components/icons/StreakIcon';
import { EarlyBirdIcon } from '../components/icons/EarlyBirdIcon';
import { NightOwlIcon } from '../components/icons/NightOwlIcon';
import { ComebackKingIcon } from '../components/icons/ComebackKingIcon';
import { PerfectionistIcon } from '../components/icons/PerfectionistIcon';
import { HealthMasterIcon } from '../components/icons/HealthMasterIcon';
import { ProductivityProIcon } from '../components/icons/ProductivityProIcon';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { LevelUpIcon } from '../components/icons/LevelUpIcon';
import { TrophyIcon } from '../components/icons/TrophyIcon';

// Import new icons
import { WellnessMasterIcon } from '../components/icons/WellnessMasterIcon';
import { LifestyleMasterIcon } from '../components/icons/LifestyleMasterIcon';
import { HabitCollectorIcon } from '../components/icons/HabitCollectorIcon';
import { GeneralistIcon } from '../components/icons/GeneralistIcon';
import { ResilienceIcon } from '../components/icons/ResilienceIcon';


const countCategoryCompletions = (completions: Completion[], category: HabitCategory) => {
  return completions.filter(c => c.status === CompletionStatus.COMPLETED && c.habitCategory === category).length;
}

const getMaxStreak = (habits: Habit[]) => Math.max(0, ...habits.map(h => h.streak));

const getUniqueCompletionDays = (completions: Completion[]) => {
  const uniqueDays = new Set(completions.map(c => format(new Date(c.date), 'yyyy-MM-dd')));
  return uniqueDays.size;
}

export const BADGE_CATALOG: Badge[] = [
  // --- CORE & ONBOARDING ---
  {
    id: 'first-step',
    baseName: 'First Step',
    icon: FirstStepIcon,
    tiers: [{
        tier: 1, name: 'First Step', description: 'Create your first habit! The journey begins.', target: 1, xpReward: 25 
    }],
    getProgress: (p, habits) => habits.length,
  },
  {
    id: 'habit-collector',
    baseName: 'Habit Collector',
    icon: HabitCollectorIcon,
    tiers: [
      { tier: 1, name: 'Collector (Bronze)', description: 'Create 5 different habits.', target: 5, xpReward: 50 },
      { tier: 2, name: 'Collector (Silver)', description: 'Create 10 different habits.', target: 10, xpReward: 100 },
      { tier: 3, name: 'Collector (Gold)', description: 'Create 20 different habits.', target: 20, xpReward: 200 },
    ],
    getProgress: (p, habits) => habits.length,
  },

  // --- LEVEL-BASED ---
  {
    id: 'player-level',
    baseName: 'Player Level',
    icon: LevelIcon,
    tiers: [
      { tier: 1, name: 'Novice Adventurer', description: 'Congratulations on reaching Level 5!', target: 5, xpReward: 50 },
      { tier: 2, name: 'Seasoned Explorer', description: 'You have reached Level 10. Impressive!', target: 10, xpReward: 100 },
      { tier: 3, name: 'Elite Champion', description: 'You have reached Level 20. A true legend!', target: 20, xpReward: 250 },
    ],
    getProgress: (profile) => profile.level,
  },
  
  // --- STREAK-BASED ---
  {
    id: 'streak-master',
    baseName: 'Streak Master',
    icon: StreakIcon,
    tiers: [
      { tier: 1, name: 'On Fire (Bronze)', description: 'Achieve a 3-day streak.', target: 3, xpReward: 50 },
      { tier: 2, name: 'On Fire (Silver)', description: 'Achieve a 7-day streak.', target: 7, xpReward: 100 },
      { tier: 3, name: 'On Fire (Gold)', description: 'Achieve a 30-day streak.', target: 30, xpReward: 300 },
      { tier: 4, name: 'On Fire (Platinum)', description: 'Achieve a 100-day streak.', target: 100, xpReward: 1000 },
    ],
    getProgress: (p, habits) => getMaxStreak(habits),
  },

  // --- XP & DEDICATION ---
  {
    id: 'xp-collector',
    baseName: 'XP Collector',
    icon: LevelUpIcon,
    tiers: [
        { tier: 1, name: 'Apprentice (Bronze)', description: 'Earn 1,000 total XP.', target: 1000, xpReward: 50 },
        { tier: 2, name: 'Journeyman (Silver)', description: 'Earn 5,000 total XP.', target: 5000, xpReward: 150 },
        { tier: 3, name: 'Master (Gold)', description: 'Earn 20,000 total XP.', target: 20000, xpReward: 500 },
    ],
    getProgress: (profile) => profile.totalXP,
  },
  {
    id: 'dedicated-player',
    baseName: 'Dedicated Player',
    icon: CalendarIcon,
    tiers: [
        { tier: 1, name: 'Consistent (Bronze)', description: 'Log activity on 7 unique days.', target: 7, xpReward: 75 },
        { tier: 2, name: 'Devoted (Silver)', description: 'Log activity on 30 unique days.', target: 30, xpReward: 200 },
        { tier: 3, name: 'Veteran (Gold)', description: 'Log activity on 100 unique days.', target: 100, xpReward: 600 },
    ],
    getProgress: (p, h, completions) => getUniqueCompletionDays(completions),
  },
  {
    id: 'quest-master',
    baseName: 'Quest Master',
    icon: TrophyIcon,
    tiers: [
      { tier: 1, name: 'Quest Novice', description: 'Complete 10 daily quests.', target: 10, xpReward: 50 },
      { tier: 2, name: 'Quest Conqueror', description: 'Complete 50 daily quests.', target: 50, xpReward: 150 },
      { tier: 3, name: 'Quest Legend', description: 'Complete 150 daily quests.', target: 150, xpReward: 400 },
    ],
    getProgress: (profile) => profile.totalQuestsCompleted || 0,
  },
  
  // --- CATEGORY COMPLETION ---
  {
    id: 'health-master',
    baseName: 'Health Master',
    icon: HealthMasterIcon,
    tiers: [
      { tier: 1, name: 'Health Novice', description: 'Complete 10 Health habits.', target: 10, xpReward: 50 },
      { tier: 2, name: 'Health Enthusiast', description: 'Complete 50 Health habits.', target: 50, xpReward: 150 },
      { tier: 3, name: 'Health Guru', description: 'Complete 200 Health habits.', target: 200, xpReward: 400 },
    ],
    getProgress: (p, h, c) => countCategoryCompletions(c, HabitCategory.HEALTH),
  },
    {
    id: 'wellness-master',
    baseName: 'Wellness Master',
    icon: WellnessMasterIcon,
    tiers: [
      { tier: 1, name: 'Wellness Novice', description: 'Complete 10 Wellness habits.', target: 10, xpReward: 50 },
      { tier: 2, name: 'Wellness Enthusiast', description: 'Complete 50 Wellness habits.', target: 50, xpReward: 150 },
      { tier: 3, name: 'Wellness Guru', description: 'Complete 200 Wellness habits.', target: 200, xpReward: 400 },
    ],
    getProgress: (p, h, c) => countCategoryCompletions(c, HabitCategory.WELLNESS),
  },
  {
    id: 'productivity-pro',
    baseName: 'Productivity Pro',
    icon: ProductivityProIcon,
    tiers: [
      { tier: 1, name: 'Productivity Novice', description: 'Complete 10 Productivity habits.', target: 10, xpReward: 50 },
      { tier: 2, name: 'Productivity Pro', description: 'Complete 50 Productivity habits.', target: 50, xpReward: 150 },
      { tier: 3, name: 'Productivity Sensei', description: 'Complete 200 Productivity habits.', target: 200, xpReward: 400 },
    ],
    getProgress: (p, h, c) => countCategoryCompletions(c, HabitCategory.PRODUCTIVITY),
  },
  {
    id: 'lifestyle-master',
    baseName: 'Lifestyle Master',
    icon: LifestyleMasterIcon,
    tiers: [
      { tier: 1, name: 'Lifestyle Novice', description: 'Complete 10 Lifestyle habits.', target: 10, xpReward: 50 },
      { tier: 2, name: 'Lifestyle Enthusiast', description: 'Complete 50 Lifestyle habits.', target: 50, xpReward: 150 },
      { tier: 3, name: 'Lifestyle Guru', description: 'Complete 200 Lifestyle habits.', target: 200, xpReward: 400 },
    ],
    getProgress: (p, h, c) => countCategoryCompletions(c, HabitCategory.LIFESTYLE),
  },
  {
    id: 'generalist',
    baseName: 'Generalist',
    icon: GeneralistIcon,
    tiers: [{ tier: 1, name: 'Generalist', description: 'Have at least one active habit in all 4 categories.', target: 4, xpReward: 150 }],
    getProgress: (p, habits) => {
        const activeCategories = new Set(habits.filter(h => !h.isArchived).map(h => h.category));
        return activeCategories.size;
    },
  },

  // --- BEHAVIORAL & RECOVERY ---
  {
    id: 'early-bird',
    baseName: 'Early Bird',
    icon: EarlyBirdIcon,
    tiers: [{ tier: 1, name: 'Early Bird', description: 'Complete 25 habits before 10 AM.', target: 25, xpReward: 100 }],
    getProgress: (p, h, c) => c.filter(comp => comp.status === CompletionStatus.COMPLETED && new Date(comp.date).getHours() < 10).length,
  },
  {
    id: 'night-owl',
    baseName: 'Night Owl',
    icon: NightOwlIcon,
    tiers: [{ tier: 1, name: 'Night Owl', description: 'Complete 25 habits after 8 PM.', target: 25, xpReward: 100 }],
    getProgress: (p, h, c) => c.filter(comp => comp.status === CompletionStatus.COMPLETED && new Date(comp.date).getHours() >= 20).length,
  },
  {
    id: 'comeback-king',
    baseName: 'Comeback King',
    icon: ComebackKingIcon,
    tiers: [{ tier: 1, name: 'Comeback King', description: 'Resume a habit after a 3+ day break.', target: 1, xpReward: 120 }],
    getProgress: (p, h, c) => {
      const completed = c.filter(comp => comp.status === CompletionStatus.COMPLETED);
      const completionsByHabit = completed.reduce((acc, comp) => {
          if (!acc[comp.habitId]) acc[comp.habitId] = [];
          acc[comp.habitId].push(new Date(comp.date));
          return acc;
      }, {} as Record<string, Date[]>);

      return Object.values(completionsByHabit).some(dates => {
          const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
          for (let i = 1; i < sortedDates.length; i++) {
              if (differenceInCalendarDays(sortedDates[i], sortedDates[i - 1]) >= 4) {
                  return true;
              }
          }
          return false;
      }) ? 1 : 0;
    },
  },
  {
    id: 'resilience',
    baseName: 'Resilience',
    icon: ResilienceIcon,
    tiers: [
      { tier: 1, name: 'Resilient (Bronze)', description: 'Recover a streak the day after missing a habit 1 time.', target: 1, xpReward: 75 },
      { tier: 2, name: 'Resilient (Silver)', description: 'Recover a streak the day after missing a habit 5 times.', target: 5, xpReward: 150 },
      { tier: 3, name: 'Resilient (Gold)', description: 'Recover a streak the day after missing a habit 15 times.', target: 15, xpReward: 300 },
    ],
    getProgress: (p, h, c) => {
        const failedCompletions = c.filter(comp => comp.status === CompletionStatus.FAILED);
        const successfulCompletions = c.filter(comp => comp.status === CompletionStatus.COMPLETED);
        
        const successfulDatesByHabit: Record<string, Set<string>> = {};
        successfulCompletions.forEach(comp => {
            if (!successfulDatesByHabit[comp.habitId]) {
                successfulDatesByHabit[comp.habitId] = new Set();
            }
            successfulDatesByHabit[comp.habitId].add(format(new Date(comp.date), 'yyyy-MM-dd'));
        });

        const recoveredFailures = new Set<string>();

        failedCompletions.forEach(fail => {
            const failDate = new Date(fail.date);
            const recoveryDate = new Date(failDate);
            recoveryDate.setDate(failDate.getDate() + 1);
            
            const recoveryDateStr = format(recoveryDate, 'yyyy-MM-dd');
            
            if (successfulDatesByHabit[fail.habitId]?.has(recoveryDateStr)) {
                recoveredFailures.add(fail.id);
            }
        });

        return recoveredFailures.size;
    },
  },
  {
    id: 'perfectionist',
    baseName: 'Perfectionist',
    icon: PerfectionistIcon,
    tiers: [{ tier: 1, name: 'Perfectionist', description: 'Go a full 7 days without missing any scheduled habits.', target: 7, xpReward: 200 }],
    getProgress: (p, h, c) => {
      const lastFailureDate = c
        .filter(comp => comp.status === CompletionStatus.FAILED)
        .reduce((latest, comp) => {
            const compDate = new Date(comp.date);
            return latest > compDate ? latest : compDate;
        }, new Date(0));
      
      if (lastFailureDate.getTime() === new Date(0).getTime()) {
        if (c.length === 0) return 0;
        const firstCompletionDate = new Date(c.map(comp => comp.date).sort()[0]);
        return differenceInCalendarDays(new Date(), firstCompletionDate) + 1;
      }
      
      return differenceInCalendarDays(new Date(), lastFailureDate);
    },
  },
];

export const checkAndUnlockBadges = (
  profile: PlayerProfile,
  habits: Habit[],
  completions: Completion[],
  badgeCatalog: Badge[]
): { newlyUnlocked: { badge: Badge; tier: BadgeTier }[] } => {
  const newlyUnlocked: { badge: Badge; tier: BadgeTier }[] = [];

  badgeCatalog.forEach(badge => {
    const currentProgress = badge.getProgress(profile, habits, completions);
    const currentlyUnlockedTierNum = profile.unlockedBadges[badge.id] || 0;

    badge.tiers.forEach(tier => {
        if (tier.tier > currentlyUnlockedTierNum && currentProgress >= tier.target) {
            newlyUnlocked.push({ badge, tier });
        }
    });
  });

  return { newlyUnlocked };
};