import React from 'react';
import { PlayerProfile } from '../types';
import ProgressBar from './ProgressBar';
import { SettingsIcon } from './icons/SettingsIcon';
import { LevelUpIcon } from './icons/LevelUpIcon';

interface HeaderProps {
    profile: PlayerProfile;
    onSettingsClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ profile, onSettingsClick }) => {
  return (
    <header className="border-4 border-frame p-3 sm:p-4 bg-surface shadow-hard">
      <div className="flex justify-between items-center gap-2 sm:gap-4">
        {/* The title is allowed to shrink: at 2xl the pixel font makes "The
            Game" 190px wide, which alone pushed the settings button off a
            320px header. */}
        <h1 className="text-lg pm:text-2xl sm:text-4xl text-title tracking-wider min-w-0 truncate">
          The Game
        </h1>

        <div className="flex-grow min-w-0 flex items-center justify-end gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 flex-grow">
                <div className="relative shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-inset border-2 sm:border-4 border-frame flex items-center justify-center">
                    <span className="text-xl sm:text-2xl text-accent font-bold">{profile.level}</span>
                    </div>
                    <LevelUpIcon className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                </div>
                <div className="w-full hidden sm:block">
                    <ProgressBar 
                        value={profile.currentXP} 
                        max={profile.xpToNextLevel} 
                        label={`${profile.currentXP}/${profile.xpToNextLevel} XP`}
                    />
                </div>
            </div>
          
            <button onClick={onSettingsClick} className="p-2 bg-raised border-2 border-frame hover:bg-frame transition-colors shrink-0">
                <SettingsIcon className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
        </div>
      </div>
      <div className="w-full sm:hidden mt-3">
          <ProgressBar 
              value={profile.currentXP} 
              max={profile.xpToNextLevel} 
              label={`${profile.currentXP}/${profile.xpToNextLevel} XP`}
          />
      </div>
    </header>
  );
};

export default Header;