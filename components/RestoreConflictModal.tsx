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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg bg-[#4a3f36] border-4 border-[#8a6a4f] shadow-[8px_8px_0px_#1a1515] p-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl text-[#f5b342]">Restore Habit Conflict</h2>
            <button onClick={onClose} className="text-3xl text-[#f0e9d6] hover:text-red-500 leading-none">&times;</button>
        </div>

        <div className="text-white my-6 space-y-2">
            <p>You are restoring an archived habit: <span className="font-bold text-yellow-300">"{originalHabitName}"</span>.</p>
            <p>However, an active copy named <span className="font-bold text-yellow-300">"{duplicateHabitName}"</span> already exists.</p>
            <p className="mt-4">How would you like to proceed?</p>
        </div>

        <div className="space-y-4">
            <div className="bg-[#2c2121] border-2 border-[#8a6a4f] p-4">
                <h3 className="text-lg text-white">Restore and Replace</h3>
                <p className="text-sm text-[#b0a08f] my-2">The original habit and its history will be restored. The active copy and its progress will be <span className="font-bold text-red-400">permanently deleted</span>.</p>
                <PixelatedButton onClick={onReplace} className="bg-red-800 hover:bg-red-700 border-red-900 shadow-[4px_4px_0px_#450a0a]">
                    Replace Copy
                </PixelatedButton>
            </div>
            
            <div className="bg-[#2c2121] border-2 border-[#8a6a4f] p-4">
                <h3 className="text-lg text-white">Restore and Keep Both</h3>
                <p className="text-sm text-[#b0a08f] my-2">The original habit will be restored. You will have two separate versions of this habit in your list.</p>
                <PixelatedButton onClick={onKeepBoth} className="bg-blue-800 hover:bg-blue-700 border-blue-900 shadow-[4px_4px_0px_#1e3a8a]">
                    Keep Both Habits
                </PixelatedButton>
            </div>
        </div>

        <div className="mt-8 flex justify-end">
            <PixelatedButton onClick={onClose} className="bg-gray-600 border-gray-700 shadow-[4px_4px_0px_#222] hover:bg-gray-500">
                Cancel
            </PixelatedButton>
        </div>

      </div>
    </div>
  );
};

export default RestoreConflictModal;
