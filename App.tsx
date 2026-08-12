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
import TodaysTaskCard from './components/TodaysTaskCard';
import AddTaskModal from './components/AddTaskModal';
import AddQuitModal from './components/AddQuitModal';
import UrgeModal from './components/UrgeModal';
import RelapseModal from './components/RelapseModal';
import MilestoneModal from './components/MilestoneModal';
import { Habit, Quit, Task } from './types';
import * as serviceWorkerRegistration from './utils/serviceWorkerRegistration';
import UpdateNotification from './components/UpdateNotification';
import SkinUnlockModal from './components/SkinUnlockModal';


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
    tasks,
    dailyTask,
    skins,
    activeSkin,
    newlyUnlockedSkins,
    acknowledgeSkins,
    selectSkin,
    unlockCtx,
    shownSkin,
    skinPreview,
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
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  // The daily card's "see all" deep-links straight into the side-quest list.
  const [questTab, setQuestTab] = useState<'today' | 'side'>('today');

  // Android long-press shortcuts land here. A PWA cannot draw a home-screen
  // widget — that manifest member is Windows-only — so the app-icon menu is
  // the real deep-link surface on a phone.
  useEffect(() => {
    const go = new URLSearchParams(window.location.search).get('go');
    if (!go) return;
    if (go === 'habits') setActiveTab('habits');
    if (go === 'battles') setActiveTab('battles');
    if (go === 'sidequests') { setQuestTab('side'); setActiveTab('quests'); }
    window.history.replaceState({}, '', window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


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
              <div className="text-center p-2 bg-notice border-y-2 border-notice-edge text-warn text-sm mt-4">
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
            {isToday && (
              <TodaysTaskCard
                task={dailyTask}
                onComplete={handleCompleteTask}
                onPush={handlePushTask}
                onOpenBoard={() => { setQuestTab('side'); setActiveTab('quests'); }}
                allPushedToday={tasks.some(t => !t.completedAt && !t.droppedAt)}
              />
            )}
          </>
        );
      case 'quests':
        return (
          <QuestBoard
            quests={quests}
            habits={activeHabits}
            tasks={tasks}
            key={questTab}
            initialTab={questTab}
            isToday={isSameDay(viewingDate, new Date())}
            onAddTask={() => { setTaskToEdit(null); setIsAddTaskModalOpen(true); }}
            onEditTask={task => { setTaskToEdit(task); setIsAddTaskModalOpen(true); }}
            onCompleteTask={handleCompleteTask}
            onDropTask={handleDropTask}
            onReopenTask={handleReopenTask}
            onDeleteTask={handleDeleteTask}
          />
        );
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
        return (
          <ProgressPage
            habits={habits} completions={completions} profile={profile} quits={quits}
            dayNotes={dayNotes} tasks={tasks} skins={skins} unlockCtx={unlockCtx}
            onOpenSkins={() => setIsSettingsModalOpen(true)}
          />
        );
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
        confirmClass: "bg-miss-hi hover:bg-miss-hi border-miss-edge shadow-miss",
        content: (
          <>
            <p>Archive "{habit.name}"?</p>
            <p className="text-sm text-warn mt-2">Hidden from your list. History kept.</p>
          </>
        )
      };
    }
    if (action === 'delete') {
      return {
        title: "Delete Habit Permanently?",
        confirmText: "Delete",
        confirmClass: "bg-danger hover:bg-danger-hi border-danger-edge shadow-danger",
        content: (
          <>
            <p>Delete "{habit.name}" forever?</p>
            <p className="text-sm text-danger-hi mt-2">This action cannot be undone.</p>
          </>
        )
      };
    }
    return null;
  }
  
  const confirmModalContent = getConfirmModalContent();

  return (
    <div className="min-h-screen overflow-x-hidden bg-inset text-ink p-4 sm:p-6 md:p-8">
      {/* A skin's weather. Empty and invisible unless the worn skin declares
          one, and never in the way of a tap. */}
      <div className="skin-fx" aria-hidden="true">
        <span className="fx-a" />
        <span className="fx-b" />
      </div>
      {/* Previewing repaints the whole app, so it has to announce itself —
          otherwise you eventually forget and think you own the thing. */}
      {skinPreview.previewSkinId && (
        <button
          onClick={() => { skinPreview.setPreviewSkinId(null); skinPreview.setPreviewAgeDays(null); }}
          className="fixed top-0 left-0 right-0 z-[10000] bg-warn text-canvas text-[10px] py-1 px-2 text-center"
        >
          Previewing {shownSkin.name} — tap to stop
        </button>
      )}
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
        skinPreview={skinPreview}
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
        skins={skins}
        activeSkinId={activeSkin.id}
        unlockCtx={unlockCtx}
        onSelectSkin={selectSkin}
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
                confirmClass="bg-danger hover:bg-danger-hi border-danger-edge shadow-danger"
            >
                <p className="text-sm text-danger-hi mt-2">Overwrites all current data. Cannot be undone.</p>
            </ConfirmModal>
       )}
       {recoveryData && (
            <ConfirmModal
                isOpen={!!recoveryData}
                onClose={dismissRecovery}
                onConfirm={confirmRecovery}
                title="Recover Your Data?"
                confirmText="Recover"
                confirmClass="bg-good-edge hover:bg-good border-good-edge shadow-good"
            >
                <p>Your saved data appears to be empty, but a device backup was found{recoveryData.savedAt ? ` (from ${new Date(recoveryData.savedAt).toLocaleDateString()})` : ''}.</p>
                <p className="text-sm text-good-soft mt-2">
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
       <AddTaskModal
        isOpen={isAddTaskModalOpen}
        editing={taskToEdit}
        onClose={() => { setIsAddTaskModalOpen(false); setTaskToEdit(null); }}
        onSubmit={data => {
          if (taskToEdit) handleEditTask(taskToEdit.id, data);
          else handleAddTask(data);
        }}
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
                confirmClass="bg-danger hover:bg-danger-hi border-danger-edge shadow-danger"
           >
                <p>Permanently delete "{quitToDelete.name}" and all its history?</p>
                <p className="text-sm text-danger-hi mt-2">Cannot be undone. Pause it instead?</p>
           </ConfirmModal>
       )}
       {/* Shown after the badge modal so a level-up reads in order: what you
           achieved, then what it unlocked. */}
       {newlyUnlockedBadges.length === 0 && newlyUnlockedSkins.length > 0 && (
         <SkinUnlockModal
           skins={newlyUnlockedSkins}
           activeSkinId={activeSkin.id}
           onWear={selectSkin}
           onClose={acknowledgeSkins}
         />
       )}
       {showUpdateNotification && <UpdateNotification onUpdate={handleUpdate} />}
    </div>
  );
};

export default App;