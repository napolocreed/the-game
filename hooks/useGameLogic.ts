import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Habit, PlayerProfile, Quest, Badge, Completion, CompletionStatus, HabitCategory, HabitType, QuestType, BadgeTier, PlayerSettings, Quit, DayNote, Task, TaskSize } from '../types';
import { useLocalStorage } from './useLocalStorage';
// Fix: Removed 'subDays' from date-fns import as it is causing an error.
import { formatISO, differenceInCalendarDays, isSameDay } from 'date-fns';
import { calculateXP, calculateXpToNextLevel, migrateLevel, XP_CURVE_VERSION } from '../utils/xp';
import { generateDailyQuests } from '../utils/quests';
import { BADGE_CATALOG, checkAndUnlockBadges } from '../utils/badges';
import { showAppNotification } from '../utils/notifications';
import { GameSnapshot, saveMirror, loadMirror, addSnapshot, getLatestSnapshot, requestPersistentStorage } from '../utils/db';
import { QUIT_MILESTONES, URGE_RESIST_XP, URGE_XP_DAILY_CAP, dueMilestones } from '../utils/quits';
import { dayKey as taskDayKey, pickDailyTask, taskXp } from '../utils/tasks';
import { SKINS, getSkin, DEFAULT_SKIN_ID } from '../utils/skinCatalog';
import { applySkin } from '../utils/skins';
import { livingStage } from '../utils/patina';
import { isUnlocked, seniorityDays, UnlockContext } from '../utils/skinUnlocks';

