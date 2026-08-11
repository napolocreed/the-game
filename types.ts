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

export interface Badge {
    id: string; // e.g., 'streak-master'
    baseName: string; // "Streak Master"
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    tiers: BadgeTier[];
    getProgress: (profile: PlayerProfile, habits: Habit[], completions: Completion[], quits?: Quit[]) => number;
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