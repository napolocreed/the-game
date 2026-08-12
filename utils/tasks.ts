import { differenceInCalendarDays, format, startOfWeek } from 'date-fns';
import { HabitCategory, Task, TaskSize } from '../types';

/**
 * Analytics for one-shot tasks.
 *
 * Every metric here had to pass one test, the same one that made
 * `completed / scheduled` the backbone of the habit stats instead of raw
 * counts:
 *
 *     does the act of ADDING a task improve the number?
 *
 * If yes, it is out. That test kills nearly everything — median open age drops
 * when you add, "percent fresh" rises when you add, and every burndown chart
 * lies when new work arrives continuously. Exactly one family survives:
 * statistics about the OLD TAIL of the open set. A task created today can
 * never enter it, and clearing a task created today can never leave it. Time
 * is the one input that cannot be manufactured.
 */

export const dayKey = (date: Date): string => format(date, 'yyyy-MM-dd');

/** Was this task open (not yet completed or dropped) at the given instant? */
export const openAt = (task: Task, at: Date): boolean =>
  new Date(task.createdAt) <= at &&
  (!task.completedAt || new Date(task.completedAt) > at) &&
  (!task.droppedAt || new Date(task.droppedAt) > at);

export const isOpen = (task: Task): boolean => !task.completedAt && !task.droppedAt;

export const ageDays = (task: Task, now: Date = new Date()): number =>
  Math.max(0, differenceInCalendarDays(now, new Date(task.createdAt)));

export const pushCount = (task: Task): number => task.pushedOn?.length ?? 0;

export const openTasks = (tasks: Task[]): Task[] => tasks.filter(isOpen);

// --- The anchor -------------------------------------------------------------

export interface Anchor {
  task: Task;
  days: number;
}

/**
 * Age of the oldest open task — the backbone metric.
 *
 * It is the structural twin of a Quit's clean-day counter, inverted: a clock
 * that advances on its own in the wrong direction and that you cannot
 * influence except by actually doing the thing. Adding tasks cannot improve it
 * (a new task's age of 0 is never the maximum), clearing easy new tasks cannot
 * improve it, and splitting a task into sub-tasks cannot improve it.
 *
 * Its one gaming route is dropping the oldest task, which is why `resolved()`
 * reports drops alongside completions and why the anchor history marks
 * drop-caused falls differently.
 */
export const anchor = (tasks: Task[], now: Date = new Date()): Anchor | null => {
  const open = openTasks(tasks);
  if (open.length === 0) return null;
  let best = open[0];
  for (const task of open) {
    if (new Date(task.createdAt) < new Date(best.createdAt)) best = task;
  }
  return { task: best, days: ageDays(best, now) };
};

// --- Age cohorts ------------------------------------------------------------

export interface Cohort {
  label: string;
  count: number;
  maxDays: number;
}

const COHORT_BANDS: { maxDays: number; label: string }[] = [
  { maxDays: 7, label: '< 1 wk' },
  { maxDays: 30, label: '1-4 wk' },
  { maxDays: 90, label: '1-3 mo' },
  { maxDays: 365, label: '3-12 mo' },
  { maxDays: Infinity, label: '1 yr+' },
];

/**
 * The open list bucketed by how long each item has waited.
 *
 * Deliberately ABSOLUTE COUNTS, never percentages: a "% fresh" figure would
 * rise every time you write something down, which would reward logging over
 * doing. The bottom bands cannot be inflated or deflated by adding at all.
 */
export const cohorts = (tasks: Task[], now: Date = new Date()): Cohort[] => {
  const open = openTasks(tasks);
  return COHORT_BANDS.map(band => ({
    label: band.label,
    maxDays: band.maxDays,
    count: 0,
  })).map((cohort, i) => {
    const lower = i === 0 ? -1 : COHORT_BANDS[i - 1].maxDays;
    return {
      ...cohort,
      count: open.filter(t => {
        const age = ageDays(t, now);
        return age > lower && age <= COHORT_BANDS[i].maxDays;
      }).length,
    };
  });
};

/**
 * Cohorts are only meaningful once there is a spread to show. With three
 * tasks all created this week the "distribution" is one bar, which is theater.
 */
export const cohortsAreMeaningful = (tasks: Task[], now: Date = new Date()): boolean => {
  const open = openTasks(tasks);
  return open.length >= 3 && open.some(t => ageDays(t, now) > 7);
};

// --- Anchor history ---------------------------------------------------------

export interface AnchorPoint {
  weekStart: Date;
  days: number | null;
  /** The previous anchor left by being dropped rather than finished. */
  fellBecauseDropped: boolean;
}

/**
 * The oldest-open age, week by week.
 *
 * This is the most informative picture in the whole feature and it needs no
 * caption: age grows exactly one day per day with zero action, so an unbroken
 * 45-degree diagonal IS the statement "nothing has been resolved". The only
 * thing that can bend the line is clearing the oldest item.
 *
 * Returns null when there is not yet enough history for a trend to mean
 * anything — a line through two points is a lie.
 */
