import React from 'react';
import { HabitCategory } from '../../types';
import { pixelIcon } from './pixelIcon';

// One distinct silhouette per category. Colour tells them apart at a glance,
// but the shape (and the printed name) is what makes them readable when the
// colour is unavailable — screenshots, print, colour-vision deficiency.

export const HealthIcon = pixelIcon([
  '................',
  '.......xx.......',
  '......xx........',
  '.....xx.........',
  '..xxx.xx.xxx....',
  '.xxxxxxxxxxxxx..',
  'xxxxxxxxxxxxxxx.',
  'xxxxxxxxxxxxxxx.',
  'xxxxxxxxxxxxxxx.',
  'xxxxxxxxxxxxxxx.',
  '.xxxxxxxxxxxxx..',
  '.xxxxxxxxxxxxx..',
  '..xxxxx.xxxxx...',
  '...xxx...xxx....',
  '................',
  '................',
]);

// A crescent — rest and calm. A water droplet was tried first and read as a
// pear at 12px, which is the whole point of checking the rendered sheet.
export const WellnessIcon = pixelIcon([
  '................',
  '.....xxxxxx.....',
  '...xxxxxx.......',
  '..xxxxxx........',
  '.xxxxxx.........',
  '.xxxxxx.........',
  'xxxxxxx.........',
  'xxxxxx..........',
  'xxxxxx..........',
  'xxxxxxx.........',
  '.xxxxxx.........',
  '.xxxxxx.........',
  '..xxxxxx........',
  '...xxxxxx.......',
  '.....xxxxxx.....',
  '................',
]);

export const ProductivityIcon = pixelIcon([
  '................',
  '..........xxxx..',
  '.........xxxx...',
  '........xxxx....',
  '.......xxxx.....',
  '......xxxxxxxx..',
  '.....xxxxxxxx...',
  '....xxxx..xxx...',
  '.........xxx....',
  '........xxx.....',
  '.......xxx......',
  '......xxx.......',
  '.....xxx........',
  '....xxx.........',
  '...xxx..........',
  '................',
]);

export const LifestyleIcon = pixelIcon([
  '................',
  '.......xx.......',
  '.......xx.......',
  '.x.....xx.....x.',
  '..xx........xx..',
  '.....xxxxxx.....',
  '....xxxxxxxx....',
  'xx..xxxxxxxx..xx',
  'xx..xxxxxxxx..xx',
  '....xxxxxxxx....',
  '.....xxxxxx.....',
  '..xx........xx..',
  '.x.....xx.....x.',
  '.......xx.......',
  '.......xx.......',
  '................',
]);

export const CATEGORY_ICONS: { [key in HabitCategory]: React.FC<React.SVGProps<SVGSVGElement>> } = {
  [HabitCategory.HEALTH]: HealthIcon,
  [HabitCategory.WELLNESS]: WellnessIcon,
  [HabitCategory.PRODUCTIVITY]: ProductivityIcon,
  [HabitCategory.LIFESTYLE]: LifestyleIcon,
};
