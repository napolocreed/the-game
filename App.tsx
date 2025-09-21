import React, { useState, useEffect } from 'react';
import { useGameLogic } from './hooks/useGameLogic';
import Header from './components/Header';
import HabitList from './components/HabitList';
import AddHabitModal from './components/AddHabitModal';
import BadgeUnlockModal from './components/BadgeUnlockModal';
import QuestBoard from './components/QuestBoard';
import Tabs from './components/Tabs';
import ProgressPage from './components/ProgressPage';
import SettingsModal from './components/SettingsModal';
import ConfirmModal from './components/ConfirmModal';
import TimeNavigator from './components/TimeNavigator';
import { isSameDay } from 'date-fns';
import CalendarView from './components/CalendarView';
import DayDetailModal from './components/DayDetailModal';
import RestoreConflictModal from './components/RestoreConflictModal';
import { Habit } from './types';
import * as serviceWorkerRegistration from './utils/serviceWorkerRegistration';
import UpdateNotification from './components/UpdateNotification';


const App: React.FC = () => {
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    serviceWorkerRegistration.register({
      onUpdate: registration => {
        setWaitingWorker(registration.waiting);
        setShowUpdateNotification(true);
      },
    });
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setShowUpdateNotification(false);
      // Add a listener to reload the page once the new service worker has taken control
      let refreshing;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        window.location.reload();
        refreshing = true;
      });
    }
  };

  const {
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
    confirmAction,
    cancelConfirmAction,
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
  } = useGameLogic();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const activeHabits = habits.filter(h => !h.isArchived);
  
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleDuplicateClick = (habit: Habit) => {
    setHabitToDuplicate(habit);
    setIsAddHabitModalOpen(true);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'habits':
        const isToday = isSameDay(new Date(), viewingDate);

        return (
          <>
            <TimeNavigator
              viewingDate={viewingDate}
              onPrevious={goToPreviousDay}
              onNext={goToNextDay}
              onToday={goToToday}
            />
             { !isToday && !isViewingDateEditable && (
              <div className="text-center p-2 bg-yellow-900 border-y-2 border-yellow-700 text-yellow-200 text-sm mt-4">
                Viewing a past day. Logging is disabled (48-hour limit).
              </div>
            )}
            <div className="mt-6">
              <HabitList 
                habits={activeHabits} 
                completions={completions}
                viewingDate={viewingDate}
                isEditable={isViewingDateEditable}
                onComplete={handleCompleteHabit} 
                onFail={handleFailHabit}
                onSkip={handleSkipHabit}
                onUndo={handleUndoCompletion}
                onArchive={handleArchiveHabit}
                onReorder={handleReorderHabits}
                onDuplicate={handleDuplicateClick}
                onAddNewHabit={() => setIsAddHabitModalOpen(true)}
                dailyHabitLimit={profile.settings?.dailyHabitLimit ?? null}
              />
            </div>
          </>
        );
      case 'quests':
        const isViewingToday = isSameDay(viewingDate, new Date());
        if (!isViewingToday) {
            return (
                <div className="text-center border-4 border-dashed border-[#6a5340] p-10 bg-[#4a3f36] shadow-[8px_8px_0px_#1a1515] mt-8">
                    <p className="text-xl text-[#f0e9d6]">Quests are only available for today.</p>
                    <p className="mt-2 text-[#b0a08f]">Navigate back to the current day to see your active quests.</p>
                </div>
            );
        }
        return <QuestBoard quests={quests} habits={activeHabits} />;
      case 'calendar':
        return <CalendarView habits={habits} completions={completions} onDayClick={handleDayClick} />;
      case 'progress':
        return <ProgressPage habits={habits} completions={completions} profile={profile} />;
      default:
        return null;
    }
  };

  const getConfirmModalContent = () => {
    if (!habitToConfirmAction) return null;
    const { habit, action } = habitToConfirmAction;
    if (action === 'archive') {
      return {
        title: "Archive Habit?",
        confirmText: "Archive",
        confirmClass: "bg-orange-700 hover:bg-orange-600 border-orange-800 shadow-[4px_4px_0px_#7c2d12]",
        content: (
          <>
            <p>Are you sure you want to archive "{habit.name}"?</p>
            <p className="text-sm text-yellow-300 mt-2">It will be hidden from your daily list but its history will be saved.</p>
          </>
        )
      };
    }
    if (action === 'delete') {
      return {
        title: "Delete Habit Permanently?",
        confirmText: "Delete",
        confirmClass: "bg-red-800 hover:bg-red-700 border-red-900 shadow-[4px_4px_0px_#450a0a]",
        content: (
          <>
            <p>Are you sure you want to permanently delete "{habit.name}"?</p>
            <p className="text-sm text-red-400 mt-2">This action cannot be undone.</p>
          </>
        )
      };
    }
    return null;
  }
  
  const confirmModalContent = getConfirmModalContent();

  return (
    <div className="min-h-screen bg-[#2c2121] text-[#f0e9d6] p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Header profile={profile} onSettingsClick={() => setIsSettingsModalOpen(true)} />
        <main>
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="mt-6">
            {renderContent()}
          </div>
        </main>
      </div>
      <AddHabitModal
        isOpen={isAddHabitModalOpen}
        onClose={() => {
            setIsAddHabitModalOpen(false);
            setHabitToDuplicate(null);
        }}
        onAddHabit={handleAddHabit}
        habitToDuplicate={habitToDuplicate}
      />
      <BadgeUnlockModal
        isOpen={newlyUnlockedBadges.length > 0}
        onClose={() => setNewlyUnlockedBadges([])}
        badges={newlyUnlockedBadges}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        profile={profile}
        habits={habits}
        onRestore={handleRestoreHabit}
        onDelete={handleDeletePermanently}
        notificationPermission={notificationPermission}
        onRequestPermission={requestNotificationPermission}
        onSendTestNotification={handleSendTestNotification}
        testNotifMessage={testNotifMessage}
        onExportData={handleExportData}
        onImportData={handleImportFileSelect}
        autoBackupEnabled={autoBackupEnabled}
        onToggleAutoBackup={setAutoBackupEnabled}
        onUpdateSettings={handleUpdateSettings}
       />
       {confirmModalContent && (
           <ConfirmModal
                isOpen={!!habitToConfirmAction}
                onClose={cancelConfirmAction}
                onConfirm={confirmAction}
                title={confirmModalContent.title}
                confirmText={confirmModalContent.confirmText}
                confirmClass={confirmModalContent.confirmClass}
           >
                {confirmModalContent.content}
           </ConfirmModal>
       )}
       {importFileContent && (
            <ConfirmModal
                isOpen={!!importFileContent}
                onClose={cancelImport}
                onConfirm={confirmImport}
                title="Restore from Backup?"
                confirmText="Restore & Overwrite"
                confirmClass="bg-red-800 hover:bg-red-700 border-red-900 shadow-[4px_4px_0px_#450a0a]"
            >
                <p>Are you sure you want to restore from this backup?</p>
                <p className="text-sm text-red-400 mt-2">This will permanently overwrite all your current data. This action cannot be undone.</p>
            </ConfirmModal>
       )}
       {restoreConfirmation && (
          <RestoreConflictModal
            isOpen={!!restoreConfirmation}
            onClose={handleCancelRestore}
            onReplace={handleConfirmRestoreAndReplace}
            onKeepBoth={handleConfirmRestoreAndKeep}
            originalHabitName={restoreConfirmation.habitToRestore.name}
            duplicateHabitName={restoreConfirmation.duplicateHabit.name}
          />
       )}
       <DayDetailModal
        isOpen={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        date={selectedDate}
        habits={habits}
        completions={completions}
       />
       {showUpdateNotification && <UpdateNotification onUpdate={handleUpdate} />}
    </div>
  );
};

export default App;