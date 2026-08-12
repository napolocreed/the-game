import { HabitCategory } from '../types';

// Shared categorical palette. These four hues were validated (all pairs, on
// the app's dark chart surface) for color-vision-deficiency separation and
// normal-vision distinctness — the previous blue/purple pair was
// indistinguishable under deuteranopia. Category names are always printed
// next to the color, so identity never rides on color alone.
export const CATEGORY_HEX: { [key in HabitCategory]: string } = {
  [HabitCategory.HEALTH]: '#c84141',
  [HabitCategory.WELLNESS]: '#4185c8',
  [HabitCategory.PRODUCTIVITY]: '#d147af',
  [HabitCategory.LIFESTYLE]: '#3b9b73',
};
