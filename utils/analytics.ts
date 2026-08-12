import { Habit, Completion, CompletionStatus, Quit, DayNote } from '../types';
import { format } from 'date-fns';

// Analytics engine: pure, data-in → numbers-out helpers shared by the Progress
// screens. The core idea everywhere is *completion rate* — done vs scheduled —
// because raw completion counts reward adding habits, not keeping them.

export const dayKeyOf = (date: Date): string => format(date, 'yyyy-MM-dd');

const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const lastNDays = (n: number, now: Date = new Date()): Date[] => {
  const today = startOfDay(now);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (n - 1 - i));
    return d;
  });
};

// Habits scheduled on a given day. Archived habits are excluded for past days
// too — we don't know when they were archived, and counting them forever as
// "missed" would poison the rate; skipping them entirely is the lesser error.
const habitsScheduledOn = (day: Date, habits: Habit[]): Habit[] =>
  habits.filter(h =>
    !h.isArchived &&
    h.scheduleDays.includes(day.getDay()) &&
    startOfDay(new Date(h.createdAt)) <= day
  );

export interface DailyRate {
  date: Date;
  dateKey: string;
  scheduled: number;
  completed: number;
  /** null when nothing was scheduled that day (no signal, not a 0%). */
  rate: number | null;
}

export const dailyRates = (habits: Habit[], completions: Completion[], nDays: number, now: Date = new Date()): DailyRate[] => {
  const completedByDay = new Map<string, Set<string>>();
  completions.forEach(c => {
    if (c.status !== CompletionStatus.COMPLETED) return;
    const key = dayKeyOf(new Date(c.date));
    if (!completedByDay.has(key)) completedByDay.set(key, new Set());
    completedByDay.get(key)!.add(c.habitId);
  });

  return lastNDays(nDays, now).map(date => {
    const dateKey = dayKeyOf(date);
    const scheduledHabits = habitsScheduledOn(date, habits);
    const doneIds = completedByDay.get(dateKey);
    // Count only completions of habits actually scheduled that day, so an
    // off-schedule bonus log can't push a day past 100%.
    const completed = scheduledHabits.filter(h => doneIds?.has(h.id)).length;
    return {
      date,
      dateKey,
      scheduled: scheduledHabits.length,
      completed,
      rate: scheduledHabits.length > 0 ? completed / scheduledHabits.length : null,
    };
  });
};

export interface WeeklyRate {
  weekStart: Date;
  scheduled: number;
  completed: number;
  rate: number | null;
}

