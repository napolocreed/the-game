import type React from 'react';

export enum HabitType {
  BUILD = 'build',
  REDUCE = 'reduce',
  MAINTAIN = 'maintain'
}

export enum HabitCategory {
  HEALTH = 'Health',
  WELLNESS = 'Wellness',
  PRODUCTIVITY = 'Productivity',
  LIFESTYLE = 'Lifestyle'
}

export interface Habit {
  id: string;
  name: string;
  type: HabitType;
  category: HabitCategory;
  streak: number;
  lastCompleted: string | null; // ISO Date string of last SUCCESSFUL completion
  createdAt: string; // ISO Date string
  difficulty: string;
  xpReward: number;
  completionCount: number;
  scheduleDays: number[]; // Array of numbers 0-6 (Sun-Sat)
  reminderTime?: string | null;
  isArchived?: boolean;
  order?: number;
  duplicatedFromId?: string;
}

export interface PlayerSettings {
  dailyHabitLimit: number | null;
}

export interface PlayerProfile {
  level: number;
  totalXP: number;
  currentXP: number;
  xpToNextLevel: number;
  unlockedBadges: { [badgeId: string]: number }; // e.g., { 'streak-master': 2 } for Silver tier
  totalQuestsCompleted?: number;
  settings?: PlayerSettings;
  /** Which XP curve this profile's level was computed under. Absent means the
   *  original exponential curve; the migration recalculates from totalXP. */
  curveVersion?: number;
}

export interface PreConfiguredHabit {
  name: string;
  category: HabitCategory;
  type: HabitType;
}

export interface TemplateHabit {
    name: string;
    category: HabitCategory;
    type: HabitType;
    scheduleDays: number[]; // 0-6 for Sun-Sat
}

export enum QuestType {
  COUNT = 'count',
  STREAK = 'streak',
  RESIST_URGE = 'resist_urge', // ride out N urges with the breathing tool
  JOURNAL = 'journal', // write a journal note for today
}

export interface Quest {
  id:string;
  type: QuestType;
  title: string;
  description: string;
  objective: {
    target: number;
    category?: HabitCategory;
    habitType?: HabitType;
  };
  xpReward: number;
  progress: number;
  isCompleted: boolean;
}

export interface BadgeTier {
    tier: number; // 1 for Bronze, 2 for Silver, etc.
    name: string;
    description: string;
    target: number;
    xpReward: number;
}

/** Everything a badge may measure. A named context rather than a positional
 *  list: the fifth positional argument is where a wrong-order call silently
 *  reads one entity as another, and this codebase has no test suite to catch
 *  it — the compiler is the only gate, so give it something to check. */
export interface BadgeContext {
    profile: PlayerProfile;
    habits: Habit[];
    completions: Completion[];
    quits: Quit[];
    tasks: Task[];
}

export interface Badge {
    id: string; // e.g., 'streak-master'
    baseName: string; // "Streak Master"
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    tiers: BadgeTier[];
    getProgress: (ctx: BadgeContext) => number;
}


// --- Recovery / "Boss Fights" ---
// A Quit tracks abstinence from something (an addiction, a bad habit to break).
// Unlike daily habits, progress is measured in continuous clean time, and a
// relapse never erases history: best streak and total clean days are permanent.

export interface Relapse {
  date: string; // ISO Date string
  note?: string; // optional context note
  trigger?: string; // optional trigger tag (see TRIGGER_OPTIONS)
}

export interface UrgeEvent {
  date: string; // ISO Date string
  trigger?: string; // optional trigger tag
}

export interface SavingsGoal {
  name: string; // what the saved money goes toward, e.g. "PS5"
  price: number;
}

export interface Quit {
  id: string;
  name: string;
  createdAt: string; // ISO Date string (when tracking started in the app)
  firstStartDate: string; // ISO Date string (start of the very first streak, may be backdated)
  startDate: string; // ISO Date string (start of the CURRENT streak = last relapse or firstStartDate)
  relapses: Relapse[];
  urgesResisted: number; // lifetime count
  urgesTodayDate: string | null; // day key of the last resisted urge (for the daily XP cap)
  urgesToday: number;
  urgeLog?: UrgeEvent[]; // dated urges (newer field; urgesResisted predates it)
  motivation?: string; // the user's own "why I quit", shown while riding out an urge
  costPerDay?: number | null; // optional money saved per clean day
  savingsGoal?: SavingsGoal | null; // optional concrete reward the savings go toward
  milestonesAwarded: number[]; // milestone day-counts already rewarded for the current streak
  isArchived?: boolean;
}

