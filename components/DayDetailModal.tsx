import React, { useEffect, useState } from 'react';
import { Habit, Completion, CompletionStatus, DayNote, Quit } from '../types';
import { format, formatISO, isSameDay } from 'date-fns';
import PixelatedButton from './PixelatedButton';

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  habits: Habit[];
  completions: Completion[];
  quits: Quit[];
  dayNote?: DayNote;
  onSaveNote: (dateKey: string, note: DayNote) => void;
}

export const MOODS: { value: number; emoji: string; label: string }[] = [
  { value: 1, emoji: '😞', label: 'Rough' },
  { value: 2, emoji: '😕', label: 'Meh' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
];

const StatusIndicator: React.FC<{ status: CompletionStatus | 'pending' }> = ({ status }) => {
    const statusMap = {
        [CompletionStatus.COMPLETED]: { text: 'Done', color: 'bg-good-soft' },
        [CompletionStatus.FAILED]: { text: 'Missed', color: 'bg-miss-hi' },
        [CompletionStatus.SKIPPED]: { text: 'Skipped', color: 'bg-raised' },
        'pending': { text: 'Pending', color: 'bg-accent-dim' },
    };
    const { text, color } = statusMap[status];
    return <span className={`px-2 py-0.5 text-xs text-ink-hi ${color}`}>{text}</span>;
};

const DayDetailModal: React.FC<DayDetailModalProps> = ({ isOpen, onClose, date, habits, completions, quits, dayNote, onSaveNote }) => {
  const [mood, setMood] = useState<number | undefined>(undefined);
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);

  // Reset only when the modal opens or the day changes — not when dayNote is
  // echoed back after a save, which would wipe the "Saved!" feedback.
  useEffect(() => {
    setMood(dayNote?.mood);
    setText(dayNote?.text || '');
    setSaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, isOpen]);

  if (!isOpen || !date) return null;

  const dateKey = formatISO(date, { representation: 'date' });
  const dayOfWeek = date.getDay();
  const scheduledHabits = habits.filter(h => !h.isArchived && h.scheduleDays.includes(dayOfWeek));

  const getStatusForHabit = (habitId: string): CompletionStatus | 'pending' => {
      const completion = completions.find(c => c.habitId === habitId && isSameDay(new Date(c.date), date!));
      return completion ? completion.status : 'pending';
  };

  const isDirty = mood !== dayNote?.mood || (text.trim() || '') !== (dayNote?.text || '');

  const handleSave = () => {
    onSaveNote(dateKey, { mood, text });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-scrim flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-surface border-4 border-frame shadow-hard p-6 max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h2 className="text-xl text-accent">{format(date, 'MMMM d, yyyy')}</h2>
          <button onClick={onClose} className="text-3xl text-ink hover:text-danger-hi leading-none">&times;</button>
        </div>
        <div className="overflow-y-auto pr-2">
            {quits.some(q => q.relapses.some(r => isSameDay(new Date(r.date), date!))) && (
                <div className="mb-4 space-y-2">
                    {quits.flatMap(q => q.relapses
                        .filter(r => isSameDay(new Date(r.date), date!))
                        .map((r, i) => (
                            <div key={q.id + i} className="p-3 bg-inset border-2 border-danger-edge text-xs text-ink-dim">
                                <span className="text-danger-hi">💥 Slip logged — {q.name}</span>
                                {r.trigger && <span className="ml-2 text-warn">[{r.trigger}]</span>}
                                {r.note && <p className="mt-1 italic">"{r.note}"</p>}
                            </div>
                        ))
                    )}
                </div>
            )}
            {scheduledHabits.length > 0 ? (
                 <ul className="space-y-3">
                    {scheduledHabits.map(habit => (
                        <li key={habit.id} className="flex justify-between items-center p-3 bg-inset border-2 border-frame-dim">
                           <span className="text-ink-hi">{habit.name}</span>
                           <StatusIndicator status={getStatusForHabit(habit.id)} />
                        </li>
                    ))}
                 </ul>
            ) : (
                <p className="text-center text-ink-dim p-4">Nothing scheduled.</p>
            )}

            <div className="mt-5 pt-4 border-t-2 border-frame-dim">
                <h3 className="text-sm text-accent uppercase mb-3">Journal</h3>
                <div className="flex justify-between gap-1 mb-3">
                    {MOODS.map(m => (
                        <button
                            key={m.value}
                            type="button"
                            title={m.label}
                            onClick={() => setMood(mood === m.value ? undefined : m.value)}
                            className={`flex-1 p-2 text-xl border-2 transition-colors ${mood === m.value ? 'bg-frame border-accent' : 'bg-inset border-frame-dim hover:border-frame'}`}
                        >
                            {m.emoji}
                        </button>
                    ))}
                </div>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={3}
                    placeholder="Triggers, wins, thoughts..."
                    className="w-full p-2 bg-inset border-2 border-frame focus:outline-none focus:border-accent text-sm placeholder:text-ink-faint"
                />
                <div className="flex justify-end items-center gap-3 mt-2">
                    {saved && <span className="text-xs text-good-soft">Saved!</span>}
                    <PixelatedButton onClick={handleSave} disabled={!isDirty} className="text-xs">
                        Save Note
                    </PixelatedButton>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DayDetailModal;
