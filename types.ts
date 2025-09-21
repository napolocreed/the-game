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
    getProgress: (profile: PlayerProfile, habits: Habit[], completions: Completion[]) => number;
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