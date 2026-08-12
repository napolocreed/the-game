import { Completion, CompletionStatus, DayNote, Habit, PlayerProfile, Quit, Skin, SkinUnlock, Task } from '../types';
import { differenceInCalendarDays } from 'date-fns';
import { totalCleanDays, bestStreakDays } from './quits';
import { RESCUE_THRESHOLD_DAYS } from './tasks';

/**
 * Everything an unlock rule may look at.
 *
 * Deliberately a named context, like BadgeContext: an unlock that silently
 * reads the wrong list would hand out or withhold rewards, and there is no
 * server to correct it afterwards.
 */
export interface UnlockContext {
  profile: PlayerProfile;
  habits: Habit[];
  completions: Completion[];
  quits: Quit[];
  tasks: Task[];
  dayNotes: { [dateKey: string]: DayNote };
  /** Days since the account's first recorded activity. */
  seniorityDays: number;
}

/**
 * How old is this account, really?
 *
 * Derived from the earliest thing the user ever created rather than a stored
 * "joined on" date, so it is correct for profiles that predate the field and
 * cannot be reset by clearing a single key. A brand-new account is 0.
 */
export const seniorityDays = (
  habits: Habit[], quits: Quit[], tasks: Task[], completions: Completion[],
  now: Date = new Date(),
): number => {
  const stamps: number[] = [];
  const push = (iso?: string | null) => {
    if (!iso) return;
    const t = new Date(iso).getTime();
    if (!Number.isNaN(t) && t <= now.getTime()) stamps.push(t);
  };
  habits.forEach(h => push(h.createdAt));
  quits.forEach(q => { push(q.createdAt); push(q.firstStartDate); });
  // A backdated task says "I have been avoiding this for two years", which is
  // a claim about the task, not about how long the app has been used. Only its
  // real completions and the account's other anchors count here.
  tasks.forEach(t => push(t.completedAt));
  completions.forEach(c => push(c.date));
  if (stamps.length === 0) return 0;
  return Math.max(0, differenceInCalendarDays(now, new Date(Math.min(...stamps))));
};

/**
 * Feats: one-off accomplishments that are not already a badge tier.
 *
 * Each is a single honest predicate over real data. They exist so a skin can
 * be tied to a story ("you cleared something you had dodged for half a year")
 * rather than to a number that only measures time spent.
 */
export interface Feat {
  id: string;
  name: string;
  description: string;
  achieved: (ctx: UnlockContext) => boolean;
}

