import React from 'react';
import { Quit } from '../types';
import QuitCard from './QuitCard';
import PixelatedButton from './PixelatedButton';
import { PlusIcon } from './icons/PlusIcon';
import { RestoreIcon } from './icons/RestoreIcon';
import { TrashIcon } from './icons/TrashIcon';

interface QuitBoardProps {
  quits: Quit[];
  onAddQuit: () => void;
  onResistUrge: (quit: Quit) => void;
  onRelapse: (quit: Quit) => void;
  onArchive: (quitId: string) => void;
  onDelete: (quit: Quit) => void;
}

const QuitBoard: React.FC<QuitBoardProps> = ({ quits, onAddQuit, onResistUrge, onRelapse, onArchive, onDelete }) => {
  const activeQuits = quits.filter(q => !q.isArchived);
  const pausedQuits = quits.filter(q => q.isArchived);

  return (
    <div className="mb-8">
      <h2 className="text-2xl md:text-3xl text-[#f5b342] mb-2">Boss Fights</h2>
      <p className="text-sm text-[#b0a08f] mb-4">
        Each addiction is a boss. Every clean day is a hit. Slips happen — the fight isn't over until you win.
      </p>

      {activeQuits.length === 0 && pausedQuits.length === 0 && (
        <div className="text-center border-4 border-dashed border-[#6a5340] p-10 bg-[#4a3f36] shadow-[8px_8px_0px_#1a1515]">
          <p className="text-xl text-[#f0e9d6]">No boss on the battlefield yet.</p>
          <p className="mt-2 text-[#b0a08f]">Name the thing you want to quit and start dealing damage — one clean day at a time.</p>
        </div>
      )}

      <div className="space-y-6">
        {activeQuits.map(quit => (
          <QuitCard
            key={quit.id}
            quit={quit}
            onResistUrge={onResistUrge}
            onRelapse={onRelapse}
            onArchive={onArchive}
            onDelete={onDelete}
          />
        ))}
      </div>

      <div className="mt-6">
        <PixelatedButton onClick={onAddQuit} className="w-full">
          <PlusIcon className="w-5 h-5 mr-2" />
          Challenge a New Boss
        </PixelatedButton>
      </div>

      {pausedQuits.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg text-[#b0a08f] mb-2">Paused fights</h3>
          <div className="space-y-2">
            {pausedQuits.map(quit => (
              <div key={quit.id} className="flex justify-between items-center bg-[#4a3f36] border-2 border-[#6a5340] p-3">
                <p className="text-white">{quit.name}</p>
                <div className="flex gap-2">
                  <button onClick={() => onArchive(quit.id)} title="Resume the fight" className="p-1 hover:bg-[#6a5340]">
                    <RestoreIcon className="w-5 h-5 text-green-400" />
                  </button>
                  <button onClick={() => onDelete(quit)} title="Delete permanently" className="p-1 hover:bg-[#6a5340]">
                    <TrashIcon className="w-5 h-5 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuitBoard;
