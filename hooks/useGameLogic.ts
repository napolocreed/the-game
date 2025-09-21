import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Habit, PlayerProfile, Quest, Badge, Completion, CompletionStatus, HabitCategory, HabitType, QuestType, BadgeTier, PlayerSettings } from '../types';
import { useLocalStorage } from './useLocalStorage';
// Fix: Removed 'subDays' from date-fns import as it is causing an error.
import { formatISO, differenceInCalendarDays, isSameDay } from 'date-fns';
import { calculateXP, calculateXpToNextLevel } from '../utils/xp';
import { generateDailyQuests } from '../utils/quests';
import { BADGE_CATALOG, checkAndUnlockBadges } from '../utils/badges';

// --- Push Notification Server ---
// IMPORTANT: Replace this with the URL of your deployed push server.
const PUSH_SERVER_URL = 'http://localhost:4000'; 
// IMPORTANT: This key MUST match the public key on your push server.
const VAPID_PUBLIC_KEY = 'BPhgcyf5kY_H29yV8s_1jA3S5OtT_l4aLg3g1y_aH7-pQxWz8s_R6n9n0z9g9Z3i2y_J6h9f1k2q4w0';

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}


export const useGameLogic = () => {
  const [habits, setHabits] = useLocalStorage<Habit[]>('habits', []);
  const [completions, setCompletions] = useLocalStorage<Completion[]>('completions', []);
  const [profile, setProfile] = useLocalStorage<PlayerProfile>('playerProfile', {
    level: 1,
    totalXP: 0,
    currentXP: 0,
    xpToNextLevel: calculateXpToNextLevel(1),
    unlockedBadges: {},
    totalQuestsCompleted: 0,
    settings: {
      dailyHabitLimit: null,
    },
  });
  const [quests, setQuests] = useLocalStorage<Quest[]>('quests', []);
  const [questsLastGenerated, setQuestsLastGenerated] = useLocalStorage<string | null>('questsLastGenerated', null);
  const [autoBackupEnabled, setAutoBackupEnabled] = useLocalStorage<boolean>('autoBackupEnabled', true);
  const [lastAutoBackupDate, setLastAutoBackupDate] = useLocalStorage<string | null>('lastAutoBackupDate', null);
  const [importFileContent, setImportFileContent] = useState<string | null>(null);

  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [newlyUnlockedBadges, setNewlyUnlockedBadges] = useState<{ badge: Badge, tier: BadgeTier }[]>([]);
  const [activeTab, setActiveTab] = useState<'habits' | 'quests' | 'progress' | 'calendar'>('habits');
  
  const [habitToConfirmAction, setHabitToConfirmAction] = useState<{habit: Habit, action: 'archive' | 'delete'} | null>(null);
  const [habitToDuplicate, setHabitToDuplicate] = useState<Habit | null>(null);
  const [notificationPermission, setNotificationPermission] = useState('Notification' in window ? Notification.permission : 'denied');
  
  const [viewingDate, setViewingDate] = useState(new Date());

  const [restoreConfirmation, setRestoreConfirmation] = useState<{ habitToRestore: Habit, duplicateHabit: Habit } | null>(null);

  // --- Push Notification State ---
  const [pushSubscription, setPushSubscription] = useLocalStorage<PushSubscriptionJSON | null>('pushSubscription', null);
  const [testNotifMessage, setTestNotifMessage] = useState('');
  const syncDebounceTimeout = useRef<number | null>(null);

  const goToPreviousDay = useCallback(() => {
    setViewingDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  }, []);

  const goToNextDay = useCallback(() => {
    setViewingDate(prevDate => {
        const today = new Date();
        const newDate = new Date(prevDate);
        newDate.setDate(newDate.getDate() + 1);
        if (isSameDay(newDate, today) || newDate < today) {
            return newDate;
        }
        return prevDate;
    });
  }, []);

  const goToToday = useCallback(() => {
    setViewingDate(new Date());
  }, []);

  const todayForComparison = new Date();
  todayForComparison.setHours(0,0,0,0);
  // Fix: Replaced subDays from date-fns with manual date calculation to resolve import error.
  const twoDaysAgo = new Date(todayForComparison);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  
  const viewingDateStart = new Date(viewingDate);
  viewingDateStart.setHours(0,0,0,0);

  const isViewingDateEditable = viewingDateStart >= twoDaysAgo;

  // Migration for scheduleDays, order and settings property
  useEffect(() => {
      const needsMigration = habits.some(h => h.scheduleDays === undefined || h.order === undefined) || !profile.settings;
      if (needsMigration) {
        if (habits.some(h => h.scheduleDays === undefined || h.order === undefined)) {
          setHabits(prevHabits => prevHabits.map((h, index) => ({
            ...h,
            scheduleDays: h.scheduleDays || [0, 1, 2, 3, 4, 5, 6],
            order: h.order ?? index,
          })));
        }
        if (!profile.settings) {
          setProfile(p => ({
            ...p,
            settings: { dailyHabitLimit: null }
          }));
        }
      }
  }, [habits, profile, setHabits, setProfile]); 

  // Auto-backup effect
  useEffect(() => {
    if (!autoBackupEnabled) return;

    const performAutoBackup = () => {
      console.log("Performing weekly auto-backup...");
      const backupData = {
        habits,
        completions,
        profile,
        quests,
        questsLastGenerated,
      };
      localStorage.setItem('the-game-auto-backup', JSON.stringify(backupData));
      setLastAutoBackupDate(new Date().toISOString());
    };

    if (!lastAutoBackupDate) {
      performAutoBackup();
    } else {
      const lastBackup = new Date(lastAutoBackupDate);
      const today = new Date();
      const diffDays = differenceInCalendarDays(today, lastBackup);
      if (diffDays >= 7) {
        performAutoBackup();
      }
    }
  }, [autoBackupEnabled, habits, completions, profile, quests, questsLastGenerated, lastAutoBackupDate, setLastAutoBackupDate]);


  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) return;
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    } catch(err) {
      console.error("Error requesting notification permission:", err);
    }
  }, []);

  const syncRemindersWithServer = useCallback((sub: PushSubscription | PushSubscriptionJSON | null, allHabits: Habit[]) => {
      if (!sub) return;
      if (syncDebounceTimeout.current) {
        clearTimeout(syncDebounceTimeout.current);
      }

      syncDebounceTimeout.current = window.setTimeout(async () => {
        const reminders = allHabits
          .filter(h => !h.isArchived && h.reminderTime)
          .map(h => ({ id: h.id, name: h.name, time: h.reminderTime }));

        try {
          await fetch(`${PUSH_SERVER_URL}/subscribe`, {
            method: 'POST',
            body: JSON.stringify({ subscription: sub, reminders }),
            headers: { 'Content-Type': 'application/json' },
          });
          console.log('Reminders synced with push server.');
        } catch (error) {
          console.error('Failed to sync reminders with push server. The server might be offline.', error);
          // Fail gracefully, user won't see an error.
        }
      }, 2000); // Debounce syncs by 2 seconds
  }, []);

  // Effect to subscribe to push notifications and perform initial sync
  useEffect(() => {
    const subscribeAndSync = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return;
      }
      try {
        const registration = await navigator.serviceWorker.ready;
        let sub = await registration.pushManager.getSubscription();

        if (sub === null) {
          console.log('Not subscribed to push, subscribing...');
          sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }
        
        const subJSON = sub.toJSON();
        setPushSubscription(subJSON);
        syncRemindersWithServer(subJSON, habits);
      } catch (error) {
        console.error('Failed to subscribe to push notifications:', error);
        setNotificationPermission('denied'); // Assume permission issue if subscription fails
      }
    };

    if (notificationPermission === 'granted') {
      subscribeAndSync();
    }
  }, [notificationPermission, habits, syncRemindersWithServer]);

  // Effect to re-sync reminders with the server when habits change
  useEffect(() => {
    if (pushSubscription) {
      syncRemindersWithServer(pushSubscription, habits);
    }
  }, [habits, pushSubscription, syncRemindersWithServer]);


  const handleSendTestNotification = useCallback(async () => {
    if (!pushSubscription) {
      setTestNotifMessage('Enable notifications before sending a test.');
      setTimeout(() => setTestNotifMessage(''), 5000);
      return;
    }
    setTestNotifMessage('Sending...');
    try {
      const response = await fetch(`${PUSH_SERVER_URL}/send-test`, {
        method: 'POST',
        body: JSON.stringify({ subscription: pushSubscription }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        setTestNotifMessage('Test notification sent successfully!');
      } else {
        throw new Error('Server responded with an error');
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
      setTestNotifMessage('Failed to send. Is the server running?');
    }
    setTimeout(() => setTestNotifMessage(''), 5000);
  }, [pushSubscription]);


  useEffect(() => {
    const todayStr = formatISO(new Date(), { representation: 'date' });
    const lastGeneratedStr = questsLastGenerated ? formatISO(new Date(questsLastGenerated), { representation: 'date' }) : null;
    const activeHabits = habits.filter(h => !h.isArchived);

    if (lastGeneratedStr !== todayStr && activeHabits.length > 0) {
      setQuests(generateDailyQuests(3, activeHabits));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setQuestsLastGenerated(today.toISOString());
    }
  }, [questsLastGenerated, setQuests, setQuestsLastGenerated, habits]);

  const handleAddHabit = useCallback((newHabitData: { 
      name: string; 
      category: HabitCategory; 
      type: HabitType; 
      reminderTime: string | null; 
      scheduleDays: number[];
      difficulty: string;
      xpReward: number;
    }, duplicatedFromId?: string) => {
    const newHabit: Habit = {
      ...newHabitData,
      id: crypto.randomUUID(),
      streak: 0,
      lastCompleted: null,
      createdAt: formatISO(new Date()),
      completionCount: 0,
      order: habits.length,
      isArchived: false,
      duplicatedFromId,
    };

    const updatedHabits = [...habits, newHabit];
    setHabits(updatedHabits);

    setProfile(prevProfile => {
        const { newlyUnlocked } = checkAndUnlockBadges(prevProfile, updatedHabits, completions, BADGE_CATALOG);
        if (newlyUnlocked.length > 0) {
            const unlockedForModal: { badge: Badge, tier: BadgeTier }[] = [];
            const newBadgeTiers: { [badgeId: string]: number } = {};
            let badgeXpGained = 0;

            const unlocksByBadgeId = newlyUnlocked.reduce((acc, unlock) => {
                if (!acc[unlock.badge.id] || unlock.tier.tier > acc[unlock.badge.id].tier.tier) {
                    acc[unlock.badge.id] = unlock;
                }
                return acc;
            }, {} as Record<string, { badge: Badge; tier: BadgeTier }>);

            Object.values(unlocksByBadgeId).forEach(({ badge, tier }) => {
                unlockedForModal.push({ badge, tier });
                newBadgeTiers[badge.id] = tier.tier;
                badgeXpGained += tier.xpReward;
            });
            
            setNewlyUnlockedBadges(prev => [...prev, ...unlockedForModal]);
            if (notificationPermission === 'granted') {
                const badgeNames = unlockedForModal.map(u => u.tier.name).join(', ');
                new Notification('Achievement Unlocked!', { body: `You've earned: ${badgeNames}` });
            }

            return {
                ...prevProfile,
                unlockedBadges: { ...prevProfile.unlockedBadges, ...newBadgeTiers },
            };
        }
        return prevProfile;
    });
  }, [habits, profile, completions, setHabits, setProfile, setNewlyUnlockedBadges, notificationPermission]);
  
  const handleReorderHabits = useCallback((draggedHabitId: string, targetHabitId: string) => {
    setHabits(prevHabits => {
        const activeHabits = prevHabits.filter(h => !h.isArchived).sort((a,b) => (a.order ?? 0) - (b.order ?? 0));
        const archivedHabits = prevHabits.filter(h => h.isArchived);

        const draggedIndex = activeHabits.findIndex(h => h.id === draggedHabitId);
        const targetIndex = activeHabits.findIndex(h => h.id === targetHabitId);

        if (draggedIndex === -1 || targetIndex === -1) return prevHabits;
        
        const [removed] = activeHabits.splice(draggedIndex, 1);
        activeHabits.splice(targetIndex, 0, removed);

        const reorderedHabits = activeHabits.map((h, index) => ({...h, order: index }));

        return [...reorderedHabits, ...archivedHabits];
    });
  }, [setHabits]);

  const updateStateAfterCompletion = useCallback((habitId: string, status: CompletionStatus) => {
    if (!isViewingDateEditable) return;

    const habitToUpdate = habits.find(h => h.id === habitId);
    if (!habitToUpdate) return;
    
    const recordDate = new Date(viewingDate);
    const streakBefore = habitToUpdate.streak;

    // 1. Calculate the new state of the affected habit
    let updatedHabit = { ...habitToUpdate };
    if (status === CompletionStatus.COMPLETED) {
        let newStreak = habitToUpdate.streak;
        let newLastCompleted = habitToUpdate.lastCompleted;
        if (!habitToUpdate.lastCompleted || new Date(habitToUpdate.lastCompleted) < recordDate) {
            newLastCompleted = formatISO(recordDate);
            if (habitToUpdate.lastCompleted) {
                const lastCompletedDate = new Date(habitToUpdate.lastCompleted);
                const diffInDays = differenceInCalendarDays(recordDate, lastCompletedDate);
                const wasMaintained = diffInDays > 1 
                    ? Array.from({ length: diffInDays - 1 }, (_, i) => {
                        const day = new Date(recordDate);
                        day.setDate(day.getDate() - (i + 1));
                        return day;
                      }).every(day => 
                        !habitToUpdate.scheduleDays.includes(day.getDay()) || 
                        completions.some(c => c.habitId === habitId && c.status === CompletionStatus.SKIPPED && isSameDay(new Date(c.date), day))
                      ) 
                    : diffInDays === 1;
                newStreak = wasMaintained ? habitToUpdate.streak + 1 : 1;
            } else {
                newStreak = 1;
            }
        }
        updatedHabit = { ...updatedHabit, streak: newStreak, lastCompleted: newLastCompleted, completionCount: habitToUpdate.completionCount + 1 };
    } else if (status === CompletionStatus.FAILED) {
        updatedHabit = { ...updatedHabit, streak: 0 };
    }

    const newHabitsForCalculation = habits.map(h => h.id === habitId ? updatedHabit : h);
    
    // 2. Update quests based on the completion and new habit state
    let totalQuestXpGained = 0;
    let questsCompletedNow = 0;
    const questsAffected: { questId: string, progressBefore: number, wasCompleted: boolean }[] = [];

    const updatedQuests = quests.map(quest => {
        if (quest.isCompleted) return quest;

        const isRelevant = (!quest.objective.category || quest.objective.category === habitToUpdate.category) &&
                           (!quest.objective.habitType || quest.objective.habitType === habitToUpdate.type);
                           
        if (isRelevant && status === CompletionStatus.COMPLETED) {
            questsAffected.push({ questId: quest.id, progressBefore: quest.progress, wasCompleted: quest.isCompleted });
            let newProgress = quest.progress;

            if (quest.type === QuestType.COUNT) {
                newProgress = quest.progress + 1;
            } else if (quest.type === QuestType.STREAK) {
                const maxStreakForCategory = newHabitsForCalculation
                    .filter(h => (!quest.objective.category || h.category === quest.objective.category) && (!quest.objective.habitType || h.type === quest.objective.habitType))
                    .reduce((max, h) => Math.max(max, h.streak), 0);
                newProgress = maxStreakForCategory;
            }

            const isNowCompleted = newProgress >= quest.objective.target;
            if (isNowCompleted && !quest.isCompleted) {
                totalQuestXpGained += quest.xpReward;
                questsCompletedNow++;
            }
            return { ...quest, progress: Math.min(newProgress, quest.objective.target), isCompleted: isNowCompleted };
        }
        return quest;
    });

    if (status === CompletionStatus.COMPLETED) {
      setQuests(updatedQuests);
    }
    
    // 3. Create completion record and update state
    let totalXpGained = status === CompletionStatus.COMPLETED ? calculateXP(habitToUpdate) + totalQuestXpGained : 0;
    const newCompletion: Completion = {
        id: crypto.randomUUID(),
        habitId,
        date: recordDate.toISOString(),
        habitCategory: habitToUpdate.category,
        status,
        xpGained: totalXpGained,
        questsAffected: status === CompletionStatus.COMPLETED ? questsAffected : undefined,
        streakBefore,
    };
    const newCompletions = [...completions.filter(c => !(c.habitId === habitId && isSameDay(new Date(c.date), recordDate))), newCompletion];
    setCompletions(newCompletions);

    // 4. Update habit state in storage
    setHabits(newHabitsForCalculation);

    // 5. Update profile and check for new badges
    setProfile(prevProfile => {
        let nextProfileState = { ...prevProfile };
        
        const { newlyUnlocked } = checkAndUnlockBadges(nextProfileState, newHabitsForCalculation, newCompletions, BADGE_CATALOG);
        if (newlyUnlocked.length > 0) {
            const unlockedForModal: { badge: Badge, tier: BadgeTier }[] = [];
            const newBadgeTiers: { [badgeId: string]: number } = {};
            let badgeXpGained = 0;

            const unlocksByBadgeId = newlyUnlocked.reduce((acc, unlock) => {
                if (!acc[unlock.badge.id] || unlock.tier.tier > acc[unlock.badge.id].tier.tier) {
                    acc[unlock.badge.id] = unlock;
                }
                return acc;
            }, {} as Record<string, { badge: Badge; tier: BadgeTier }>);

            Object.values(unlocksByBadgeId).forEach(({ badge, tier }) => {
                unlockedForModal.push({ badge, tier });
                newBadgeTiers[badge.id] = tier.tier;
                badgeXpGained += tier.xpReward;
            });
            
            totalXpGained += badgeXpGained;
            nextProfileState.unlockedBadges = { ...nextProfileState.unlockedBadges, ...newBadgeTiers };
            
            setNewlyUnlockedBadges(prev => {
                const existingIds = new Set(prev.map(b => b.badge.id + b.tier.tier));
                const trulyNew = unlockedForModal.filter(b => !existingIds.has(b.badge.id + b.tier.tier));
                return [...prev, ...trulyNew];
            });
            if (notificationPermission === 'granted') {
                const badgeNames = unlockedForModal.map(u => u.tier.name).join(', ');
                new Notification('Achievement Unlocked!', { body: `You've earned: ${badgeNames}` });
            }
        }

        const newTotalQuestsCompleted = (nextProfileState.totalQuestsCompleted || 0) + questsCompletedNow;

        if (totalXpGained > 0) {
            let newCurrentXP = nextProfileState.currentXP + totalXpGained;
            let newTotalXP = nextProfileState.totalXP + totalXpGained;
            let newLevel = nextProfileState.level;
            let newXpToNextLevel = nextProfileState.xpToNextLevel;
            let leveledUp = false;
            while (newCurrentXP >= newXpToNextLevel) {
                newLevel += 1;
                leveledUp = true;
                newCurrentXP -= newXpToNextLevel;
                newXpToNextLevel = calculateXpToNextLevel(newLevel);
            }
            if (leveledUp && notificationPermission === 'granted') {
                new Notification('Level Up!', { body: `You've reached Level ${newLevel}! Keep up the great work!` });
            }
            nextProfileState = { ...nextProfileState, level: newLevel, totalXP: newTotalXP, currentXP: newCurrentXP, xpToNextLevel: newXpToNextLevel, totalQuestsCompleted: newTotalQuestsCompleted };
        } else if (questsCompletedNow > 0) {
            nextProfileState = { ...nextProfileState, totalQuestsCompleted: newTotalQuestsCompleted };
        }


        return nextProfileState;
    });
  }, [habits, quests, completions, viewingDate, isViewingDateEditable, notificationPermission, setHabits, setCompletions, setQuests, setProfile, setNewlyUnlockedBadges]);


  const handleCompleteHabit = useCallback((habitId: string) => {
    updateStateAfterCompletion(habitId, CompletionStatus.COMPLETED);
  }, [updateStateAfterCompletion]);

  const handleFailHabit = useCallback((habitId: string) => {
    updateStateAfterCompletion(habitId, CompletionStatus.FAILED);
  }, [updateStateAfterCompletion]);

  const handleSkipHabit = useCallback((habitId: string) => {
    updateStateAfterCompletion(habitId, CompletionStatus.SKIPPED);
  }, [updateStateAfterCompletion]);

  const handleUndoCompletion = useCallback((habitId: string) => {
    const completionToUndo = completions.find(c => c.habitId === habitId && isSameDay(new Date(c.date), viewingDate));
    if (!completionToUndo) return;

    // This is a simplified undo that does not revert badge unlocks. A full-scale undo would require a more complex event sourcing system.
    if (completionToUndo.xpGained && completionToUndo.xpGained > 0) {
        setProfile(prev => {
            let newCurrentXP = prev.currentXP - (completionToUndo.xpGained ?? 0);
            let newTotalXP = prev.totalXP - (completionToUndo.xpGained ?? 0);
            let newLevel = prev.level;
            let newXpToNextLevel = prev.xpToNextLevel;

            while (newCurrentXP < 0) {
                newLevel -= 1;
                if (newLevel < 1) {
                    newLevel = 1;
                    newCurrentXP = 0;
                    newXpToNextLevel = calculateXpToNextLevel(1);
                    break;
                }
                const xpForPrevLevel = calculateXpToNextLevel(newLevel);
                newCurrentXP += xpForPrevLevel;
                newXpToNextLevel = xpForPrevLevel;
            }
            
            return { ...prev, level: newLevel, currentXP: newCurrentXP, totalXP: Math.max(0, newTotalXP), xpToNextLevel: newXpToNextLevel };
        });
    }
    
    // Revert Quests
    if (completionToUndo.questsAffected && completionToUndo.questsAffected.length > 0) {
        setQuests(prevQuests => {
            const questsToRevert = new Map(completionToUndo.questsAffected!.map(q => [q.questId, q]));
            let questsCompletedToDecrement = 0;
            const updatedQuests = prevQuests.map(quest => {
                if (questsToRevert.has(quest.id)) {
                    const revertState = questsToRevert.get(quest.id)!;
                    if(quest.isCompleted && !revertState.wasCompleted) {
                        questsCompletedToDecrement++;
                    }
                    return { ...quest, progress: revertState.progressBefore, isCompleted: revertState.wasCompleted };
                }
                return quest;
            });

            if (questsCompletedToDecrement > 0) {
                setProfile(prev => ({
                    ...prev,
                    totalQuestsCompleted: Math.max(0, (prev.totalQuestsCompleted || 0) - questsCompletedToDecrement)
                }))
            }

            return updatedQuests;
        });
    }

    // Revert Habit State
    setHabits(prevHabits => prevHabits.map(h => {
        if (h.id === habitId) {
            const newCompletionCount = completionToUndo.status === CompletionStatus.COMPLETED ? Math.max(0, h.completionCount - 1) : h.completionCount;
            // Note: Re-calculating lastCompleted accurately would require searching all completions,
            // for now, this simple revert is sufficient for streaks.
            return { ...h, streak: completionToUndo.streakBefore ?? 0, completionCount: newCompletionCount };
        }
        return h;
    }));

    // Remove Completion record from history
    setCompletions(prev => prev.filter(c => c.id !== completionToUndo.id));
  }, [completions, viewingDate, setProfile, setQuests, setHabits, setCompletions]);


  const handleArchiveHabit = useCallback((habit: Habit) => {
    setHabitToConfirmAction({ habit, action: 'archive' });
  }, []);
  
  const handleRestoreHabit = useCallback((habitId: string) => {
    const habitToRestore = habits.find(h => h.id === habitId);
    if (!habitToRestore) return;

    const duplicateHabit = habits.find(h => !h.isArchived && h.duplicatedFromId === habitId);

    if (duplicateHabit) {
      setRestoreConfirmation({ habitToRestore, duplicateHabit });
    } else {
      setHabits(prev => prev.map(h => h.id === habitId ? { ...h, isArchived: false } : h));
    }
  }, [habits, setHabits]);

  const handleConfirmRestoreAndReplace = useCallback(() => {
    if (!restoreConfirmation) return;
    const { habitToRestore, duplicateHabit } = restoreConfirmation;
    
    setHabits(prev => prev
        .filter(h => h.id !== duplicateHabit.id)
        .map(h => h.id === habitToRestore.id ? { ...h, isArchived: false } : h)
    );
    setCompletions(prev => prev.filter(c => c.habitId !== duplicateHabit.id));

    setRestoreConfirmation(null);
  }, [restoreConfirmation, setHabits, setCompletions]);

  const handleConfirmRestoreAndKeep = useCallback(() => {
    if (!restoreConfirmation) return;
    const { habitToRestore } = restoreConfirmation;
    setHabits(prev => prev.map(h => h.id === habitToRestore.id ? { ...h, isArchived: false } : h));
    setRestoreConfirmation(null);
  }, [restoreConfirmation, setHabits]);

  const handleCancelRestore = useCallback(() => {
    setRestoreConfirmation(null);
  }, []);


  const handleDeletePermanently = useCallback((habit: Habit) => {
    setHabitToConfirmAction({ habit, action: 'delete' });
  }, []);

  const cancelConfirmAction = useCallback(() => {
    setHabitToConfirmAction(null);
  }, []);

  const confirmAction = useCallback(() => {
    if (habitToConfirmAction) {
      const { habit, action } = habitToConfirmAction;
      if (action === 'archive') {
        setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, isArchived: true } : h));
      } else if (action === 'delete') {
        setHabits(prev => prev.filter(h => h.id !== habit.id));
        setCompletions(prev => prev.filter(c => c.habitId !== habit.id));
      }
      setHabitToConfirmAction(null);
    }
  }, [habitToConfirmAction, setHabits, setCompletions]);

  const handleExportData = useCallback(() => {
    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        habits,
        completions,
        profile,
        quests,
        questsLastGenerated,
      }
    };
    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    const dateStamp = new Date().toISOString().split('T')[0];
    link.download = `the-game-backup-${dateStamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  }, [habits, completions, profile, quests, questsLastGenerated]);

  const handleImportFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        try {
          const parsed = JSON.parse(text);
          if (parsed.data && parsed.data.habits && parsed.data.profile) {
            setImportFileContent(text);
          } else {
            alert('Invalid backup file format.');
          }
        } catch (error) {
          alert('Failed to read backup file. It might be corrupted.');
          console.error("Import error:", error);
        }
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input to allow re-importing the same file
  }, []);

  const confirmImport = useCallback(() => {
    if (!importFileContent) return;
    try {
      const parsedData = JSON.parse(importFileContent).data;
      setHabits(parsedData.habits || []);
      setCompletions(parsedData.completions || []);
      setProfile(parsedData.profile || { level: 1, totalXP: 0, currentXP: 0, xpToNextLevel: calculateXpToNextLevel(1), unlockedBadges: {} });
      setQuests(parsedData.quests || []);
      setQuestsLastGenerated(parsedData.questsLastGenerated || null);
      setImportFileContent(null);
      alert('Data restored successfully! The app will now reload.');
      window.location.reload();
    } catch (error) {
      alert('An error occurred while restoring data.');
      console.error("Restore error:", error);
      setImportFileContent(null);
    }
  }, [importFileContent, setHabits, setCompletions, setProfile, setQuests, setQuestsLastGenerated]);

  const cancelImport = useCallback(() => {
    setImportFileContent(null);
  }, []);

  const handleUpdateSettings = useCallback((newSettings: PlayerSettings) => {
    setProfile(p => ({
        ...p,
        settings: newSettings,
    }));
  }, [setProfile]);

  return {
    habits,
    completions,
    profile,
    quests,
    isAddHabitModalOpen,
    setIsAddHabitModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    newlyUnlockedBadges,
    setNewlyUnlockedBadges,
    activeTab,
    setActiveTab,
    habitToConfirmAction,
    cancelConfirmAction,
    confirmAction,
    handleAddHabit,
    handleCompleteHabit,
    handleFailHabit,
    handleSkipHabit,
    handleUndoCompletion,
    handleArchiveHabit,
    handleRestoreHabit,
    handleDeletePermanently,
    handleReorderHabits,
    habitToDuplicate,
    setHabitToDuplicate,
    notificationPermission,
    requestNotificationPermission,
    handleSendTestNotification,
    testNotifMessage,
    viewingDate,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    isViewingDateEditable,
    handleExportData,
    handleImportFileSelect,
    confirmImport,
    cancelImport,
    importFileContent,
    autoBackupEnabled,
    setAutoBackupEnabled,
    restoreConfirmation,
    handleConfirmRestoreAndReplace,
    handleConfirmRestoreAndKeep,
    handleCancelRestore,
    handleUpdateSettings,
  };
};