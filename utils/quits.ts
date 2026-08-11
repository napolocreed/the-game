import { Quit } from '../types';
import { differenceInCalendarDays, differenceInHours } from 'date-fns';

export interface QuitMilestone {
  days: number;
  xp: number;
  label: string;
}

// Escalating rewards: early milestones come fast (the hardest days deserve
// quick wins), later ones anchor long-term commitment.
export const QUIT_MILESTONES: QuitMilestone[] = [
  { days: 1, xp: 20, label: 'First Day' },
  { days: 3, xp: 35, label: '3 Days' },
  { days: 7, xp: 60, label: '1 Week' },
  { days: 14, xp: 90, label: '2 Weeks' },
  { days: 30, xp: 150, label: '1 Month' },
  { days: 60, xp: 220, label: '2 Months' },
  { days: 90, xp: 300, label: '3 Months' },
  { days: 180, xp: 450, label: '6 Months' },
  { days: 365, xp: 800, label: '1 Year' },
  { days: 730, xp: 1500, label: '2 Years' },
];

export const URGE_RESIST_XP = 15;
export const URGE_XP_DAILY_CAP = 5; // rewarded urges per quit per day

export const currentStreakDays = (quit: Quit, now: Date = new Date()): number =>
  Math.max(0, differenceInCalendarDays(now, new Date(quit.startDate)));

export const currentStreakHours = (quit: Quit, now: Date = new Date()): number =>
  Math.max(0, differenceInHours(now, new Date(quit.startDate)));

// Streak segments: firstStartDate -> relapse1 -> relapse2 -> ... -> now
const streakSegments = (quit: Quit, now: Date = new Date()): number[] => {
  const boundaries = [new Date(quit.firstStartDate), ...quit.relapses.map(r => new Date(r.date))];
  const segments: number[] = [];
  for (let i = 0; i < boundaries.length; i++) {
    const end = i + 1 < boundaries.length ? boundaries[i + 1] : now;
    segments.push(Math.max(0, differenceInCalendarDays(end, boundaries[i])));
  }
  return segments;
};

export const bestStreakDays = (quit: Quit, now: Date = new Date()): number =>
  Math.max(0, ...streakSegments(quit, now));

// A relapse never takes these away: every clean day ever lived counts.
export const totalCleanDays = (quit: Quit, now: Date = new Date()): number =>
  streakSegments(quit, now).reduce((sum, s) => sum + s, 0);

export const moneySaved = (quit: Quit, now: Date = new Date()): number | null => {
  if (!quit.costPerDay || quit.costPerDay <= 0) return null;
  return Math.round(totalCleanDays(quit, now) * quit.costPerDay * 100) / 100;
};

export const nextMilestone = (quit: Quit, now: Date = new Date()): QuitMilestone | null => {
  const days = currentStreakDays(quit, now);
  return QUIT_MILESTONES.find(m => m.days > days) || null;
};

export const previousMilestoneDays = (quit: Quit, now: Date = new Date()): number => {
  const days = currentStreakDays(quit, now);
  const passed = QUIT_MILESTONES.filter(m => m.days <= days);
  return passed.length > 0 ? passed[passed.length - 1].days : 0;
};

export const dueMilestones = (quit: Quit, now: Date = new Date()): QuitMilestone[] => {
  if (quit.isArchived) return [];
  const days = currentStreakDays(quit, now);
  return QUIT_MILESTONES.filter(m => days >= m.days && !quit.milestonesAwarded.includes(m.days));
};

// --- Triggers ---
// A small fixed vocabulary keeps tagging one-tap and makes aggregation
// meaningful ("Stress: 7" beats a pile of free-text variants).

export const TRIGGER_OPTIONS = ['Stress', 'Boredom', 'Social', 'Habit spot', 'Fatigue', 'Emotions'] as const;

export interface TriggerCount {
  trigger: string;
  count: number;
}

// Aggregates trigger tags across resisted urges and relapses.
export const topTriggers = (quits: Quit[], limit = 3): TriggerCount[] => {
  const counts = new Map<string, number>();
  quits.forEach(quit => {
    (quit.urgeLog || []).forEach(u => {
      if (u.trigger) counts.set(u.trigger, (counts.get(u.trigger) || 0) + 1);
    });
    quit.relapses.forEach(r => {
      if (r.trigger) counts.set(r.trigger, (counts.get(r.trigger) || 0) + 1);
    });
  });
  return [...counts.entries()]
    .map(([trigger, count]) => ({ trigger, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

// Weekday (0-6, Sun-Sat) with the most urges + relapses, or null below a
// minimum sample size (a "risky day" claim needs at least a little data).
export const riskiestWeekday = (quits: Quit[], minEvents = 5): number | null => {
  const counts = new Array(7).fill(0);
  let total = 0;
  quits.forEach(quit => {
    (quit.urgeLog || []).forEach(u => { counts[new Date(u.date).getDay()]++; total++; });
    quit.relapses.forEach(r => { counts[new Date(r.date).getDay()]++; total++; });
  });
  if (total < minEvents) return null;
  const max = Math.max(...counts);
  return counts.indexOf(max);
};

// Lifetime totals across all quits (archived included — history still counts).
export const recoveryTotals = (quits: Quit[], now: Date = new Date()) => ({
  cleanDays: quits.reduce((sum, q) => sum + totalCleanDays(q, now), 0),
  urgesResisted: quits.reduce((sum, q) => sum + q.urgesResisted, 0),
  moneySaved: quits.reduce((sum, q) => sum + (moneySaved(q, now) || 0), 0),
});