export const anchorHistory = (
  tasks: Task[],
  weeks = 12,
  now: Date = new Date(),
): AnchorPoint[] | null => {
  if (tasks.length === 0) return null;
  const oldest = tasks.reduce((a, b) => (new Date(a.createdAt) < new Date(b.createdAt) ? a : b));
  if (differenceInCalendarDays(now, new Date(oldest.createdAt)) < 28) return null;

  const thisWeek = startOfWeek(now, { weekStartsOn: 1 });
  const points: AnchorPoint[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(thisWeek);
    weekStart.setDate(weekStart.getDate() - i * 7);
    // Measure at the end of that week (or now, for the current one).
    const at = new Date(weekStart);
    at.setDate(at.getDate() + 6);
    at.setHours(23, 59, 59, 999);
    const measureAt = at > now ? now : at;

    const openThen = tasks.filter(t => openAt(t, measureAt));
    const days = openThen.length
      ? Math.max(...openThen.map(t => differenceInCalendarDays(measureAt, new Date(t.createdAt))))
      : null;

    // A step down looks the same whether the item was finished or abandoned,
    // so mark the abandoned case — it is a different fact about the week.
    const previous = points[points.length - 1];
    const droppedThisWeek = tasks.some(
      t => t.droppedAt && new Date(t.droppedAt) > weekStart && new Date(t.droppedAt) <= measureAt,
    );
    const fell = previous?.days != null && days != null && days < previous.days;

    points.push({ weekStart, days, fellBecauseDropped: Boolean(fell && droppedThisWeek) });
  }

  return points;
};

// --- Typical wait -----------------------------------------------------------

/**
 * Median days from creation to completion, over a recent window.
 *
 * Median rather than mean: one three-year garage would drag a mean into
 * meaninglessness, and then that single event *improving* the number by aging
 * out of the window would be nonsense.
 *
 * This one IS gameable — add a task, tick it, the median falls — which is
 * exactly why it is never a headline. It exists to be read against the anchor:
 * a small typical wait next to a 200-day anchor is the actual diagnosis, "you
 * do the easy new ones and the pile is untouched", and that is only visible
 * with both numbers on screen together.
 */
export const typicalWait = (tasks: Task[], windowDays = 180, now: Date = new Date()): number | null => {
  const done = tasks.filter(
    t => t.completedAt && differenceInCalendarDays(now, new Date(t.completedAt)) <= windowDays,
  );
  if (done.length < 5) return null;
  const waits = done
    .map(t => differenceInCalendarDays(new Date(t.completedAt!), new Date(t.createdAt)))
    .sort((a, b) => a - b);
  const mid = Math.floor(waits.length / 2);
  return waits.length % 2 ? waits[mid] : Math.round((waits[mid - 1] + waits[mid]) / 2);
};

// --- Rescues ----------------------------------------------------------------

export const RESCUE_THRESHOLD_DAYS = 30;

export interface Rescues {
  lifetime: number;
  last90: number;
  oldestRescueDays: number;
}

/**
 * Completions of things that had been waiting a long time.
 *
 * The only COUNT in this module that survives the add-a-task test, because its
 * input is elapsed time: you cannot fabricate a 30-day-old task, you can only
 * wait 30 real days. That also makes it the one honest place for a badge, and
 * the right home for the encouraging moment — "cleared after 212 days" is a
 * computed fact, not fabricated praise.
 *
 * Returns null until a rescue has ever been *possible*, because showing
 * "0 rescues" to someone three weeks in is a shaming zero with no information.
 */
export const rescues = (tasks: Task[], now: Date = new Date()): Rescues | null => {
  const everCouldRescue = tasks.some(t => {
    const end = t.completedAt ? new Date(t.completedAt) : t.droppedAt ? new Date(t.droppedAt) : now;
    return differenceInCalendarDays(end, new Date(t.createdAt)) >= RESCUE_THRESHOLD_DAYS;
  });
  if (!everCouldRescue) return null;

  const rescued = tasks
    .filter(t => t.completedAt)
    .map(t => ({
      task: t,
      waited: differenceInCalendarDays(new Date(t.completedAt!), new Date(t.createdAt)),
      when: new Date(t.completedAt!),
    }))
    .filter(r => r.waited >= RESCUE_THRESHOLD_DAYS);

  return {
    lifetime: rescued.length,
    last90: rescued.filter(r => differenceInCalendarDays(now, r.when) <= 90).length,
    oldestRescueDays: rescued.reduce((max, r) => Math.max(max, r.waited), 0),
  };
};

// --- Resolved ---------------------------------------------------------------

export interface Resolved {
  completed: number;
  dropped: number;
}