// --- One-shot tasks ---
// The third failure mode. A Habit fails by breaking its chain; a Quit fails by
// relapsing; a Task fails by never being started. Streaks and completion rate
// say nothing about it, because there is no schedule and therefore no
// denominator. The only signal a never-started task emits is its AGE.
//
// Everything downstream is derived from three immutable timestamps, so the
// exact open set at any past date can be recomputed rather than remembered.
// Two rules make that hold, and both are load-bearing:
//   1. createdAt is never editable — it is the clock.
//   2. Un-completing clears completedAt but never touches createdAt, so
//      complete-then-reopen cannot be used as an age reset.

export enum TaskSize {
  QUICK = 'quick',   // under ~15 minutes
  MEDIUM = 'medium', // an hour-ish
  BIG = 'big',       // an afternoon, or needs breaking down
}

export interface Task {
  id: string;
  name: string;
  category: HabitCategory; // reuses the habit vocabulary, so tasks feed the same category stats
  size: TaskSize;
  /** ISO. THE CLOCK. May be backdated AT CREATION ONLY — "how long have you
   *  been putting this off?" — following the Quit backdating precedent. That
   *  avoidance is real, and starting every task at 0d would make the whole
   *  feature inert for its first month. Never editable afterwards. */
  createdAt: string;
  completedAt: string | null;
  droppedAt: string | null; // explicit "I am not doing this" — a decision, not a failure
  /** Real deadlines only (an appointment, an administrative cutoff). Never
   *  invented, never suggested: a fake due date teaches you to ignore red. */
  dueDate?: string | null;
  /** Day keys on which the daily pick was declined. Length is the push count. */
  pushedOn: string[];
  xpGained?: number; // recorded at completion so undo can refund exactly
  note?: string;
}

// --- Skins ---
// The only thing in the app that turns a level-up into something you can see.
// A skin repaints every surface by overriding colour tokens; rarer ones also
// change the MATERIAL (border weight, shadow depth, surface texture), and a
// few change with the age of the account itself.

export type SkinRarity = 'common' | 'rare' | 'epic' | 'legend';

export type SkinUnlock =
  | { kind: 'default' }
  | { kind: 'level'; level: number }
  | { kind: 'badge'; badgeId: string; tier: number }
  | { kind: 'feat'; featId: string }
  /** Days since the account's first recorded activity. The one reward that
   *  cannot be bought, rushed, or farmed — only outlived. */
  | { kind: 'seniority'; days: number };

/** Beyond colour: the physical character of the interface. */
export interface SkinMaterial {
  /** Border width in px for the main frame (default 4). */
  borderWidth?: number;
  /** Hard shadow offsets, e.g. '8px 8px 0px' and '4px 4px 0px'. */
  shadowFar?: string;
  shadowNear?: string;
  /** A repeating CSS background painted over the canvas: scanlines, grain,
   *  weave. Must be cheap and tile seamlessly. */
  texture?: string;
  /** Overlay drawn above everything (vignette, CRT curve). Pointer-events none. */
  overlay?: string;
  /** Moving weather: rain, petals, embers, drifting stars. */
  fx?: SkinFx;
  /** A text-shadow put on accent and title text — how a skin glows. */
  glow?: string;
}

/**
 * One animated layer of a skin's weather.
 *
 * Deliberately small: a seamless tiled sprite translated by exactly its own
 * tile size. That keeps every effect a single compositor-driven transform
 * rather than a per-frame repaint, and keeps the loop invisible.
 */
export interface SkinFxLayer {
  /** Tiled background image for the layer. */
  image: string;
  /** Tile size in px — also the exact distance the layer travels per cycle. */
  tile: number;
  /** Seconds per cycle. */
  duration: number;
  motion: 'fall' | 'rise' | 'sweep';
}

export interface SkinFx {
  /** The near layer. */
  a: SkinFxLayer;
  /** An optional far layer, for parallax. */
  b?: SkinFxLayer;
}

export interface Skin {
  id: string;
  name: string;
  blurb: string;
  rarity: SkinRarity;
  unlock: SkinUnlock;
  /** Overrides applied on top of the Classic token set. A partial rather than
   *  a full set so a token added later inherits a sane value everywhere
   *  instead of rendering transparent in forty skins at once. */
  tokens: Record<string, string>;
  material?: SkinMaterial;
  /** This skin changes as the account ages: moss creeps in, the frame cracks. */
  livingId?: string;
}

export interface DayNote {
  mood?: number; // 1 (worst) to 5 (best)
  text?: string;
}

export enum CompletionStatus {
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export interface Completion {
  id: string;
  habitId: string;
  date: string; // ISO Date string
  habitCategory: HabitCategory;
  status: CompletionStatus;
  xpGained?: number;
  questsAffected?: { questId: string, progressBefore: number, wasCompleted: boolean }[];
  streakBefore?: number;
}