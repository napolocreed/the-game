import { Quest, HabitCategory, Habit, QuestType, HabitType } from '../types';

interface QuestTemplate {
  type: QuestType;
  title: string;
  description: string;
  objective: {
    target: number;
    category?: HabitCategory;
    habitType?: HabitType;
  };
  xpReward: number;
  context: 'any' | 'weekday' | 'weekend';
}

const QUEST_POOL: QuestTemplate[] = [
  // === GENERIC COUNT QUESTS ===
  {
    type: QuestType.COUNT,
    title: 'First Step of the Day',
    description: 'Momentum is key. Complete any 1 habit.',
    objective: { target: 1 },
    xpReward: 20,
    context: 'any',
  },
  {
    type: QuestType.COUNT,
    title: 'Double Down',
    description: 'Two is better than one. Complete any 2 habits.',
    objective: { target: 2 },
    xpReward: 40,
    context: 'any',
  },
  {
    type: QuestType.COUNT,
    title: 'Trifecta',
    description: 'A trio of success! Complete any 3 habits.',
    objective: { target: 3 },
    xpReward: 60,
    context: 'any',
  },
  {
    type: QuestType.COUNT,
    title: 'Power Through',
    description: 'Show your dedication. Complete 5 habits today.',
    objective: { target: 5 },
    xpReward: 100,
    context: 'any',
  },
  {
    type: QuestType.COUNT,
    title: 'Habit Spree',
    description: 'An incredible display of commitment. Complete 7 habits today.',
    objective: { target: 7 },
    xpReward: 150,
    context: 'any',
  },
  
  // === CATEGORY COUNT QUESTS ===
  {
    type: QuestType.COUNT,
    title: 'Healthy Start',
    description: 'Focus on your physical health. Complete 1 Health habit.',
    objective: { target: 1, category: HabitCategory.HEALTH },
    xpReward: 30,
    context: 'any',
  },
  {
    type: QuestType.COUNT,
    title: 'Healthy Habits',
    description: 'A healthy routine in action. Complete 2 Health habits.',
    objective: { target: 2, category: HabitCategory.HEALTH },
    xpReward: 50,
    context: 'any',
  },
  {
    type: QuestType.COUNT,
    title: 'Mindful Moment',
    description: 'Take care of your mental state. Complete 1 Wellness habit.',
    objective: { target: 1, category: HabitCategory.WELLNESS },
    xpReward: 30,
    context: 'any',
  },
  {
    type: QuestType.COUNT,
    title: 'Self-Care Session',
    description: 'Invest in your well-being. Complete 2 Wellness habits.',
    objective: { target: 2, category: HabitCategory.WELLNESS },
    xpReward: 50,
    context: 'any',
  },
  {
    type: QuestType.COUNT,
    title: 'Productivity Boost',
    description: 'Get the ball rolling. Complete 1 Productivity habit.',
    objective: { target: 1, category: HabitCategory.PRODUCTIVITY },
    xpReward: 35,
    context: 'weekday',
  },
  {
    type: QuestType.COUNT,
    title: 'Workday Hustle',
    description: 'Boost your professional life. Complete 2 Productivity habits.',
    objective: { target: 2, category: HabitCategory.PRODUCTIVITY },
    xpReward: 55,
    context: 'weekday',
  },
    {
    type: QuestType.COUNT,
    title: 'Focused Day',
    description: 'A truly productive day. Complete 3 Productivity habits.',
    objective: { target: 3, category: HabitCategory.PRODUCTIVITY },
    xpReward: 75,
    context: 'weekday',
  },
  {
    type: QuestType.COUNT,
    title: 'Tidy Life',
    description: 'A place for everything... Complete 1 Lifestyle habit.',
    objective: { target: 1, category: HabitCategory.LIFESTYLE },
    xpReward: 30,
    context: 'any',
  },
  {
    type: QuestType.COUNT,
    title: 'Home Improvement',
    description: 'Tidy space, tidy mind. Complete 2 Lifestyle habits.',
    objective: { target: 2, category: HabitCategory.LIFESTYLE },
    xpReward: 50,
    context: 'any',
  },
  {
    type: QuestType.COUNT,
    title: 'Weekend Warrior',
    description: 'Time for action! Complete 2 Health habits this weekend.',
    objective: { target: 2, category: HabitCategory.HEALTH },
    xpReward: 50,
    context: 'weekend',
  },
  {
    type: QuestType.COUNT,
    title: 'Weekend Project',
    description: 'Make the most of your downtime. Complete 2 Lifestyle habits.',
    objective: { target: 2, category: HabitCategory.LIFESTYLE },
    xpReward: 50,
    context: 'weekend',
  },

  // === HABIT TYPE QUESTS ===
  {
    type: QuestType.COUNT,
    title: 'The Builder',
    description: 'Create something positive. Complete 2 "Build" type habits.',
    objective: { target: 2, habitType: HabitType.BUILD },
    xpReward: 50,
    context: 'any',
  },
  {
    type: QuestType.COUNT,
    title: 'The Maintainer',
    description: 'Consistency is everything. Complete 2 "Maintain" type habits.',
    objective: { target: 2, habitType: HabitType.MAINTAIN },
    xpReward: 50,
    context: 'any',
  },
  {
    type: QuestType.COUNT,
    title: 'The Reducer',
    description: 'Discipline and control. Complete 1 "Reduce" type habit.',
    objective: { target: 1, habitType: HabitType.REDUCE },
    xpReward: 60,
    context: 'any',
  },
  
  // === STREAK QUESTS ===
  {
    type: QuestType.STREAK,
    title: 'Getting Warmed Up',
    description: 'Keep it going! Achieve a 3-day streak on any habit.',
    objective: { target: 3 },
    xpReward: 75,
    context: 'any',
  },
  {
    type: QuestType.STREAK,
    title: 'Health Streak',
    description: 'Consistency is the key to health. Achieve a 3-day streak on a Health habit.',
    objective: { target: 3, category: HabitCategory.HEALTH },
    xpReward: 90,
    context: 'any',
  },
  {
    type: QuestType.STREAK,
    title: 'Productivity Machine',
    description: 'Build a productive routine. Achieve a 3-day streak on a Productivity habit.',
    objective: { target: 3, category: HabitCategory.PRODUCTIVITY },
    xpReward: 90,
    context: 'any',
  },
  {
    type: QuestType.STREAK,
    title: 'Wellness Week',
    description: 'A full week of self-care. Achieve a 7-day streak on a Wellness habit.',
    objective: { target: 7, category: HabitCategory.WELLNESS },
    xpReward: 180,
    context: 'any',
  },
    {
    type: QuestType.STREAK,
    title: 'Lifestyle Consistency',
    description: 'Making it a part of your life. Reach a 5-day streak on a Lifestyle habit.',
    objective: { target: 5, category: HabitCategory.LIFESTYLE },
    xpReward: 120,
    context: 'any',
  },
  {
    type: QuestType.STREAK,
    title: 'The Fire Within',
    description: 'You are unstoppable! Reach a 5-day streak on any habit.',
    objective: { target: 5 },
    xpReward: 150,
    context: 'any',
  },
    {
    type: QuestType.STREAK,
    title: 'Chain of Success',
    description: 'Nothing can stop you now. Reach a 7-day streak on any habit.',
    objective: { target: 7 },
    xpReward: 200,
    context: 'any',
  },
  {
    type: QuestType.STREAK,
    title: 'Unbreakable',
    description: 'A truly impressive run. Reach a 10-day streak on any habit.',
    objective: { target: 10 },
    xpReward: 250,
    context: 'any',
  },
];


// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const generateDailyQuests = (count: number = 3, habits: Habit[]): Quest[] => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

  const activeHabits = habits.filter(h => !h.isArchived);

  const possibleQuests = QUEST_POOL.filter(template => {
    // 1. Context check (weekday/weekend/any)
    if (template.context === 'weekday' && isWeekend) return false;
    if (template.context === 'weekend' && !isWeekend) return false;

    // 2. Habit availability check for COUNT quests
    if (template.type === QuestType.COUNT) {
        const { category, target, habitType } = template.objective;
        let relevantHabits = activeHabits;
        if (category) relevantHabits = relevantHabits.filter(h => h.category === category);
        if (habitType) relevantHabits = relevantHabits.filter(h => h.type === habitType);
        
        if (relevantHabits.length < target) return false;
    } 
    // 3. Habit availability check for STREAK quests
    else if (template.type === QuestType.STREAK) {
        const { category, habitType } = template.objective;
        let relevantHabits = activeHabits;
        if (category) relevantHabits = relevantHabits.filter(h => h.category === category);
        if (habitType) relevantHabits = relevantHabits.filter(h => h.type === habitType);

        if (relevantHabits.length === 0) return false;
    }
    
    return true;
  });
  
  const shuffledPool = shuffleArray(possibleQuests);
  const selectedTemplates = shuffledPool.slice(0, count);

  return selectedTemplates.map(template => ({
    id: crypto.randomUUID(),
    type: template.type,
    title: template.title,
    description: template.description,
    objective: {
      target: template.objective.target,
      category: template.objective.category,
      habitType: template.objective.habitType
    },
    xpReward: template.xpReward,
    progress: 0,
    isCompleted: false,
  }));
};