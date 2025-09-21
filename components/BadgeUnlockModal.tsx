import React from 'react';
import { Badge, BadgeTier } from '../types';
import PixelatedButton from './PixelatedButton';

interface BadgeUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  badges: { badge: Badge, tier: BadgeTier }[];
}

const BadgeUnlockModal: React.FC<BadgeUnlockModalProps> = ({ isOpen, onClose, badges }) => {
  if (!isOpen || badges.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-[#2c2121] border-4 border-[#f5b342] shadow-[8px_8px_0px_#8a6a4f] p-6 text-center">
        <h2 className="text-3xl text-yellow-400 mb-4">Achievement Unlocked!</h2>
        <div className="space-y-6 my-6">
          {badges.map(({ badge, tier }) => (
            <div key={badge.id + tier.tier} className="flex flex-col items-center gap-4">
              <div className="text-yellow-300">
                <badge.icon className="w-20 h-20" />
              </div>
              <div>
                <h3 className="text-2xl text-white">{tier.name}</h3>
                <p className="text-md text-[#b0a08f] mt-2">{tier.description}</p>
              </div>
            </div>
          ))}
        </div>
        <PixelatedButton onClick={onClose} className="mt-4">
          Continue
        </PixelatedButton>
      </div>
    </div>
  );
};

export default BadgeUnlockModal;