// --- Push Notification Server ---
// Optional: set VITE_PUSH_SERVER_URL (e.g. in .env.local or on your host) to enable
// server-side push reminders that work even when the app is closed.
// The VAPID public key is fetched from the server itself, so it can never be out of sync.
const PUSH_SERVER_URL = ((import.meta.env.VITE_PUSH_SERVER_URL as string | undefined) || '').replace(/\/+$/, '');

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
  const [quits, setQuits] = useLocalStorage<Quit[]>('quits', []);
  const [dayNotes, setDayNotes] = useLocalStorage<{ [dateKey: string]: DayNote }>('dayNotes', {});
  const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', []);
  const [activeSkinId, setActiveSkinId] = useLocalStorage<string>('activeSkin', DEFAULT_SKIN_ID);
  // Which skins the player has SEEN unlock. Unlocking itself is derived from
  // live data every render, so this only exists to know what is new — a skin
  // can never be lost by a stat dipping back below its threshold.
  const [seenSkins, setSeenSkins] = useLocalStorage<string[]>('seenSkins', []);
  const [questsLastGenerated, setQuestsLastGenerated] = useLocalStorage<string | null>('questsLastGenerated', null);
  const [autoBackupEnabled, setAutoBackupEnabled] = useLocalStorage<boolean>('autoBackupEnabled', true);
  const [lastAutoBackupDate, setLastAutoBackupDate] = useLocalStorage<string | null>('lastAutoBackupDate', null);
  const [importFileContent, setImportFileContent] = useState<string | null>(null);

  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [newlyUnlockedBadges, setNewlyUnlockedBadges] = useState<{ badge: Badge, tier: BadgeTier }[]>([]);
  const [activeTab, setActiveTab] = useState<'habits' | 'quests' | 'battles' | 'progress' | 'calendar'>('habits');

  const [habitToConfirmAction, setHabitToConfirmAction] = useState<{habit: Habit, action: 'archive' | 'delete'} | null>(null);
  const [quitToDelete, setQuitToDelete] = useState<Quit | null>(null);
  const [milestoneCelebration, setMilestoneCelebration] = useState<{ quitName: string; days: number; label: string; xp: number } | null>(null);
  const [habitToDuplicate, setHabitToDuplicate] = useState<Habit | null>(null);
  const [notificationPermission, setNotificationPermission] = useState('Notification' in window ? Notification.permission : 'denied');
  
  const [viewingDate, setViewingDate] = useState(new Date());

  const [restoreConfirmation, setRestoreConfirmation] = useState<{ habitToRestore: Habit, duplicateHabit: Habit } | null>(null);

  // --- Push Notification State ---
  const [pushSubscription, setPushSubscription] = useLocalStorage<PushSubscriptionJSON | null>('pushSubscription', null);
  const [pushEnabled, setPushEnabled] = useLocalStorage<boolean>('pushEnabled', false);
  const [testNotifMessage, setTestNotifMessage] = useState('');
  const [pushStatusMessage, setPushStatusMessage] = useState('');
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

  // The XP curve was exponential and stalled out around level 18. Recompute
  // the level from lifetime XP, which is the ground truth and is untouched, so
  // a curve change is a recalculation rather than a loss. Runs exactly once.
  useEffect(() => {
    if (profile.curveVersion === XP_CURVE_VERSION) return;
    setProfile(prev => ({
      ...prev,
      ...migrateLevel(prev),
      curveVersion: XP_CURVE_VERSION,
    }));
  }, [profile.curveVersion, setProfile]);

  // --- Skins ---
  const unlockCtx: UnlockContext = {
    profile, habits, completions, quits, tasks, dayNotes,
    seniorityDays: seniorityDays(habits, quits, tasks, completions),
  };
  const unlockedSkinIds = SKINS.filter(s => isUnlocked(s.unlock, unlockCtx)).map(s => s.id);

  // A skin the player selected but has not (or no longer) unlocked must never
  // be applied — otherwise a restored backup could paint the app with
  // something never earned.
  const activeSkin = getSkin(unlockedSkinIds.includes(activeSkinId) ? activeSkinId : DEFAULT_SKIN_ID);

  // A living skin keeps ageing after it is earned, so what gets painted
  // depends on the account's age as well as which skin is worn.
  const ageStage = activeSkin.unlock.kind === 'seniority'
    ? livingStage(unlockCtx.seniorityDays, activeSkin.unlock.days)
    : 0;

  useEffect(() => {
    applySkin(activeSkin, document.documentElement, ageStage);
  }, [activeSkin, ageStage]);

  const newlyUnlockedSkins = SKINS.filter(
    s => unlockedSkinIds.includes(s.id) && !seenSkins.includes(s.id) && s.unlock.kind !== 'default',
  );

  const acknowledgeSkins = useCallback(() => {
    setSeenSkins(SKINS.filter(s => isUnlocked(s.unlock, unlockCtx)).map(s => s.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setSeenSkins, profile, habits, completions, quits, tasks]);

  const selectSkin = useCallback((id: string) => {
    setActiveSkinId(id);
  }, [setActiveSkinId]);

  const hasMeaningfulData = habits.length > 0 || completions.length > 0 || quits.length > 0 || tasks.length > 0 || profile.totalXP > 0;

  // Ask the browser to protect this origin's storage from eviction (best effort).
  useEffect(() => {
    requestPersistentStorage();
  }, []);

  // --- Data safety net ---
  // localStorage is the primary store but browsers can evict it. Mirror every
  // change into IndexedDB, and offer to restore from the mirror when the app
  // boots with empty data. (The old "auto-backup" wrote into localStorage
  // itself, so it vanished together with the data it was meant to protect.)
  const [recoveryData, setRecoveryData] = useState<GameSnapshot | null>(null);
  const recoveryCheckDone = useRef(false);

  useEffect(() => {
    if (recoveryCheckDone.current) return;
    recoveryCheckDone.current = true;
    if (hasMeaningfulData) return;

    (async () => {
      const mirror = (await loadMirror()) || (await getLatestSnapshot());
      if (mirror && ((mirror.habits?.length ?? 0) > 0 || (mirror.completions?.length ?? 0) > 0 || (mirror.quits?.length ?? 0) > 0)) {
        setRecoveryData(mirror);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmRecovery = useCallback(() => {
    if (!recoveryData) return;
    setHabits((recoveryData.habits as Habit[]) || []);
    setCompletions((recoveryData.completions as Completion[]) || []);
    setProfile((recoveryData.profile as PlayerProfile) || {
      level: 1, totalXP: 0, currentXP: 0, xpToNextLevel: calculateXpToNextLevel(1),
      unlockedBadges: {}, totalQuestsCompleted: 0, settings: { dailyHabitLimit: null },
    });
    setQuests((recoveryData.quests as Quest[]) || []);
    setQuits((recoveryData.quits as Quit[]) || []);
    setDayNotes((recoveryData.dayNotes as { [dateKey: string]: DayNote }) || {});
    setTasks((recoveryData.tasks as Task[]) || []);
    setActiveSkinId((recoveryData.activeSkinId as string) || DEFAULT_SKIN_ID);
    setQuestsLastGenerated(recoveryData.questsLastGenerated || null);
    setRecoveryData(null);
  }, [recoveryData, setHabits, setCompletions, setProfile, setQuests, setQuits, setDayNotes, setTasks, setActiveSkinId, setSeenSkins, setQuestsLastGenerated]);

  const dismissRecovery = useCallback(() => {
    setRecoveryData(null);
  }, []);

  // Continuous mirror of the current state into IndexedDB (skips empty state so a
  // fresh boot can never clobber a good mirror before recovery is offered).
  useEffect(() => {
    if (!hasMeaningfulData) return;
    const timeout = window.setTimeout(() => {
      saveMirror({ habits, completions, profile, quests, quits, dayNotes, tasks, activeSkinId, seenSkins, questsLastGenerated, savedAt: new Date().toISOString() });
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, [habits, completions, profile, quests, quits, dayNotes, tasks, activeSkinId, seenSkins, questsLastGenerated, hasMeaningfulData]);

  // Weekly snapshot history in IndexedDB (keeps the last 8).
  useEffect(() => {
    if (!autoBackupEnabled || !hasMeaningfulData) return;

    const performAutoBackup = () => {
      console.log("Performing weekly auto-backup snapshot...");
      addSnapshot({ habits, completions, profile, quests, quits, dayNotes, tasks, activeSkinId, seenSkins, questsLastGenerated, savedAt: new Date().toISOString() });
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
  }, [autoBackupEnabled, hasMeaningfulData, habits, completions, profile, quests, questsLastGenerated, lastAutoBackupDate, setLastAutoBackupDate]);


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
      if (!sub || !PUSH_SERVER_URL) return;
      if (syncDebounceTimeout.current) {
        clearTimeout(syncDebounceTimeout.current);
      }

      syncDebounceTimeout.current = window.setTimeout(async () => {
        const reminders = allHabits
          .filter(h => !h.isArchived && h.reminderTime)
          .map(h => ({ id: h.id, name: h.name, time: h.reminderTime, days: h.scheduleDays }));

        try {
          await fetch(`${PUSH_SERVER_URL}/subscribe`, {
            method: 'POST',
            body: JSON.stringify({
              subscription: sub,
              reminders,
              // Reminder times are entered in the user's local time; the server
              // needs the timezone to fire them at the right moment.
              tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
            }),
            headers: { 'Content-Type': 'application/json' },
          });
          console.log('Reminders synced with push server.');
        } catch (error) {
          console.error('Failed to sync reminders with push server. The server might be offline.', error);
          // Fail gracefully, user won't see an error.
        }
      }, 2000); // Debounce syncs by 2 seconds
  }, []);

  // Explicit opt-in to server push. Never touches the browser permission state on
  // failure (the old behavior made notifications look "Blocked" whenever the
  // server was unreachable or the VAPID key was wrong).
  const handleTogglePush = useCallback(async (enable: boolean) => {
    if (!enable) {
      setPushEnabled(false);
      setPushStatusMessage('');
      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          const sub = await registration?.pushManager.getSubscription();
          await sub?.unsubscribe();
        }
      } catch (err) {
        console.warn('Failed to unsubscribe from push:', err);
      }
      setPushSubscription(null);
      return;
    }

    if (!PUSH_SERVER_URL) {
      setPushStatusMessage('No push server configured (VITE_PUSH_SERVER_URL).');
      return;
    }
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushStatusMessage('Push notifications are not supported by this browser.');
      return;
    }

    setPushStatusMessage('Connecting to push server...');
    try {
      const keyResponse = await fetch(`${PUSH_SERVER_URL}/vapidPublicKey`);
      if (!keyResponse.ok) throw new Error(`Server responded ${keyResponse.status}`);
      const { publicKey } = await keyResponse.json();
      if (!publicKey) throw new Error('Push server has no VAPID public key configured.');

      const registration = await navigator.serviceWorker.ready;
      let sub = await registration.pushManager.getSubscription();
      if (sub) {
        // Re-subscribe if the server key changed since the last subscription.
        const currentKey = sub.options?.applicationServerKey;
        if (currentKey) {
          await sub.unsubscribe();
          sub = null;
        }
      }
      if (!sub) {
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      const subJSON = sub.toJSON();
      setPushSubscription(subJSON);
      setPushEnabled(true);
      setPushStatusMessage('Push reminders enabled!');
      syncRemindersWithServer(subJSON, habits);
      setTimeout(() => setPushStatusMessage(''), 5000);
    } catch (error) {
      console.error('Failed to enable push notifications:', error);
      setPushEnabled(false);
      setPushStatusMessage('Could not reach the push server. Reminders will still fire while the app is open.');
    }
  }, [habits, setPushEnabled, setPushSubscription, syncRemindersWithServer]);

  // Re-sync reminders with the server when habits change
  useEffect(() => {
    if (pushEnabled && pushSubscription) {
      syncRemindersWithServer(pushSubscription, habits);
    }
  }, [habits, pushEnabled, pushSubscription, syncRemindersWithServer]);

  // --- Local reminder scheduler ---
  // Fires habit reminders while the app is open (tab or installed PWA), with no
  // server required. Each reminder fires at most once per day, only for habits
  // scheduled today that haven't been logged yet, within a 60-minute grace window.
  useEffect(() => {
    if (notificationPermission !== 'granted') return;

    const checkReminders = () => {
      const now = new Date();
      const todayKey = formatISO(now, { representation: 'date' });
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      let fired: { date: string; habitIds: string[] };
      try {
        fired = JSON.parse(localStorage.getItem('remindersFired') || 'null') || { date: todayKey, habitIds: [] };
      } catch {
        fired = { date: todayKey, habitIds: [] };
      }
      if (fired.date !== todayKey) fired = { date: todayKey, habitIds: [] };

      habits.forEach(habit => {
        if (habit.isArchived || !habit.reminderTime) return;
        if (!habit.scheduleDays.includes(now.getDay())) return;
        if (fired.habitIds.includes(habit.id)) return;

        const [h, m] = habit.reminderTime.split(':').map(Number);
        if (Number.isNaN(h) || Number.isNaN(m)) return;
        const dueMinutes = h * 60 + m;
        if (nowMinutes < dueMinutes || nowMinutes > dueMinutes + 60) return;

        const alreadyLogged = completions.some(c => c.habitId === habit.id && isSameDay(new Date(c.date), now));
        if (alreadyLogged) return;

        fired.habitIds.push(habit.id);
        showAppNotification('The Game Reminder', `Don't forget "${habit.name}"!`);
      });

      localStorage.setItem('remindersFired', JSON.stringify(fired));
    };

    checkReminders();
    const intervalId = window.setInterval(checkReminders, 30_000);
    return () => window.clearInterval(intervalId);
  }, [habits, completions, notificationPermission]);


  const handleSendTestNotification = useCallback(async () => {
    // Without a push server, test the local notification path instead.
    if (!PUSH_SERVER_URL || !pushSubscription) {
      await showAppNotification('The Game', 'This is a test notification! 🚀');
      setTestNotifMessage('Local test notification sent!');
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

    const activeQuits = quits.filter(q => !q.isArchived);
    if (lastGeneratedStr !== todayStr && (activeHabits.length > 0 || activeQuits.length > 0)) {
      setQuests(generateDailyQuests(3, activeHabits, activeQuits));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setQuestsLastGenerated(today.toISOString());
    }
  }, [questsLastGenerated, setQuests, setQuestsLastGenerated, habits, quits]);

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
        const { newlyUnlocked } = checkAndUnlockBadges({ profile: prevProfile, habits: updatedHabits, completions, quits, tasks }, BADGE_CATALOG);
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
                showAppNotification('Achievement Unlocked!', `You've earned: ${badgeNames}`);
            }

            return {
                ...prevProfile,
                unlockedBadges: { ...prevProfile.unlockedBadges, ...newBadgeTiers },
            };
        }
        return prevProfile;
    });
  }, [habits, profile, completions, quits, setHabits, setProfile, setNewlyUnlockedBadges, notificationPermission]);
  
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
        
        const { newlyUnlocked } = checkAndUnlockBadges({ profile: nextProfileState, habits: newHabitsForCalculation, completions: newCompletions, quits, tasks }, BADGE_CATALOG);
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
                showAppNotification('Achievement Unlocked!', `You've earned: ${badgeNames}`);
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
                showAppNotification('Level Up!', `You've reached Level ${newLevel}! Keep up the great work!`);
            }
            nextProfileState = { ...nextProfileState, level: newLevel, totalXP: newTotalXP, currentXP: newCurrentXP, xpToNextLevel: newXpToNextLevel, totalQuestsCompleted: newTotalQuestsCompleted };
        } else if (questsCompletedNow > 0) {
            nextProfileState = { ...nextProfileState, totalQuestsCompleted: newTotalQuestsCompleted };
        }


        return nextProfileState;
    });
  }, [habits, quests, quits, completions, viewingDate, isViewingDateEditable, notificationPermission, setHabits, setCompletions, setQuests, setProfile, setNewlyUnlockedBadges]);


  const handleCompleteHabit = useCallback((habitId: string) => {
    updateStateAfterCompletion(habitId, CompletionStatus.COMPLETED);
  }, [updateStateAfterCompletion]);

  const handleFailHabit = useCallback((habitId: string) => {
    updateStateAfterCompletion(habitId, CompletionStatus.FAILED);
  }, [updateStateAfterCompletion]);

  const handleSkipHabit = useCallback((habitId: string) => {
    updateStateAfterCompletion(habitId, CompletionStatus.SKIPPED);
  }, [updateStateAfterCompletion]);

  // Reverses an XP award, walking levels back down if needed. `awardXP`
  // ignores non-positive amounts on purpose, so undoing needs its own path —
  // otherwise complete-then-undo-then-complete would pay out twice.
  const removeXP = useCallback((amount: number) => {
    if (amount <= 0) return;
    setProfile(prev => {
      let newCurrentXP = prev.currentXP - amount;
      const newTotalXP = prev.totalXP - amount;
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
  }, [setProfile]);

  const handleUndoCompletion = useCallback((habitId: string) => {
    const completionToUndo = completions.find(c => c.habitId === habitId && isSameDay(new Date(c.date), viewingDate));
    if (!completionToUndo) return;

    // This is a simplified undo that does not revert badge unlocks. A full-scale undo would require a more complex event sourcing system.
    removeXP(completionToUndo.xpGained ?? 0);
    
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
  }, [completions, viewingDate, removeXP, setProfile, setQuests, setHabits, setCompletions]);


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
      version: 4,
      exportedAt: new Date().toISOString(),
      data: {
        habits,
        completions,
        profile,
        quests,
        quits,
        dayNotes,
        tasks,
        activeSkinId,
        seenSkins,
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
  }, [habits, completions, profile, quests, quits, dayNotes, questsLastGenerated]);

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
      setQuits(parsedData.quits || []); // absent from v1 backups → empty
      setDayNotes(parsedData.dayNotes || {});
      setTasks(parsedData.tasks || []); // absent from v1/v2 backups -> empty
      setActiveSkinId(parsedData.activeSkinId || DEFAULT_SKIN_ID);
      setSeenSkins(parsedData.seenSkins || []);
      setQuestsLastGenerated(parsedData.questsLastGenerated || null);
      setImportFileContent(null);
      alert('Data restored successfully! The app will now reload.');
      window.location.reload();
    } catch (error) {
      alert('An error occurred while restoring data.');
      console.error("Restore error:", error);
      setImportFileContent(null);
    }
  }, [importFileContent, setHabits, setCompletions, setProfile, setQuests, setQuits, setDayNotes, setTasks, setQuestsLastGenerated]);

  const cancelImport = useCallback(() => {
    setImportFileContent(null);
  }, []);

  // --- Recovery / "Boss Fights" logic ---

  // Shared XP awarding with level-up handling (used by quit milestones and resisted urges).
  const awardXP = useCallback((amount: number) => {
    if (amount <= 0) return;
    setProfile(prev => {
      let newCurrentXP = prev.currentXP + amount;
      const newTotalXP = prev.totalXP + amount;
      let newLevel = prev.level;
      let newXpToNextLevel = prev.xpToNextLevel;
      let leveledUp = false;
      while (newCurrentXP >= newXpToNextLevel) {
        newLevel += 1;
        leveledUp = true;
        newCurrentXP -= newXpToNextLevel;
        newXpToNextLevel = calculateXpToNextLevel(newLevel);
      }
      if (leveledUp && notificationPermission === 'granted') {
        showAppNotification('Level Up!', `You've reached Level ${newLevel}! Keep up the great work!`);
      }
      return { ...prev, level: newLevel, totalXP: newTotalXP, currentXP: newCurrentXP, xpToNextLevel: newXpToNextLevel };
    });
  }, [notificationPermission, setProfile]);

  // --- One-shot tasks ---
  // Deliberately weightless day to day: a task never breaks a streak, never
  // counts as a failed day, and never enters the completed/scheduled rate.
  // The only pressure it applies is its own age, which is true by construction.

  const handleAddTask = useCallback((data: {
    name: string;
    category: HabitCategory;
    size: TaskSize;
    dueDate?: string | null;
    note?: string;
    createdAt?: string | null;
  }) => {
    // A backdated start is accepted once, here, and clamped to the past so the
    // clock can never be set into the future to fake an age.
    const now = new Date();
    const backdated = data.createdAt ? new Date(data.createdAt) : null;
    const createdAt = backdated && !Number.isNaN(backdated.getTime()) && backdated <= now
      ? formatISO(backdated)
      : formatISO(now);
    const newTask: Task = {
      id: crypto.randomUUID(),
      name: data.name.trim(),
      category: data.category,
      size: data.size,
      createdAt,
      completedAt: null,
      droppedAt: null,
      dueDate: data.dueDate || null,
      pushedOn: [],
      note: data.note?.trim() || undefined,
    };
    setTasks(prev => [newTask, ...prev]);
  }, [setTasks]);

  const handleCompleteTask = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.completedAt || task.droppedAt) return;

    const now = new Date();
    const xp = taskXp(task, now);
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, completedAt: formatISO(now), xpGained: xp } : t
    ));
    awardXP(xp);
  }, [tasks, setTasks, awardXP]);

  /** "Not today." Free, guilt-free — but counted, because the count is true. */
  const handlePushTask = useCallback((taskId: string) => {
    const today = taskDayKey(new Date());
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const pushedOn = t.pushedOn ?? [];
      if (pushedOn.includes(today)) return t;
      return { ...t, pushedOn: [...pushedOn, today] };
    }));
  }, [setTasks]);

  /** Letting something go is a decision, not a failure. It is never punished. */
  const handleDropTask = useCallback((taskId: string) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId && !t.completedAt ? { ...t, droppedAt: formatISO(new Date()) } : t
    ));
  }, [setTasks]);

  const handleReopenTask = useCallback((taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      // createdAt is never touched: the clock keeps running, so
      // complete-then-reopen cannot be used to reset an age.
      return { ...t, completedAt: null, droppedAt: null, xpGained: undefined };
    }));
    const task = tasks.find(t => t.id === taskId);
    if (task?.completedAt && task.xpGained) {
      removeXP(task.xpGained);
    }
  }, [tasks, setTasks, removeXP]);

  const handleDeleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, [setTasks]);

  const handleEditTask = useCallback((taskId: string, data: {
    name: string;
    category: HabitCategory;
    size: TaskSize;
    dueDate?: string | null;
    note?: string;
  }) => {
    setTasks(prev => prev.map(t => t.id === taskId
      ? { ...t, name: data.name.trim(), category: data.category, size: data.size, dueDate: data.dueDate || null, note: data.note?.trim() || undefined }
      : t));
  }, [setTasks]);

  // The task offered today. `pickDailyTask` is deterministic for a given day,
  // so the offer is stable across opens without persisting anything.
  const dailyTask = pickDailyTask(tasks);

  const handleAddQuit = useCallback((data: { name: string; startDate: string; costPerDay: number | null; motivation: string; savingsGoal: { name: string; price: number } | null }) => {
    const nowISO = formatISO(new Date());
    const newQuit: Quit = {
      id: crypto.randomUUID(),
      name: data.name,
      createdAt: nowISO,
      firstStartDate: data.startDate,
      startDate: data.startDate,
      relapses: [],
      urgesResisted: 0,
      urgesTodayDate: null,
      urgesToday: 0,
      urgeLog: [],
      motivation: data.motivation.trim() || undefined,
      costPerDay: data.costPerDay,
      savingsGoal: data.savingsGoal,
      milestonesAwarded: [],
      isArchived: false,
    };
    setQuits(prev => [...prev, newQuit]);
  }, [setQuits]);

  // Milestone rewards: whenever a quit's current streak crosses milestones that
  // haven't been rewarded yet, grant the XP and celebrate. Runs when quits
  // change and periodically so day boundaries are caught while the app is open.
  // Backdated quits get their earned milestones immediately — that progress is real.
  const [dayTick, setDayTick] = useState(() => formatISO(new Date(), { representation: 'date' }));
  useEffect(() => {
    const id = window.setInterval(() => {
      setDayTick(formatISO(new Date(), { representation: 'date' }));
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let totalXp = 0;
    let celebration: { quitName: string; days: number; label: string; xp: number } | null = null;
    const updates = new Map<string, number[]>();

    quits.forEach(quit => {
      const due = dueMilestones(quit);
      if (due.length === 0) return;
      const xpForQuit = due.reduce((sum, m) => sum + m.xp, 0);
      totalXp += xpForQuit;
      updates.set(quit.id, due.map(m => m.days));
      const top = due[due.length - 1];
      celebration = { quitName: quit.name, days: top.days, label: top.label, xp: xpForQuit };
    });

    if (updates.size === 0) return;

    setQuits(prev => prev.map(q => {
      const awarded = updates.get(q.id);
      return awarded ? { ...q, milestonesAwarded: [...q.milestonesAwarded, ...awarded] } : q;
    }));
    awardXP(totalXp);
    setMilestoneCelebration(celebration);
    if (celebration && notificationPermission === 'granted') {
      const c = celebration as { quitName: string; days: number; label: string; xp: number };
      showAppNotification('Milestone reached! ⚔️', `${c.label} clean from "${c.quitName}"! +${c.xp} XP`);
    }
  }, [quits, dayTick, awardXP, setQuits, notificationPermission]);

  // Advance daily quests of a non-habit kind (resisted urge, journal entry).
  // Quest XP and the completion counter are granted here since these quests
  // complete outside the habit-completion path.
  const advanceQuestsOfType = useCallback((questType: QuestType) => {
    let xpGained = 0;
    let completedNow = 0;
    let changed = false;
    const updated = quests.map(quest => {
      if (quest.type !== questType || quest.isCompleted) return quest;
      changed = true;
      const newProgress = Math.min(quest.progress + 1, quest.objective.target);
      const isNowCompleted = newProgress >= quest.objective.target;
      if (isNowCompleted) {
        xpGained += quest.xpReward;
        completedNow++;
      }
      return { ...quest, progress: newProgress, isCompleted: isNowCompleted };
    });
    if (!changed) return;
    setQuests(updated);
    awardXP(xpGained);
    if (completedNow > 0) {
      setProfile(p => ({ ...p, totalQuestsCompleted: (p.totalQuestsCompleted || 0) + completedNow }));
    }
  }, [quests, setQuests, awardXP, setProfile]);

  // Resisting an urge is a real victory and gets immediate XP (capped per day
  // per quit so the reward stays meaningful). Returns the XP granted.
  const handleResistUrge = useCallback((quitId: string): number => {
    const quit = quits.find(q => q.id === quitId);
    if (!quit) return 0;

    const nowISO = formatISO(new Date());
    const todayKey = formatISO(new Date(), { representation: 'date' });
    const urgesToday = quit.urgesTodayDate === todayKey ? quit.urgesToday : 0;
    const xp = urgesToday < URGE_XP_DAILY_CAP ? URGE_RESIST_XP : 0;

    setQuits(prev => prev.map(q => q.id === quitId ? {
      ...q,
      urgesResisted: q.urgesResisted + 1,
      urgesTodayDate: todayKey,
      urgesToday: urgesToday + 1,
      urgeLog: [...(q.urgeLog || []), { date: nowISO }],
    } : q));
    awardXP(xp);
    advanceQuestsOfType(QuestType.RESIST_URGE);
    return xp;
  }, [quits, setQuits, awardXP, advanceQuestsOfType]);

  // Tags the most recent resisted urge with a trigger (chosen on the victory
  // screen, after the urge event itself was already recorded).
  const handleTagLastUrge = useCallback((quitId: string, trigger: string) => {
    setQuits(prev => prev.map(q => {
      if (q.id !== quitId) return q;
      const log = [...(q.urgeLog || [])];
      if (log.length === 0) return q;
      log[log.length - 1] = { ...log[log.length - 1], trigger };
      return { ...q, urgeLog: log };
    }));
  }, [setQuits]);

  // A relapse resets the current streak but NEVER the history: best streak and
  // total clean days are permanent. Milestones re-arm for the comeback.
  const handleRelapse = useCallback((quitId: string, note: string, trigger?: string) => {
    const nowISO = formatISO(new Date());
    setQuits(prev => prev.map(q => q.id === quitId ? {
      ...q,
      relapses: [...q.relapses, { date: nowISO, note: note.trim() || undefined, trigger }],
      startDate: nowISO,
      milestonesAwarded: [],
    } : q));
  }, [setQuits]);

  // Recovery badges (Iron Will, Boss Slayer) progress through quit activity,
  // which never goes through the habit-completion badge checks — so run one here.
  useEffect(() => {
    if (quits.length === 0) return;
    setProfile(prevProfile => {
      const { newlyUnlocked } = checkAndUnlockBadges({ profile: prevProfile, habits, completions, quits, tasks }, BADGE_CATALOG);
      if (newlyUnlocked.length === 0) return prevProfile;

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

      setNewlyUnlockedBadges(prev => {
        const existingIds = new Set(prev.map(b => b.badge.id + b.tier.tier));
        const trulyNew = unlockedForModal.filter(b => !existingIds.has(b.badge.id + b.tier.tier));
        return [...prev, ...trulyNew];
      });
      if (badgeXpGained > 0) {
        setTimeout(() => awardXP(badgeXpGained), 0);
      }

      return { ...prevProfile, unlockedBadges: { ...prevProfile.unlockedBadges, ...newBadgeTiers } };
    });
  }, [quits, dayTick, habits, completions, setProfile, setNewlyUnlockedBadges, awardXP]);

  const handleArchiveQuit = useCallback((quitId: string) => {
    setQuits(prev => prev.map(q => q.id === quitId ? { ...q, isArchived: !q.isArchived } : q));
  }, [setQuits]);

  const handleDeleteQuit = useCallback((quit: Quit) => {
    setQuitToDelete(quit);
  }, []);

  const confirmDeleteQuit = useCallback(() => {
    if (quitToDelete) {
      setQuits(prev => prev.filter(q => q.id !== quitToDelete.id));
      setQuitToDelete(null);
    }
  }, [quitToDelete, setQuits]);

  const cancelDeleteQuit = useCallback(() => {
    setQuitToDelete(null);
  }, []);

  // --- Daily journal (mood + note per day) ---
  const handleSaveDayNote = useCallback((dateKey: string, note: DayNote) => {
    const isMeaningful = !!note.text?.trim() || !!note.mood;
    setDayNotes(prev => {
      const next = { ...prev };
      if (!isMeaningful) {
        delete next[dateKey];
      } else {
        next[dateKey] = { mood: note.mood, text: note.text?.trim() || undefined };
      }
      return next;
    });
    // Journal quests only count a real entry for today.
    if (isMeaningful && dateKey === formatISO(new Date(), { representation: 'date' })) {
      advanceQuestsOfType(QuestType.JOURNAL);
    }
  }, [setDayNotes, advanceQuestsOfType]);

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
    quits,
    dayNotes,
    tasks,
    dailyTask,
    skins: SKINS,
    activeSkin,
    unlockedSkinIds,
    newlyUnlockedSkins,
    acknowledgeSkins,
    selectSkin,
    unlockCtx,
    handleAddTask,
    handleEditTask,
    handleCompleteTask,
    handlePushTask,
    handleDropTask,
    handleReopenTask,
    handleDeleteTask,
    handleAddQuit,
    handleResistUrge,
    handleTagLastUrge,
    handleRelapse,
    handleArchiveQuit,
    handleDeleteQuit,
    quitToDelete,
    confirmDeleteQuit,
    cancelDeleteQuit,
    milestoneCelebration,
    setMilestoneCelebration,
    handleSaveDayNote,
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
    pushConfigured: !!PUSH_SERVER_URL,
    pushEnabled,
    handleTogglePush,
    pushStatusMessage,
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
    lastAutoBackupDate,
    recoveryData,
    confirmRecovery,
    dismissRecovery,
    restoreConfirmation,
    handleConfirmRestoreAndReplace,
    handleConfirmRestoreAndKeep,
    handleCancelRestore,
    handleUpdateSettings,
  };
};