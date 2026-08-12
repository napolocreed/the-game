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
import { isSameDay, formatISO } from 'date-fns';
import CalendarView from './components/CalendarView';
import DayDetailModal from './components/DayDetailModal';
import RestoreConflictModal from './components/RestoreConflictModal';
import QuitBoard from './components/QuitBoard';
import QuitChips from './components/QuitChips';
import DailyProgressBanner from './components/DailyProgressBanner';
import AddQuitModal from './components/AddQuitModal';
import UrgeModal from './components/UrgeModal';
import RelapseModal from './components/RelapseModal';
import MilestoneModal from './components/MilestoneModal';
import { Habit, Quit } from './types';
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
    quits,
    dayNotes,
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
    pushConfigured,
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
  } = useGameLogic();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddQuitModalOpen, setIsAddQuitModalOpen] = useState(false);
  const [urgeQuit, setUrgeQuit] = useState<Quit | null>(null);
  const [relapseQuit, setRelapseQuit] = useState<Quit | null>(null);

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
            <QuitChips quits={quits} onClick={() => setActiveTab('battles')} />
            <DailyProgressBanner
              habits={activeHabits}
              completions={completions}
              viewingDate={viewingDate}
            />
             { !isToday && !isViewingDateEditable && (
              <div className="text-center p-2 bg-yellow-900 border-y-2 border-yellow-700 text-yellow-200 text-sm mt-4">
                Past day — logging locked (48h limit).
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
                    <p className="text-xl text-[#f0e9d6]">Quests are today only.</p>
                    <p className="mt-2 text-[#b0a08f]">Go back to today.</p>
                </div>
            );
        }
        return <QuestBoard quests={quests} habits={activeHabits} />;
      case 'battles':
        return (
          <QuitBoard
            quits={quits}
            onAddQuit={() => setIsAddQuitModalOpen(true)}
            onResistUrge={setUrgeQuit}
            onRelapse={setRelapseQuit}
            onArchive={handleArchiveQuit}
            onDelete={handleDeleteQuit}
          />
        );
      case 'calendar':
        return <CalendarView habits={habits} completions={completions} dayNotes={dayNotes} quits={quits} onDayClick={handleDayClick} />;
      case 'progress':
        return <ProgressPage habits={habits} completions={completions} profile={profile} quits={quits} dayNotes={dayNotes} />;
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
            <p>Archive "{habit.name}"?</p>
            <p className="text-sm text-yellow-300 mt-2">Hidden from your list. History kept.</p>
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
            <p>Delete "{habit.name}" forever?</p>
            <p className="text-sm text-red-400 mt-2">This action cannot be undone.</p>
          </>
        )
      };
    }
    return null;
  }
  
  const confirmModalContent = getConfirmModalContent();

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#2c2121] text-[#f0e9d6] p-4 sm:p-6 md:p-8">
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
        pushConfigured={pushConfigured}
        pushEnabled={pushEnabled}
        onTogglePush={handleTogglePush}
        pushStatusMessage={pushStatusMessage}
        onExportData={handleExportData}
        onImportData={handleImportFileSelect}
        autoBackupEnabled={autoBackupEnabled}
        onToggleAutoBackup={setAutoBackupEnabled}
        lastAutoBackupDate={lastAutoBackupDate}
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
                <p className="text-sm text-red-400 mt-2">Overwrites all current data. Cannot be undone.</p>
            </ConfirmModal>
       )}
       {recoveryData && (
            <ConfirmModal
                isOpen={!!recoveryData}
                onClose={dismissRecovery}
                onConfirm={confirmRecovery}
                title="Recover Your Data?"
                confirmText="Recover"
                confirmClass="bg-green-800 hover:bg-green-700 border-green-900 shadow-[4px_4px_0px_#052e16]"
            >
                <p>Your saved data appears to be empty, but a device backup was found{recoveryData.savedAt ? ` (from ${new Date(recoveryData.savedAt).toLocaleDateString()})` : ''}.</p>
                <p className="text-sm text-green-300 mt-2">
                    It contains {(recoveryData.habits?.length ?? 0)} habit(s) and {(recoveryData.completions?.length ?? 0)} log entries. Recover it now?
                </p>
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
        quits={quits}
        dayNote={selectedDate ? dayNotes[formatISO(selectedDate, { representation: 'date' })] : undefined}
        onSaveNote={handleSaveDayNote}
       />
       <AddQuitModal
        isOpen={isAddQuitModalOpen}
        onClose={() => setIsAddQuitModalOpen(false)}
        onAddQuit={handleAddQuit}
       />
       <UrgeModal
        isOpen={!!urgeQuit}
        quit={urgeQuit}
        onClose={() => setUrgeQuit(null)}
        onResisted={handleResistUrge}
        onTagTrigger={handleTagLastUrge}
       />
       <RelapseModal
        isOpen={!!relapseQuit}
        quit={relapseQuit}
        onClose={() => setRelapseQuit(null)}
        onConfirm={(quitId, note, trigger) => {
          handleRelapse(quitId, note, trigger);
          setRelapseQuit(null);
        }}
       />
       <MilestoneModal
        celebration={milestoneCelebration}
        onClose={() => setMilestoneCelebration(null)}
       />
       {quitToDelete && (
           <ConfirmModal
                isOpen={!!quitToDelete}
                onClose={cancelDeleteQuit}
                onConfirm={confirmDeleteQuit}
                title="Delete This Boss Fight?"
                confirmText="Delete"
                confirmClass="bg-red-800 hover:bg-red-700 border-red-900 shadow-[4px_4px_0px_#450a0a]"
           >
                <p>Permanently delete "{quitToDelete.name}" and all its history?</p>
                <p className="text-sm text-red-400 mt-2">Cannot be undone. Pause it instead?</p>
           </ConfirmModal>
       )}
       {showUpdateNotification && <UpdateNotification onUpdate={handleUpdate} />}
    </div>
  );
};

export default App;