import React, { useState } from 'react';
import { Quest, Habit, Task } from '../types';
import QuestItem from './QuestItem';
import ProgressBar from './ProgressBar';
import SideQuestBoard from './SideQuestBoard';
import { openTasks } from '../utils/tasks';

interface QuestBoardProps {
  quests: Quest[];
  habits: Habit[];
  tasks: Task[];
  /** Sub-tab to open on (the daily card's "see all" deep-links here). */
  initialTab?: QuestTab;
  isToday: boolean;
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onCompleteTask: (taskId: string) => void;
  onDropTask: (taskId: string) => void;
  onReopenTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export type QuestTab = 'today' | 'side';

const QUEST_UNLOCK_TIERS = [3, 5, 7];

const DailyQuests: React.FC<{ quests: Quest[]; habits: Habit[]; isToday: boolean }> = ({ quests, habits, isToday }) => {
  if (!isToday) {
    return (
      <div className="text-center border-4 border-dashed border-frame-dim p-8 bg-surface shadow-hard">
        <p className="text-lg text-ink">Quests are today only.</p>
        <p className="mt-2 text-ink-dim">Go back to today.</p>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="text-center border-4 border-dashed border-frame-dim p-8 bg-surface shadow-hard">
        <p className="text-lg text-ink">Quest log empty.</p>
        <p className="mt-2 text-ink-dim">Add a habit to unlock quests.</p>
      </div>
    );
  }

  if (quests.length > 0) {
    const allDone = quests.every(q => q.isCompleted);
    return (
      <div className="space-y-4">
        {quests.map(quest => <QuestItem key={quest.id} quest={quest} />)}
        {allDone && (
          <div className="text-center border-4 border-dashed border-good p-6 bg-good-edge bg-opacity-30 shadow-hard">
            <p className="text-lg text-good-soft">All quests complete for today!</p>
          </div>
        )}
      </div>
    );
  }

  const nextTier = QUEST_UNLOCK_TIERS.find(tier => tier > habits.length);
  if (nextTier) {
    return (
      <div className="text-center border-4 border-dashed border-frame-dim p-8 bg-surface shadow-hard">
        <p className="text-lg text-ink mb-4">Unlock More Quests</p>
        <div className="w-full max-w-sm mx-auto">
          <ProgressBar value={habits.length} max={nextTier} label={`${habits.length}/${nextTier} habits`} />
        </div>
      </div>
    );
  }

  return (
    <div className="text-center border-4 border-dashed border-frame-dim p-8 bg-surface shadow-hard">
      <p className="text-lg text-ink-dim">No quests today. Check back tomorrow.</p>
    </div>
  );
};

/**
 * The quest log: today's generated quests, and the side quests you posted for
 * yourself. Both answer "what should I do beyond my habits?", which is why
 * they share a tab rather than costing a sixth one in the bar.
 */
const QuestBoard: React.FC<QuestBoardProps> = ({
  quests, habits, tasks, initialTab = 'today', isToday,
  onAddTask, onEditTask, onCompleteTask, onDropTask, onReopenTask, onDeleteTask,
}) => {
  const [tab, setTab] = useState<QuestTab>(initialTab);
  const openCount = openTasks(tasks).length;

  const TABS: { key: QuestTab; label: string; badge?: number }[] = [
    { key: 'today', label: 'Today' },
    { key: 'side', label: 'Side Quests', badge: openCount || undefined },
  ];

  return (
    <div className="mb-8">
      <div className="flex gap-2 mb-4" role="tablist">
        {TABS.map(t => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 min-w-0 px-2 py-2 border-2 text-[10px] pm:text-xs transition-colors ${
              tab === t.key
                ? 'bg-frame border-accent text-ink-hi'
                : 'bg-surface border-frame-dim text-ink-dim hover:bg-raised'
            }`}
          >
            <span className="truncate block">
              {t.label}{t.badge ? ` ${t.badge}` : ''}
            </span>
          </button>
        ))}
      </div>

      {tab === 'today'
        ? <DailyQuests quests={quests} habits={habits} isToday={isToday} />
        : (
          <SideQuestBoard
            tasks={tasks}
            onAdd={onAddTask}
            onEdit={onEditTask}
            onComplete={onCompleteTask}
            onDrop={onDropTask}
            onReopen={onReopenTask}
            onDelete={onDeleteTask}
          />
        )}
    </div>
  );
};

export default QuestBoard;