// Consistency per calendar week (Mon–Sun), oldest first, current week last
// (partial: only days up to today are counted).
export const weeklyConsistency = (habits: Habit[], completions: Completion[], weeks: number, now: Date = new Date()): WeeklyRate[] => {
  const today = startOfDay(now);
  // Monday of the current week (getDay(): 0=Sun … 6=Sat)
  const monday = new Date(today);
  monday.setDate(monday.getDate() - ((today.getDay() + 6) % 7));

  const daysBack = (weeks - 1) * 7 + Math.round((today.getTime() - monday.getTime()) / 86400000) + 1;
  const days = dailyRates(habits, completions, daysBack, now);

  const result: WeeklyRate[] = [];
  for (let w = 0; w < weeks; w++) {
    const weekStart = new Date(monday);
    weekStart.setDate(weekStart.getDate() - (weeks - 1 - w) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const inWeek = days.filter(d => d.date >= weekStart && d.date <= weekEnd);
    const scheduled = inWeek.reduce((s, d) => s + d.scheduled, 0);
    const completed = inWeek.reduce((s, d) => s + d.completed, 0);
    result.push({ weekStart, scheduled, completed, rate: scheduled > 0 ? completed / scheduled : null });
  }
  return result;
};

export interface HabitDayCell {
  dateKey: string;
  scheduled: boolean;
  status: CompletionStatus | null;
}

export interface HabitStats {
  habit: Habit;
  scheduled: number;
  completed: number;
  rate: number | null;
  bestStreak: number;
  cells: HabitDayCell[]; // oldest → today
}

export const habitStats = (habit: Habit, completions: Completion[], nDays = 30, now: Date = new Date()): HabitStats => {
  const own = completions.filter(c => c.habitId === habit.id);
  const statusByDay = new Map<string, CompletionStatus>();
  own.forEach(c => statusByDay.set(dayKeyOf(new Date(c.date)), c.status));

  const cells: HabitDayCell[] = lastNDays(nDays, now).map(date => ({
    dateKey: dayKeyOf(date),
    scheduled: habit.scheduleDays.includes(date.getDay()) && startOfDay(new Date(habit.createdAt)) <= date,
    status: statusByDay.get(dayKeyOf(date)) ?? null,
  }));

  const scheduledCells = cells.filter(c => c.scheduled);
  const completed = scheduledCells.filter(c => c.status === CompletionStatus.COMPLETED).length;

  // Best streak ever: the streak recorded just before each completion (+1 for
  // that completion) is a faithful history even though we only store deltas.
  const bestStreak = Math.max(
    habit.streak,
    ...own.filter(c => c.status === CompletionStatus.COMPLETED).map(c => (c.streakBefore ?? 0) + 1)
  );

  return {
    habit,
    scheduled: scheduledCells.length,
    completed,
    rate: scheduledCells.length > 0 ? completed / scheduledCells.length : null,
    bestStreak,
    cells,
  };
};

export interface PersonalRecords {
  bestDay: { date: Date; count: number } | null;
  bestWeekCompletions: number;
  perfectDays: number; // days where every scheduled habit was completed (≥1 scheduled)
  longestStreakEver: number;
}

export const personalRecords = (habits: Habit[], completions: Completion[], now: Date = new Date()): PersonalRecords => {
  const done = completions.filter(c => c.status === CompletionStatus.COMPLETED);

  const byDay = new Map<string, { date: Date; count: number }>();
  done.forEach(c => {
    const date = startOfDay(new Date(c.date));
    const key = dayKeyOf(date);
    const entry = byDay.get(key) || { date, count: 0 };
    entry.count++;
    byDay.set(key, entry);
  });
  let bestDay: { date: Date; count: number } | null = null;
  byDay.forEach(entry => {
    if (!bestDay || entry.count > bestDay.count) bestDay = entry;
  });

  // Best rolling calendar week (Mon–Sun) by raw completions.
  const byWeek = new Map<string, number>();
  done.forEach(c => {
    const d = startOfDay(new Date(c.date));
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    byWeek.set(dayKeyOf(d), (byWeek.get(dayKeyOf(d)) || 0) + 1);
  });
  const bestWeekCompletions = Math.max(0, ...byWeek.values());

  // Perfect days over the whole history we can see (bounded to 365 days for
  // cost — beyond that the heatmap doesn't show them either).
  const perfectDays = dailyRates(habits, completions, 365, now).filter(d => d.rate === 1).length;

  const longestStreakEver = Math.max(
    0,
    ...habits.map(h => habitStats(h, completions, 1, now).bestStreak)
  );

  return { bestDay, bestWeekCompletions, perfectDays, longestStreakEver };
};

// --- Mood ↔ activity ---

export interface MoodActivityLink {
  activeAvg: number; // avg mood on days ≥50% habits done
  quietAvg: number;  // avg mood on days <50% done (or nothing done)
  activeDays: number;
  quietDays: number;
}

// Honest correlation: only reported once both buckets have ≥3 mood entries.
export const moodVsActivity = (
  dayNotes: { [dateKey: string]: DayNote },
  habits: Habit[],
  completions: Completion[],
  nDays = 90,
  now: Date = new Date()
): MoodActivityLink | null => {
  const days = dailyRates(habits, completions, nDays, now);
  const active: number[] = [];
  const quiet: number[] = [];
  days.forEach(d => {
    const mood = dayNotes[d.dateKey]?.mood;
    if (!mood) return;
    if (d.rate !== null && d.rate >= 0.5) active.push(mood);
    else quiet.push(mood);
  });
  if (active.length < 3 || quiet.length < 3) return null;
  const avg = (xs: number[]) => Math.round((xs.reduce((s, x) => s + x, 0) / xs.length) * 10) / 10;
  return { activeAvg: avg(active), quietAvg: avg(quiet), activeDays: active.length, quietDays: quiet.length };
};

// --- Golden hour ---

const HOUR_BUCKETS: { label: string; from: number; to: number }[] = [
  { label: 'Early Morning', from: 5, to: 9 },
  { label: 'Morning', from: 9, to: 12 },
  { label: 'Afternoon', from: 12, to: 18 },
  { label: 'Evening', from: 18, to: 23 },
  { label: 'Night', from: 23, to: 5 },
];

// When the user actually logs their wins (needs a minimal sample).
export const goldenHour = (completions: Completion[], minSample = 5): string | null => {
  const done = completions.filter(c => c.status === CompletionStatus.COMPLETED);
  if (done.length < minSample) return null;
  const counts = new Map<string, number>();
  done.forEach(c => {
    const h = new Date(c.date).getHours();
    const bucket = HOUR_BUCKETS.find(b => (b.from < b.to ? h >= b.from && h < b.to : h >= b.from || h < b.to));
    if (bucket) counts.set(bucket.label, (counts.get(bucket.label) || 0) + 1);
  });
  let best: string | null = null;
  let bestCount = 0;
  counts.forEach((count, label) => {
    if (count > bestCount) { best = label; bestCount = count; }
  });
  return best;
};

// --- Recovery ---

export interface BattleRecord {
  urgesResisted: number;
  relapses: number;
  winRate: number; // resisted / (resisted + relapses)
}

// Every logged urge was a battle; a relapse is a lost one. Framing it as a
// win rate shows that slips are a minority — most battles are already won.
export const battleRecord = (quits: Quit[]): BattleRecord | null => {
  const urgesResisted = quits.reduce((s, q) => s + q.urgesResisted, 0);
  const relapses = quits.reduce((s, q) => s + q.relapses.length, 0);
  const total = urgesResisted + relapses;
  if (total === 0) return null;
  return { urgesResisted, relapses, winRate: urgesResisted / total };
};

// Average current mood in the N days after a relapse vs overall baseline is
// deliberately NOT computed: with sparse journaling it produces noise dressed
// as insight. moodVsActivity + the 30-day chart cover the honest cases.

// Most-logged weekday for completions (distinct from riskiestWeekday in
// quits.ts, which looks at urges/relapses).
export const mostProductiveWeekday = (completions: Completion[]): number | null => {
  const done = completions.filter(c => c.status === CompletionStatus.COMPLETED);
  if (done.length === 0) return null;
  const counts = new Array(7).fill(0);
  done.forEach(c => counts[new Date(c.date).getDay()]++);
  return counts.indexOf(Math.max(...counts));
};
