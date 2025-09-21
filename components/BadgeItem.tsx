import React from 'react';
import { Badge, PlayerProfile, Habit, Completion } from '../types';
import { QuestionMarkIcon } from './icons/QuestionMarkIcon';
import ProgressBar from './ProgressBar';
import { CheckIcon } from './icons/CheckIcon';

interface BadgeItemProps {
  badge: Badge;
  unlockedTierNum: number;
  profile: PlayerProfile;
  habits: Habit[];
  completions: Completion[];
}

const BadgeItem: React.FC<BadgeItemProps> = ({ badge, unlockedTierNum, profile, habits, completions }) => {
  const Icon = badge.icon;
  
  const currentTier = badge.tiers.find(t => t.tier === unlockedTierNum);
  const nextTier = badge.tiers.find(t => t.tier === unlockedTierNum + 1);
  
  const isUnlocked = unlockedTierNum > 0;
  const isMaxed = !nextTier;

  const progress = badge.getProgress(profile, habits, completions);

  const displayName = currentTier ? currentTier.name : badge.baseName;
  const displayDescription = currentTier ? currentTier.description : badge.tiers[0].description;
  
  return (
    <div className={`flex flex-col p-4 bg-[#4a3f36] border-4 border-[#8a6a4f] shadow-[8px_8px_0px_#1a1515] ${!isUnlocked ? 'opacity-70' : ''}`}>
      <div className="flex items-start gap-4 flex-grow">
        <div className="flex-shrink-0">
          {isUnlocked ? (
            <Icon className="w-16 h-16 text-yellow-400" />
          ) : (
            <div className="w-16 h-16 bg-[#2c2121] border-2 border-[#6a5340] flex items-center justify-center">
              <QuestionMarkIcon className="w-10 h-10 text-[#6a5340]" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className={`text-lg ${isUnlocked ? 'text-white' : 'text-[#b0a08f]'}`}>
              {isUnlocked ? displayName : 'Locked Achievement'}
          </h3>
          <p className="text-sm mt-1 text-[#b0a08f]">
              {displayDescription}
          </p>
        </div>
      </div>
       
       <div className="mt-4 pt-2 flex-grow flex flex-col justify-end">
        {isMaxed && isUnlocked ? (
          <div className="flex items-center justify-center gap-2 text-green-400">
            <CheckIcon className="w-6 h-6" />
            <span className="font-bold">Completed!</span>
          </div>
        ) : nextTier ? (
            <div>
              <p className="text-xs text-yellow-300 mb-1">Next: {nextTier.name}</p>
              <ProgressBar 
                value={progress}
                max={nextTier.target}
                label={`${Math.min(progress, nextTier.target).toLocaleString()} / ${nextTier.target.toLocaleString()}`}
              />
            </div>
          ) : (
             // Case for a locked badge with only one tier
            <div>
               <p className="text-xs text-yellow-300 mb-1">Progress</p>
               <ProgressBar
                 value={progress}
                 max={badge.tiers[0].target}
                 label={`${Math.min(progress, badge.tiers[0].target).toLocaleString()} / ${badge.tiers[0].target.toLocaleString()}`}
               />
            </div>
          )
        }
       </div>
    </div>
  );
};

export default BadgeItem;