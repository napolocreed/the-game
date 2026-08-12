import { pixelIcon } from './pixelIcon';

// A streak is a fire, so this one is real two-tone art rather than a tinted
// glyph — the previous "flame" was a mangled sun path.
export const StreakIcon = pixelIcon(
  [
    '................',
    '.......oo.......',
    '......oooo......',
    '......oooo......',
    '.....oooooo.....',
    '.....oooooo.....',
    '....oooooooo....',
    '....ooyyyyoo....',
    '...oooyyyyooo...',
    '...ooyyyyyyoo...',
    '..oooyyyyyyooo..',
    '..ooyyyyyyyyoo..',
    '..ooyyyyyyyyoo..',
    '..ooyyyyyyyyoo..',
    '...oooyyyyooo...',
    '....oooooooo....',
  ],
  { o: '#e2571e', y: '#f7c948' },
);