export const FEATS: Feat[] = [
  {
    id: 'first-blood',
    name: 'First Blood',
    description: 'Log your very first completed habit.',
    achieved: ({ completions }) => completions.some(c => c.status === CompletionStatus.COMPLETED),
  },
  {
    id: 'century',
    name: 'Century',
    description: 'Reach a 100-day streak on any habit.',
    achieved: ({ habits }) => habits.some(h => h.streak >= 100),
  },
  {
    id: 'excavation',
    name: 'Excavation',
    description: 'Finish something you had been putting off for six months.',
    achieved: ({ tasks }) => tasks.some(t =>
      t.completedAt &&
      differenceInCalendarDays(new Date(t.completedAt), new Date(t.createdAt)) >= 180),
  },
  {
    id: 'clean-hundred',
    name: 'Clean Hundred',
    description: 'Accumulate 100 clean days across your boss fights.',
    achieved: ({ quits }) => quits.reduce((s, q) => s + totalCleanDays(q), 0) >= 100,
  },
  {
    id: 'phoenix',
    name: 'Phoenix',
    description: 'Beat your own best clean streak after a relapse.',
    achieved: ({ quits }) => quits.some(q => q.relapses.length > 0 && bestStreakDays(q) >= 30),
  },
  {
    id: 'unbroken-month',
    name: 'Unbroken Month',
    description: 'Go 30 days without missing a scheduled habit.',
    achieved: ({ completions }) => {
      const done = completions.filter(c => c.status === CompletionStatus.COMPLETED);
      if (done.length === 0) return false;
      const lastMiss = completions
        .filter(c => c.status === CompletionStatus.FAILED)
        .reduce((latest, c) => Math.max(latest, new Date(c.date).getTime()), 0);
      const firstEver = Math.min(...done.map(c => new Date(c.date).getTime()));
      const since = lastMiss || firstEver;
      return differenceInCalendarDays(new Date(), new Date(since)) >= 30;
    },
  },
  {
    id: 'clean-slate',
    name: 'Clean Slate',
    description: 'Empty your side quest board with at least five posted.',
    achieved: ({ tasks }) =>
      tasks.length >= 5 && tasks.every(t => t.completedAt || t.droppedAt),
  },
  {
    id: 'archivist',
    name: 'Archivist',
    description: 'Dig out ten long-buried jobs.',
    achieved: ({ tasks }) => tasks.filter(t =>
      t.completedAt &&
      differenceInCalendarDays(new Date(t.completedAt), new Date(t.createdAt)) >= RESCUE_THRESHOLD_DAYS
    ).length >= 10,
  },
  {
    id: 'perfect-week',
    name: 'Flawless Week',
    description: 'Seven days running with nothing scheduled left undone.',
    achieved: ({ completions }) => {
      // Group by day: a day counts as perfect if something was scheduled and
      // none of it was missed. Seven of those in a row is the feat.
      const byDay = new Map<string, { done: number; missed: number }>();
      for (const c of completions) {
        const key = c.date.slice(0, 10);
        const cell = byDay.get(key) ?? { done: 0, missed: 0 };
        if (c.status === CompletionStatus.COMPLETED) cell.done++;
        else if (c.status === CompletionStatus.FAILED) cell.missed++;
        byDay.set(key, cell);
      }
      const days = [...byDay.keys()].sort();
      let run = 0;
      let prev: string | null = null;
      for (const day of days) {
        const cell = byDay.get(day)!;
        const perfect = cell.done > 0 && cell.missed === 0;
        const consecutive = prev !== null &&
          differenceInCalendarDays(new Date(day), new Date(prev)) === 1;
        run = perfect ? (consecutive ? run + 1 : 1) : 0;
        if (run >= 7) return true;
        prev = day;
      }
      return false;
    },
  },
  {
    id: 'iron-will',
    name: 'Iron Will',
    description: 'Ride out fifty urges.',
    achieved: ({ quits }) => quits.reduce((s, q) => s + (q.urgesResisted ?? 0), 0) >= 50,
  },
  {
    id: 'triage',
    name: 'Triage',
    description: 'Close five side quests in a single day.',
    achieved: ({ tasks }) => {
      const perDay = new Map<string, number>();
      for (const t of tasks) {
        if (!t.completedAt) continue;
        const key = t.completedAt.slice(0, 10);
        perDay.set(key, (perDay.get(key) ?? 0) + 1);
      }
      return [...perDay.values()].some(n => n >= 5);
    },
  },
  {
    id: 'chronicler',
    name: 'Chronicler',
    description: 'Write down how sixty days went.',
    achieved: ({ dayNotes }) =>
      Object.values(dayNotes).filter(n => n && (n.text?.trim() || n.mood)).length >= 60,
  },
];

const FEAT_BY_ID = new Map(FEATS.map(f => [f.id, f]));

export const isUnlocked = (unlock: SkinUnlock, ctx: UnlockContext): boolean => {
  switch (unlock.kind) {
    case 'default':
      return true;
    case 'level':
      return ctx.profile.level >= unlock.level;
    case 'badge':
      return (ctx.profile.unlockedBadges[unlock.badgeId] ?? 0) >= unlock.tier;
    case 'feat':
      return FEAT_BY_ID.get(unlock.featId)?.achieved(ctx) ?? false;
    case 'seniority':
      return ctx.seniorityDays >= unlock.days;
    default:
      return false;
  }
};

/** Human-readable requirement, for the locked state in the gallery. */
export const unlockLabel = (unlock: SkinUnlock): string => {
  switch (unlock.kind) {
    case 'default': return 'Yours from the start';
    case 'level': return `Level ${unlock.level}`;
    case 'badge': return 'Earn a badge';
    case 'feat': return FEAT_BY_ID.get(unlock.featId)?.name ?? 'A feat';
    case 'seniority': return unlock.days >= 365
      ? `${Math.round(unlock.days / 365)} year${unlock.days >= 730 ? 's' : ''} in`
      : `${unlock.days} days in`;
    default: return '';
  }
};

/**
 * How close is this to unlocking, 0..1?
 *
 * Only ever reports progress it can actually measure. A feat is binary and
 * says so by returning null rather than inventing a percentage — a progress
 * bar that jumps from 0 to 100 with nothing in between is a lie about how
 * close you were.
 */
export const unlockProgress = (unlock: SkinUnlock, ctx: UnlockContext): number | null => {
  switch (unlock.kind) {
    case 'level': return Math.min(1, ctx.profile.level / unlock.level);
    case 'seniority': return Math.min(1, ctx.seniorityDays / unlock.days);
    default: return null;
  }
};

/** The next few skins within reach, nearest first — the "keep going" list. */
export const nextUnlocks = (skins: Skin[], ctx: UnlockContext, limit = 3): Skin[] =>
  skins
    .filter(s => !isUnlocked(s.unlock, ctx))
    .map(s => ({ s, p: unlockProgress(s.unlock, ctx) }))
    .filter((x): x is { s: Skin; p: number } => x.p !== null)
    .sort((a, b) => b.p - a.p)
    .slice(0, limit)
    .map(x => x.s);
