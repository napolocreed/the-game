import { Habit } from '../types';

const STREAK_BONUS_MULTIPLIER = 0.1; // 10% per day

export const calculateXP = (habit: Habit): number => {
  let finalXP = habit.xpReward;

  // Streak bonus applies from the second day of the streak onwards
  // It's calculated on the current streak *before* it's incremented
  if (habit.streak > 0) {
    finalXP *= (1 + habit.streak * STREAK_BONUS_MULTIPLIER);
  }

  return Math.floor(finalXP);
};

/**
 * XP to advance FROM `level` to the next one.
 *
 * The original curve was 100 × 1.5^(level−1) — exponential, so every level
 * cost half again as much as the last, forever. That put level 17 at roughly a
 * year of steady play, level 20 at three years and level 25 at twenty-three.
 * Levels stopped arriving right where the game needed them most, and there was
 * nowhere to hang a long-term reward.
 *
 * A gentle power curve keeps them coming without ever making one free. For a
 * steadily engaged player (~400 XP/day) that is level 30 at one year, 40 at
 * two and about 59 at five — a level every three weeks in the mid game and
 * every couple of months deep in the tail.
 */
const CURVE_BASE = 120;
const CURVE_POWER = 1.35;

export const calculateXpToNextLevel = (level: number): number =>
  Math.round(CURVE_BASE * Math.pow(Math.max(1, level), CURVE_POWER));

/** Total XP required to have REACHED `level` from scratch. */
export const totalXpForLevel = (level: number): number => {
  let sum = 0;
  for (let i = 1; i < level; i++) sum += calculateXpToNextLevel(i);
  return sum;
};

export interface LevelState {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
}

/**
 * Derive the whole level state from lifetime XP alone.
 *
 * `totalXP` is the ground truth — it is the sum of everything actually earned
 * — so a curve change is a recalculation, never a loss. This is what the
 * migration uses, and it is also the honest way to answer "what level am I?"
 * at any time.
 */
export const levelFromTotalXP = (totalXP: number): LevelState => {
  let level = 1;
  let remaining = Math.max(0, totalXP);
  // Bounded: the curve makes level 999 unreachable by many orders of
  // magnitude, so this is a safety rail rather than a real limit.
  while (level < 999) {
    const cost = calculateXpToNextLevel(level);
    if (remaining < cost) break;
    remaining -= cost;
    level += 1;
  }
  return { level, currentXP: remaining, xpToNextLevel: calculateXpToNextLevel(level) };
};

/**
 * Re-derive a stored profile under the current curve, without ever demoting.
 *
 * The old curve was cheaper than this one for the first ten levels, so a
 * straight recomputation would take levels away from an existing player the
 * moment they opened the app. A level was earned under the rules in force at
 * the time; taking it back is not a recalculation, it is a punishment for
 * having played early. So the level is floored at whatever the profile already
 * held, and only the progress toward the NEXT one is reset in that case.
 *
 * The invariant this trades away is "level is a pure function of totalXP".
 * What holds instead, deliberately, is `level >= levelFromTotalXP(totalXP)`.
 */
export const migrateLevel = (stored: { level: number; totalXP: number }): LevelState => {
  const derived = levelFromTotalXP(stored.totalXP);
  if (derived.level >= stored.level) return derived;
  return {
    level: stored.level,
    currentXP: 0,
    xpToNextLevel: calculateXpToNextLevel(stored.level),
  };
};

/** Bumped when the curve changes, so saves are recalculated exactly once. */
export const XP_CURVE_VERSION = 2;
