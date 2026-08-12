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
      <h2 className="text-2xl md:text-3xl text-accent mb-4">Boss Fights</h2>

      {/* The premise only needs explaining while there is nothing to look at.
          Once a fight exists the cards are the screen. */}
      {activeQuits.length === 0 && pausedQuits.length === 0 && (
        <div className="text-center border-4 border-dashed border-frame-dim p-8 bg-surface shadow-hard">
          <p className="text-xl text-ink">No boss yet.</p>
          <p className="mt-2 text-ink-dim">Every clean day is a hit.</p>
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
          <h3 className="text-lg text-ink-dim mb-2">Paused fights</h3>
          <div className="space-y-2">
            {pausedQuits.map(quit => (
              <div key={quit.id} className="flex justify-between items-center bg-surface border-2 border-frame-dim p-3">
                <p className="text-ink-hi">{quit.name}</p>
                <div className="flex gap-2">
                  <button onClick={() => onArchive(quit.id)} title="Resume the fight" className="p-1 hover:bg-raised">
                    <RestoreIcon className="w-5 h-5 text-good-soft" />
                  </button>
                  <button onClick={() => onDelete(quit)} title="Delete permanently" className="p-1 hover:bg-raised">
                    <TrashIcon className="w-5 h-5 text-danger-hi" />
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
