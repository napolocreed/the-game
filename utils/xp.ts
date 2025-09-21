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

export const calculateXpToNextLevel = (level: number): number => {
    // A common formula for XP progression in games
    return Math.floor(100 * Math.pow(1.5, level - 1));
};