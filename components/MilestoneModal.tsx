import React from 'react';
import PixelatedButton from './PixelatedButton';

interface MilestoneModalProps {
  celebration: { quitName: string; days: number; label: string; xp: number } | null;
  onClose: () => void;
}

const MilestoneModal: React.FC<MilestoneModalProps> = ({ celebration, onClose }) => {
  if (!celebration) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-sm bg-[#4a3f36] border-4 border-[#f5b342] shadow-[8px_8px_0px_#1a1515] p-6 text-center">
        <p className="text-4xl mb-4">⚔️🏆</p>
        <h2 className="text-xl text-[#f5b342] mb-2">MILESTONE!</h2>
        <p className="text-2xl text-green-400 font-bold mb-2">{celebration.label} clean</p>
        <p className="text-sm text-[#f0e9d6] mb-4">
          You've dealt serious damage to <span className="text-[#f5b342]">{celebration.quitName}</span>.
        </p>
        <p className="text-2xl text-[#f5b342] mb-6">+{celebration.xp} XP</p>
        <PixelatedButton onClick={onClose} className="w-full">Keep fighting</PixelatedButton>
      </div>
    </div>
  );
};

export default MilestoneModal;
