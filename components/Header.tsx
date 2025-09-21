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
    <header className="border-4 border-[#8a6a4f] p-4 bg-[#4a3f36] shadow-[8px_8px_0px_#1a1515]">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-4xl text-[#ff9a00] tracking-wider shrink-0">
          The Game
        </h1>
        
        <div className="flex-grow flex items-center justify-end gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 flex-grow">
                <div className="relative shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2c2121] border-2 sm:border-4 border-[#8a6a4f] flex items-center justify-center">
                    <span className="text-xl sm:text-2xl text-yellow-400 font-bold">{profile.level}</span>
                    </div>
                    <LevelUpIcon className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 transform rotate-12" />
                </div>
                <div className="w-full hidden sm:block">
                    <ProgressBar 
                        value={profile.currentXP} 
                        max={profile.xpToNextLevel} 
                        label={`${profile.currentXP}/${profile.xpToNextLevel} XP`}
                    />
                </div>
            </div>
          
            <button onClick={onSettingsClick} className="p-2 bg-[#6a5340] border-2 border-[#8a6a4f] hover:bg-[#8a6a4f] transition-colors shrink-0">
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