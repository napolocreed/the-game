import { Completion, CompletionStatus, Habit, PlayerProfile, Quit, Skin, SkinUnlock, Task } from '../types';
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
