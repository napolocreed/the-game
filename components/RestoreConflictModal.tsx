import React from 'react';
import PixelatedButton from './PixelatedButton';

interface RestoreConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReplace: () => void;
  onKeepBoth: () => void;
  originalHabitName: string;
  duplicateHabitName: string;
}

const RestoreConflictModal: React.FC<RestoreConflictModalProps> = ({
  isOpen,
  onClose,
  onReplace,
  onKeepBoth,
  originalHabitName,
  duplicateHabitName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-scrim flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg bg-surface border-4 border-frame shadow-hard p-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl text-accent">Restore Habit Conflict</h2>
            <button onClick={onClose} className="text-3xl text-ink hover:text-danger-hi leading-none">&times;</button>
        </div>

        <div className="text-ink-hi my-6 space-y-2">
            <p>You are restoring an archived habit: <span className="font-bold text-warn">"{originalHabitName}"</span>.</p>
            <p>However, an active copy named <span className="font-bold text-warn">"{duplicateHabitName}"</span> already exists.</p>
        </div>

        <div className="space-y-4">
            <div className="bg-inset border-2 border-frame p-4">
                <h3 className="text-lg text-ink-hi">Restore and Replace</h3>
                <p className="text-sm text-ink-dim my-2">The active copy and its progress are <span className="font-bold text-danger-hi">permanently deleted</span>.</p>
                <PixelatedButton onClick={onReplace} className="bg-danger hover:bg-danger-hi border-danger-edge shadow-danger">
                    Replace Copy
                </PixelatedButton>
            </div>
            
            <div className="bg-inset border-2 border-frame p-4">
                <h3 className="text-lg text-ink-hi">Restore and Keep Both</h3>
                <p className="text-sm text-ink-dim my-2">Both versions stay in your list.</p>
                <PixelatedButton onClick={onKeepBoth} className="bg-raised hover:bg-frame border-frame-dim shadow-hard-sm">
                    Keep Both Habits
                </PixelatedButton>
            </div>
        </div>

        <div className="mt-8 flex justify-end">
            <PixelatedButton onClick={onClose} className="bg-raised border-frame-dim shadow-hard-sm hover:bg-frame">
                Cancel
            </PixelatedButton>
        </div>

      </div>
    </div>
  );
};

export default RestoreConflictModal;
