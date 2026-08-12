import { pixelIcon } from './pixelIcon';

/** A pinned notice — the tab and section marker for one-shot tasks. */
export const NoticeIcon = pixelIcon([
  '................',
  '.......xx.......',
  '......xxxx......',
  '.......xx.......',
  '..xxxxxxxxxxxx..',
  '..x..........x..',
  '..x.xxxxxxxx.x..',
  '..x..........x..',
  '..x.xxxxxxxx.x..',
  '..x..........x..',
  '..x.xxxxx....x..',
  '..x..........x..',
  '..xxxxxxxxxxxx..',
  '................',
  '................',
  '................',
]);

/** An hourglass: the age of a task is the only honest signal it emits. */
export const HourglassIcon = pixelIcon([
  '................',
  '..xxxxxxxxxxxx..',
  '..xxxxxxxxxxxx..',
  '...xxxxxxxxxx...',
  '....xxxxxxxx....',
  '.....xxxxxx.....',
  '......xxxx......',
  '.......xx.......',
  '.......xx.......',
  '......xxxx......',
  '.....xx..xx.....',
  '....xx....xx....',
  '...xxxxxxxxxx...',
  '..xxxxxxxxxxxx..',
  '..xxxxxxxxxxxx..',
  '................',
]);

/** "Not today" — a task pushed to another day. */
export const SnoozeIcon = pixelIcon([
  '................',
  '................',
  '..xxxxxxxx......',
  '.......xx.......',
  '......xx........',
  '.....xx.........',
  '....xx..........',
  '..xxxxxxxx......',
  '................',
  '......xxxxxxxx..',
  '...........xx...',
  '..........xx....',
  '.........xx.....',
  '........xx......',
  '......xxxxxxxx..',
  '................',
]);

/** Size markers: one, two or three blocks. */
export const SizeQuickIcon = pixelIcon([
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '.....xxxxxx.....',
  '.....xxxxxx.....',
  '.....xxxxxx.....',
  '.....xxxxxx.....',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
]);

export const SizeMediumIcon = pixelIcon([
  '................',
  '................',
  '................',
  '................',
  '..xxxxxx........',
  '..xxxxxx........',
  '..xxxxxx........',
  '..xxxxxx........',
  '........xxxxxx..',
  '........xxxxxx..',
  '........xxxxxx..',
  '........xxxxxx..',
  '................',
  '................',
  '................',
  '................',
]);

export const SizeBigIcon = pixelIcon([
  '................',
  '................',
  '..xxxx..........',
  '..xxxx..........',
  '..xxxx..........',
  '......xxxx......',
  '......xxxx......',
  '......xxxx......',
  '..........xxxx..',
  '..........xxxx..',
  '..........xxxx..',
  '................',
  '..xxxxxxxxxxxx..',
  '..xxxxxxxxxxxx..',
  '................',
  '................',
]);
