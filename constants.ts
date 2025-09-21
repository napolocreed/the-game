
import { HabitCategory, HabitType, PreConfiguredHabit, TemplateHabit } from './types';

export const PRE_CONFIGURED_HABITS: PreConfiguredHabit[] = [
  // Health & Sport
  { name: 'Run', category: HabitCategory.HEALTH, type: HabitType.BUILD },
  { name: 'Workout', category: HabitCategory.HEALTH, type: HabitType.BUILD },
  { name: 'Daily Walk', category: HabitCategory.HEALTH, type: HabitType.MAINTAIN },
  { name: 'Stretch / Yoga', category: HabitCategory.HEALTH, type: HabitType.BUILD },
  { name: 'Stay Hydrated', category: HabitCategory.HEALTH, type: HabitType.MAINTAIN },
  
  // Wellness
  { name: 'Reduce Smoking', category: HabitCategory.WELLNESS, type: HabitType.REDUCE },
  { name: 'No Alcohol', category: HabitCategory.WELLNESS, type: HabitType.REDUCE },
  { name: 'Meditate', category: HabitCategory.WELLNESS, type: HabitType.BUILD },
  { name: 'Consistent Sleep', category: HabitCategory.WELLNESS, type: HabitType.MAINTAIN },

  // Productivity
  { name: 'Focused Work (Pomodoro)', category: HabitCategory.PRODUCTIVITY, type: HabitType.BUILD },
  { name: 'Limit Screen Time', category: HabitCategory.PRODUCTIVITY, type: HabitType.REDUCE },
  { name: 'Read', category: HabitCategory.PRODUCTIVITY, type: HabitType.BUILD },
  { name: 'Study / Learn', category: HabitCategory.PRODUCTIVITY, type: HabitType.BUILD },

  // Lifestyle
  { name: 'Cook a Meal', category: HabitCategory.LIFESTYLE, type: HabitType.BUILD },
  { name: 'Tidy Up', category: HabitCategory.LIFESTYLE, type: HabitType.MAINTAIN },
  { name: 'Social Contact', category: HabitCategory.LIFESTYLE, type: HabitType.BUILD },
];

export const SCHEDULED_HABIT_TEMPLATES: TemplateHabit[] = [
  { 
    name: 'Weekend Workout', 
    category: HabitCategory.HEALTH, 
    type: HabitType.BUILD, 
    scheduleDays: [0, 6] // Sunday, Saturday
  },
  { 
    name: 'Sunday Cooking Prep', 
    category: HabitCategory.LIFESTYLE, 
    type: HabitType.BUILD, 
    scheduleDays: [0] // Sunday
  },
  { 
    name: 'No Alcohol Weekdays', 
    category: HabitCategory.WELLNESS, 
    type: HabitType.REDUCE, 
    scheduleDays: [1, 2, 3, 4, 5] // Mon-Fri
  },
  { 
    name: 'Non Smoking Weekdays', 
    category: HabitCategory.WELLNESS, 
    type: HabitType.REDUCE, 
    scheduleDays: [1, 2, 3, 4, 5] // Mon-Fri
  },
  {
    name: 'Daily Morning Stretch',
    category: HabitCategory.HEALTH,
    type: HabitType.BUILD,
    scheduleDays: [0, 1, 2, 3, 4, 5, 6]
  },
  {
    name: 'Tidy Up Before Bed',
    category: HabitCategory.LIFESTYLE,
    type: HabitType.MAINTAIN,
    scheduleDays: [0, 1, 2, 3, 4, 5, 6]
  }
];
