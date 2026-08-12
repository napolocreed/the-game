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
    <div className="fixed inset-0 bg-scrim flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-inset border-4 border-accent shadow-[8px_8px_0px_var(--frame)] p-6 text-center max-h-[90vh] overflow-y-auto">
        <h2 className="text-3xl text-accent mb-4">Achievement Unlocked!</h2>
        <div className="space-y-6 my-6">
          {badges.map(({ badge, tier }) => (
            <div key={badge.id + tier.tier} className="flex flex-col items-center gap-4">
              <div className="text-warn">
                <badge.icon className="w-20 h-20" />
              </div>
              <div>
                <h3 className="text-2xl text-ink-hi">{tier.name}</h3>
                <p className="text-md text-ink-dim mt-2">{tier.description}</p>
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