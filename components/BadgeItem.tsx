import React from 'react';
import { Badge, PlayerProfile, Habit, Completion, Quit, Task } from '../types';
import { QuestionMarkIcon } from './icons/QuestionMarkIcon';
import ProgressBar from './ProgressBar';
import { CheckIcon } from './icons/CheckIcon';

interface BadgeItemProps {
  badge: Badge;
  unlockedTierNum: number;
  profile: PlayerProfile;
  habits: Habit[];
  completions: Completion[];
  quits?: Quit[];
  tasks?: Task[];
}

const BadgeItem: React.FC<BadgeItemProps> = ({ badge, unlockedTierNum, profile, habits, completions, quits = [], tasks = [] }) => {
  const Icon = badge.icon;

  const currentTier = badge.tiers.find(t => t.tier === unlockedTierNum);
  const nextTier = badge.tiers.find(t => t.tier === unlockedTierNum + 1);

  const isUnlocked = unlockedTierNum > 0;
  const isMaxed = !nextTier;

  const progress = badge.getProgress({ profile, habits, completions, quits, tasks });

  const displayName = currentTier ? currentTier.name : badge.baseName;
  const displayDescription = currentTier ? currentTier.description : badge.tiers[0].description;
  
  return (
    <div className={`flex flex-col p-4 bg-surface border-4 border-frame shadow-hard ${!isUnlocked ? 'opacity-70' : ''}`}>
      <div className="flex items-start gap-4 flex-grow">
        <div className="flex-shrink-0">
          {isUnlocked ? (
            <Icon className="w-16 h-16 text-accent" />
          ) : (
            <div className="w-16 h-16 bg-inset border-2 border-frame-dim flex items-center justify-center">
              <QuestionMarkIcon className="w-10 h-10 text-ink-faint" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className={`text-lg ${isUnlocked ? 'text-ink-hi' : 'text-ink-dim'}`}>
              {isUnlocked ? displayName : 'Locked Achievement'}
          </h3>
          <p className="text-sm mt-1 text-ink-dim">
              {displayDescription}
          </p>
        </div>
      </div>
       
       <div className="mt-4 pt-2 flex-grow flex flex-col justify-end">
        {isMaxed && isUnlocked ? (
          <div className="flex items-center justify-center gap-2 text-good-soft">
            <CheckIcon className="w-6 h-6" />
            <span className="font-bold">Completed!</span>
          </div>
        ) : nextTier ? (
            <div>
              <p className="text-xs text-warn mb-1">Next: {nextTier.name}</p>
              <ProgressBar 
                value={progress}
                max={nextTier.target}
                label={`${Math.min(progress, nextTier.target).toLocaleString()} / ${nextTier.target.toLocaleString()}`}
              />
            </div>
          ) : (
             // Case for a locked badge with only one tier
            <div>
               <p className="text-xs text-warn mb-1">Progress</p>
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