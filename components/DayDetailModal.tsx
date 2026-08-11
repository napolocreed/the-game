import React, { useEffect, useState } from 'react';
import { Habit, Completion, CompletionStatus, DayNote } from '../types';
import { format, formatISO, isSameDay } from 'date-fns';
import PixelatedButton from './PixelatedButton';

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  habits: Habit[];
  completions: Completion[];
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
        [CompletionStatus.COMPLETED]: { text: 'Done', color: 'bg-green-500' },
        [CompletionStatus.FAILED]: { text: 'Missed', color: 'bg-orange-500' },
        [CompletionStatus.SKIPPED]: { text: 'Skipped', color: 'bg-gray-500' },
        'pending': { text: 'Pending', color: 'bg-yellow-700' },
    };
    const { text, color } = statusMap[status];
    return <span className={`px-2 py-0.5 text-xs text-white ${color}`}>{text}</span>;
};

const DayDetailModal: React.FC<DayDetailModalProps> = ({ isOpen, onClose, date, habits, completions, dayNote, onSaveNote }) => {
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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-[#4a3f36] border-4 border-[#8a6a4f] shadow-[8px_8px_0px_#1a1515] p-6 max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h2 className="text-xl text-[#f5b342]">{format(date, 'MMMM d, yyyy')}</h2>
          <button onClick={onClose} className="text-3xl text-[#f0e9d6] hover:text-red-500 leading-none">&times;</button>
        </div>
        <div className="overflow-y-auto pr-2">
            {scheduledHabits.length > 0 ? (
                 <ul className="space-y-3">
                    {scheduledHabits.map(habit => (
                        <li key={habit.id} className="flex justify-between items-center p-3 bg-[#2c2121] border-2 border-[#6a5340]">
                           <span className="text-white">{habit.name}</span>
                           <StatusIndicator status={getStatusForHabit(habit.id)} />
                        </li>
                    ))}
                 </ul>
            ) : (
                <p className="text-center text-[#b0a08f] p-4">No habits were scheduled for this day.</p>
            )}

            <div className="mt-5 pt-4 border-t-2 border-[#6a5340]">
                <h3 className="text-sm text-[#f5b342] uppercase mb-3">Journal</h3>
                <div className="flex justify-between gap-1 mb-3">
                    {MOODS.map(m => (
                        <button
                            key={m.value}
                            type="button"
                            title={m.label}
                            onClick={() => setMood(mood === m.value ? undefined : m.value)}
                            className={`flex-1 p-2 text-xl border-2 transition-colors ${mood === m.value ? 'bg-[#8a6a4f] border-[#f5b342]' : 'bg-[#2c2121] border-[#6a5340] hover:border-[#8a6a4f]'}`}
                        >
                            {m.emoji}
                        </button>
                    ))}
                </div>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={3}
                    placeholder="How did this day go? Triggers, wins, thoughts..."
                    className="w-full p-2 bg-[#2c2121] border-2 border-[#8a6a4f] focus:outline-none focus:border-[#f5b342] text-sm placeholder:text-[#6a5340]"
                />
                <div className="flex justify-end items-center gap-3 mt-2">
                    {saved && <span className="text-xs text-green-400">Saved!</span>}
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
