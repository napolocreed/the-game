
import React from 'react';
import { PlayerProfile } from '../types';
import ProgressBar from './ProgressBar';
import { LevelUpIcon } from './icons/LevelUpIcon';
import { BadgeIcon } from './icons/BadgeIcon';

interface ProfileHeaderProps {
  profile: PlayerProfile;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile }) => {
  return (
    <div className="bg-[#4a3f36] border-4 border-[#8a6a4f] p-4 shadow-[8px_8px_0px_#1a1515] mb-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 bg-[#2c2121] border-4 border-[#8a6a4f] flex items-center justify-center">
              <span className="text-3xl text-yellow-400 font-bold">{profile.level}</span>
            </div>
             <LevelUpIcon className="absolute -top-3 -right-3 w-8 h-8 text-yellow-400 transform rotate-12" />
          </div>
          <div>
            <h2 className="text-xl text-white">Player Level</h2>
            <p className="text-sm text-[#b0a08f]">Total XP: {profile.totalXP.toLocaleString()}</p>
          </div>
           <div className="flex items-center gap-2 text-cyan-300 ml-4">
              <BadgeIcon className="w-8 h-8"/>
              <span className="text-2xl font-bold">{profile.unlockedBadges.length}</span>
            </div>
        </div>
        <div className="w-full sm:w-1/2 mt-4 sm:mt-0">
          <ProgressBar 
            value={profile.currentXP} 
            max={profile.xpToNextLevel} 
            label={`${profile.currentXP.toLocaleString()} / ${profile.xpToNextLevel.toLocaleString()} XP`}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;