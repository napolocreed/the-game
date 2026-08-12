import React, { useMemo, useState } from 'react';
import { Task } from '../types';
import { ageDays, anchor, isOpen, openTasks, pushCount, taskXp } from '../utils/tasks';
import { CATEGORY_HEX, CATEGORY_SHADOW_HEX } from '../utils/categoryColors';
import { CATEGORY_ICONS } from './icons/CategoryIcons';
import { CheckIcon } from './icons/CheckIcon';
import { HourglassIcon, SizeBigIcon, SizeMediumIcon, SizeQuickIcon } from './icons/TaskIcons';
import { TrashIcon } from './icons/TrashIcon';
import { UndoIcon } from './icons/UndoIcon';
import { PlusIcon } from './icons/PlusIcon';
import PixelatedButton from './PixelatedButton';
import { TaskSize } from '../types';
import { differenceInCalendarDays, format } from 'date-fns';

interface SideQuestBoardProps {
  tasks: Task[];
  onAdd: () => void;
  onEdit: (task: Task) => void;
  onComplete: (taskId: string) => void;
  onDrop: (taskId: string) => void;
  onReopen: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

const SIZE_LABEL: { [key in TaskSize]: string } = {
  [TaskSize.QUICK]: 'quick',
  [TaskSize.MEDIUM]: 'medium',
  [TaskSize.BIG]: 'big',
};

const SIZE_ICON: { [key in TaskSize]: React.FC<React.SVGProps<SVGSVGElement>> } = {
  [TaskSize.QUICK]: SizeQuickIcon,
  [TaskSize.MEDIUM]: SizeMediumIcon,
  [TaskSize.BIG]: SizeBigIcon,
};

type Filter = 'open' | 'quick' | 'done';

const TaskRow: React.FC<{
  task: Task;
  onEdit: (task: Task) => void;
  onComplete: (id: string) => void;
  onDrop: (id: string) => void;
  onReopen: (id: string) => void;
  onDelete: (id: string) => void;
}> = ({ task, onEdit, onComplete, onDrop, onReopen, onDelete }) => {
  const CategoryIcon = CATEGORY_ICONS[task.category];
  const SizeIcon = SIZE_ICON[task.size] ?? SizeMediumIcon;
  const open = isOpen(task);
  const age = ageDays(task);
  const pushes = pushCount(task);
  const dueIn = task.dueDate ? differenceInCalendarDays(new Date(task.dueDate), new Date()) : null;
  const waited = task.completedAt
    ? differenceInCalendarDays(new Date(task.completedAt), new Date(task.createdAt))
    : null;

  return (
    <div className={`bg-[#4a3f36] border-4 border-[#8a6a4f] p-3 shadow-[8px_8px_0px_#1a1515] ${open ? '' : 'opacity-70'}`}>
      <div className="flex items-start gap-2">
        <span
          className="shrink-0 w-6 h-6 flex items-center justify-center"
          style={{
            backgroundColor: CATEGORY_HEX[task.category],
            boxShadow: `2px 2px 0px ${CATEGORY_SHADOW_HEX[task.category]}`,
          }}
          title={task.category}
        >
          <CategoryIcon className="w-3.5 h-3.5 text-white" />
        </span>
        <button
          onClick={() => open && onEdit(task)}
          disabled={!open}
          className={`flex-1 min-w-0 text-left text-sm pm:text-base leading-snug break-words ${
            open ? 'text-[#f0e9d6] hover:text-white' : 'text-[#b0a08f] line-through'
          }`}
        >
          {task.name}
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#b0a08f]">
        {open ? (
          <>
            <span className="flex items-center gap-1">
              <HourglassIcon className="w-4 h-4" />
              {age === 0 ? 'today' : `${age}d`}
            </span>
            <span className="flex items-center gap-1">
              <SizeIcon className="w-4 h-4" />
              {SIZE_LABEL[task.size] ?? ''}
            </span>
            {pushes > 0 && <span>pushed {pushes}×</span>}
            {dueIn !== null && (
              <span className={dueIn <= 3 ? 'text-orange-300' : ''}>
                {dueIn < 0 ? `due ${Math.abs(dueIn)}d ago` : dueIn === 0 ? 'due today' : `due ${format(new Date(task.dueDate!), 'MMM d')}`}
              </span>
            )}
            <span className="text-purple-300">+{taskXp(task)} XP</span>
          </>
        ) : task.completedAt ? (
          <span className="text-[#3b9b73]">
            done{waited !== null && waited >= 30 ? ` after ${waited}d` : ''}
          </span>
        ) : (
          <span>let go</span>
        )}
      </div>

      <div className="mt-2 flex gap-2">
        {open ? (
          <>
            <button
              onClick={() => onComplete(task.id)}
              className="flex-[3] flex items-center justify-center gap-2 h-10 border-2 border-green-900 bg-green-700 hover:bg-green-600 text-white text-xs transition-colors"
            >
              <CheckIcon className="w-4 h-4" />
              Done
            </button>
            <button
              onClick={() => onDrop(task.id)}
              title="Let this one go — not a failure, a decision"
              className="flex-1 h-10 border-2 border-[#4a3f36] bg-[#6a5340] hover:bg-[#8a6a4f] text-[#f0e9d6] text-xs transition-colors"
            >
              Let go
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onReopen(task.id)}
              title="Put it back on the board"
              className="flex-1 flex items-center justify-center gap-2 h-10 border-2 border-[#4a3f36] bg-[#6a5340] hover:bg-[#8a6a4f] text-[#f0e9d6] text-xs transition-colors"
            >
              <UndoIcon className="w-4 h-4" />
              Reopen
            </button>
            <button
              onClick={() => onDelete(task.id)}
              title="Delete permanently"
              aria-label="Delete permanently"
              className="w-10 h-10 flex items-center justify-center border-2 border-[#4a3f36] bg-[#6a5340] hover:bg-red-900 transition-colors"
            >
              <TrashIcon className="w-4 h-4 text-red-400" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const SideQuestBoard: React.FC<SideQuestBoardProps> = ({ tasks, onAdd, onEdit, onComplete, onDrop, onReopen, onDelete }) => {
  const [filter, setFilter] = useState<Filter>('open');

  const open = openTasks(tasks);
  const top = anchor(tasks);

  const shown = useMemo(() => {
    if (filter === 'done') {
      return tasks
        .filter(t => !isOpen(t))
        .sort((a, b) => new Date(b.completedAt ?? b.droppedAt ?? 0).getTime() - new Date(a.completedAt ?? a.droppedAt ?? 0).getTime())
        .slice(0, 30);
    }
    const list = filter === 'quick' ? open.filter(t => t.size === TaskSize.QUICK) : open;
    // Oldest first, always. The list itself is the argument: the thing at the
    // top is the thing that has been waiting longest, and nothing else.
    return [...list].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [tasks, open, filter]);

  const FILTERS: { key: Filter; label: string; count: number }[] = [
    { key: 'open', label: 'Open', count: open.length },
    { key: 'quick', label: 'Quick', count: open.filter(t => t.size === TaskSize.QUICK).length },
    { key: 'done', label: 'Closed', count: tasks.length - open.length },
  ];

  return (
    <div>
      {top && (
        <div className="bg-[#2c2121] border-2 border-[#8a6a4f] p-3 mb-4">
          <p className="text-[10px] text-[#b0a08f] uppercase tracking-wider">Longest waiting</p>
          <p className="text-sm text-[#f0e9d6] mt-1 break-words">{top.task.name}</p>
          <p className="text-xs text-[#f5b342] mt-1">{top.days}d</p>
        </div>
      )}

      <div className="flex gap-2 mb-4" role="tablist">
        {FILTERS.map(f => (
          <button
            key={f.key}
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-1 min-w-0 px-1 py-2 border-2 text-[10px] pm:text-xs transition-colors ${
              filter === f.key
                ? 'bg-[#8a6a4f] border-[#f5b342] text-white'
                : 'bg-[#4a3f36] border-[#6a5340] text-[#b0a08f] hover:bg-[#6a5340]'
            }`}
          >
            <span className="truncate block">{f.label} {f.count}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="text-center border-4 border-dashed border-[#6a5340] p-8 bg-[#4a3f36] shadow-[8px_8px_0px_#1a1515]">
          <p className="text-lg text-[#f0e9d6]">
            {filter === 'done' ? 'Nothing closed yet.' : filter === 'quick' ? 'No quick ones.' : 'Board is clear.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              onEdit={onEdit}
              onComplete={onComplete}
              onDrop={onDrop}
              onReopen={onReopen}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      <PixelatedButton onClick={onAdd} className="w-full mt-4 text-sm">
        <PlusIcon className="w-5 h-5 mr-2" />
        New Side Quest
      </PixelatedButton>
    </div>
  );
};

export default SideQuestBoard;
