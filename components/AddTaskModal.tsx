import React, { useEffect, useState } from 'react';
import PixelatedButton from './PixelatedButton';
import { HabitCategory, Task, TaskSize } from '../types';
import { CATEGORY_HEX, CATEGORY_SHADOW_HEX } from '../utils/categoryColors';
import { CATEGORY_ICONS } from './icons/CategoryIcons';
import { SizeBigIcon, SizeMediumIcon, SizeQuickIcon } from './icons/TaskIcons';

interface TaskDraft {
  name: string;
  category: HabitCategory;
  size: TaskSize;
  dueDate?: string | null;
  note?: string;
  /** Backdated start, so a thing you have dodged for two years says so. */
  createdAt?: string | null;
}

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskDraft) => void;
  /** When set the modal edits this task instead of creating one. */
  editing?: Task | null;
}

const SIZES: { value: TaskSize; label: string; hint: string; Icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
  { value: TaskSize.QUICK, label: 'Quick', hint: 'minutes', Icon: SizeQuickIcon },
  { value: TaskSize.MEDIUM, label: 'Medium', hint: 'an hour', Icon: SizeMediumIcon },
  { value: TaskSize.BIG, label: 'Big', hint: 'a session', Icon: SizeBigIcon },
];

const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onSubmit, editing }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<HabitCategory>(HabitCategory.LIFESTYLE);
  const [size, setSize] = useState<TaskSize>(TaskSize.MEDIUM);
  const [dueDate, setDueDate] = useState('');
  const [since, setSince] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setName(editing?.name ?? '');
    setCategory(editing?.category ?? HabitCategory.LIFESTYLE);
    setSize(editing?.size ?? TaskSize.MEDIUM);
    setDueDate(editing?.dueDate ? editing.dueDate.slice(0, 10) : '');
    setSince('');
    setNote(editing?.note ?? '');
  }, [isOpen, editing]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    // Backdating is only offered at creation. The clock must never be
    // editable afterwards, or every age statistic collapses in one tap.
    let createdAt: string | null = null;
    if (!editing && since) {
      const parsed = new Date(`${since}T12:00:00`);
      if (!Number.isNaN(parsed.getTime()) && parsed <= new Date()) {
        createdAt = parsed.toISOString();
      }
    }

    onSubmit({
      name: name.trim(),
      category,
      size,
      dueDate: dueDate ? new Date(`${dueDate}T12:00:00`).toISOString() : null,
      note: note.trim() || undefined,
      createdAt,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-scrim flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-surface border-4 border-frame shadow-hard p-4 pm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 gap-2">
          <h2 className="text-lg pm:text-xl text-accent min-w-0 break-words">
            {editing ? 'Edit Side Quest' : 'New Side Quest'}
          </h2>
          <button onClick={onClose} aria-label="Close" className="text-3xl text-ink hover:text-danger-hi leading-none shrink-0">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 text-sm uppercase" htmlFor="task-name">What needs doing?</label>
            <input
              id="task-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Book the dentist, prune the hedge..."
              required
              autoFocus
              className="w-full p-2 bg-inset border-2 border-frame focus:outline-none focus:border-accent placeholder:text-ink-faint"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm uppercase">How big?</label>
            <div className="grid grid-cols-3 gap-2">
              {SIZES.map(({ value, label, hint, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSize(value)}
                  aria-pressed={size === value}
                  className={`flex flex-col items-center gap-1 py-2 border-2 transition-colors ${
                    size === value
                      ? 'bg-frame border-accent text-ink-hi'
                      : 'bg-inset border-frame-dim text-ink-dim hover:bg-surface'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px]">{label}</span>
                  <span className="text-[8px] text-ink-dim">{hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm uppercase">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(HabitCategory).map(cat => {
                const Icon = CATEGORY_ICONS[cat];
                const selected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    aria-pressed={selected}
                    className={`flex items-center gap-2 px-2 py-2 border-2 text-[10px] pm:text-xs transition-colors ${
                      selected ? 'border-accent text-ink-hi' : 'border-frame-dim text-ink-dim'
                    }`}
                    style={selected
                      ? { backgroundColor: CATEGORY_HEX[cat], boxShadow: `3px 3px 0px ${CATEGORY_SHADOW_HEX[cat]}` }
                      : { backgroundColor: 'var(--inset)' }}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="min-w-0 truncate">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {!editing && (
            <div>
              <label className="block mb-2 text-sm uppercase" htmlFor="task-since">Putting it off since (optional)</label>
              <input
                id="task-since"
                type="date"
                value={since}
                max={new Date().toISOString().slice(0, 10)}
                onChange={e => setSince(e.target.value)}
                className="w-full p-2 bg-inset border-2 border-frame focus:outline-none focus:border-accent"
              />
              <p className="text-xs text-warn mt-1">That wait was real. Count it.</p>
            </div>
          )}

          <div>
            <label className="block mb-2 text-sm uppercase" htmlFor="task-due">Real deadline (optional)</label>
            <input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full p-2 bg-inset border-2 border-frame focus:outline-none focus:border-accent"
            />
            {/* Leaving this blank is the normal case. A made-up due date is the
                thing that teaches you to ignore red badges. */}
            <p className="text-xs text-warn mt-1">Only if one truly exists.</p>
          </div>

          <div>
            <label className="block mb-2 text-sm uppercase" htmlFor="task-note">Note (optional)</label>
            <textarea
              id="task-note"
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              placeholder="Phone number, what to bring, first step..."
              className="w-full p-2 bg-inset border-2 border-frame focus:outline-none focus:border-accent text-sm placeholder:text-ink-faint"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm text-ink-dim border-2 border-dashed border-frame-dim hover:text-ink-hi"
            >
              Cancel
            </button>
            <PixelatedButton type="submit" className="flex-1 text-sm">
              {editing ? 'Save' : 'Post it'}
            </PixelatedButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;