/**
 * Two counts, deliberately NOT a rate.
 *
 * A drop rate has no honest good direction. Low is not good (you never admit a
 * task is dead, so the list fills with debt and the anchor becomes noise).
 * High is not good (you are deleting instead of doing). A percentage implies a
 * direction that does not exist. Two bare counts imply nothing, and the user
 * reads them against the anchor.
 */
export const resolved = (tasks: Task[], windowDays = 180, now: Date = new Date()): Resolved => ({
  completed: tasks.filter(
    t => t.completedAt && differenceInCalendarDays(now, new Date(t.completedAt)) <= windowDays,
  ).length,
  dropped: tasks.filter(
    t => t.droppedAt && differenceInCalendarDays(now, new Date(t.droppedAt)) <= windowDays,
  ).length,
});

// --- XP ---------------------------------------------------------------------

const SIZE_XP: { [key in TaskSize]: number } = {
  [TaskSize.QUICK]: 10,
  [TaskSize.MEDIUM]: 20,
  [TaskSize.BIG]: 35,
};

/**
 * XP for clearing a task: a base by size, multiplied by an age factor that is
 * sub-linear and strictly bounded below 2.
 *
 * The perverse incentive is real and has to be closed deliberately — if
 * letting something rot paid well, the game would be teaching exactly the
 * behaviour it exists to cure. The bound does it by construction:
 *
 *     factor = 1 + min(0.95, log2(1 + waited/30) / 4)   ->  always < 2
 *
 * so clearing something that waited a year is worth almost, but never quite,
 * double — and therefore never beats simply doing two ordinary tasks now.
 * Expressing the bonus as a MULTIPLE of the base rather than a flat amount is
 * what makes that invariant hold for every size at once; a flat bonus large
 * enough to feel meaningful on a big job would have broken it on a quick one.
 *
 * Two further guards: the base is small, so the reward tracks age cleared
 * rather than items ticked and splitting one job into fourteen sub-tasks is
 * not an exploit; and the anchor climbs the entire time you would be farming,
 * so the headline metric punishes the strategy live.
 */
export const ageXpFactor = (waitedDays: number): number =>
  1 + Math.min(0.95, Math.log2(1 + Math.max(0, waitedDays) / 30) / 4);

export const taskXp = (task: Task, completedAt: Date = new Date()): number => {
  const base = SIZE_XP[task.size] ?? SIZE_XP[TaskSize.MEDIUM];
  const waited = Math.max(0, differenceInCalendarDays(completedAt, new Date(task.createdAt)));
  // Floor, not round: rounding a factor of 1.95 on a base of 10 gives 20,
  // which is exactly two fresh quick tasks — the bound has to survive the
  // last integer, not just the algebra.
  return Math.floor(base * ageXpFactor(waited));
};

// --- The daily pick ---------------------------------------------------------

/**
 * Choose the one task to offer today.
 *
 * A pure function of the task list and the date: every input to the score is
 * either a whole-day age or a stored count, so the answer cannot change
 * between two opens on the same day. That is what makes declining a decision
 * rather than a reroll — and it needs no "last offered" field, which would
 * have cost a storage write on every app open to buy the same guarantee.
 *
 * Rules, in order of importance:
 *   - a task declined today is not offered again today;
 *   - age dominates, because that is the thing the feature exists to fix;
 *   - but a big job is not offered every single day, because being shown the
 *     most aversive item daily is how a user learns to ignore the card;
 *   - a real due date that is close outranks everything.
 */
export const pickDailyTask = (tasks: Task[], now: Date = new Date()): Task | null => {
  const today = dayKey(now);
  const open = openTasks(tasks).filter(t => !t.pushedOn?.includes(today));
  if (open.length === 0) return null;

  const score = (task: Task): number => {
    const age = ageDays(task, now);
    let s = age;

    // A genuine deadline within a fortnight outranks age entirely.
    if (task.dueDate) {
      const daysLeft = differenceInCalendarDays(new Date(task.dueDate), now);
      if (daysLeft <= 14) s += 1000 - daysLeft * 10;
    }

    // Damp the biggest jobs so they surface regularly without dominating.
    if (task.size === TaskSize.BIG) s *= 0.6;
    if (task.size === TaskSize.QUICK) s *= 1.15;

    // Something declined many times recently gets a short rest rather than
    // being pushed in the user's face every morning.
    const pushes = pushCount(task);
    s -= Math.min(pushes, 10) * 2;

    return s;
  };

  return open.reduce((best, task) => (score(task) > score(best) ? task : best));
};

/** Tasks that can be started right now in a short window. */
export const quickWins = (tasks: Task[], limit = 3): Task[] =>
  openTasks(tasks)
    .filter(t => t.size === TaskSize.QUICK)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(0, limit);

export const byCategory = (tasks: Task[]): { [key in HabitCategory]?: number } =>
  openTasks(tasks).reduce((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + 1;
    return acc;
  }, {} as { [key in HabitCategory]?: number });
