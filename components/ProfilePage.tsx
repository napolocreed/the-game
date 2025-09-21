import React from 'react';
// Fix: Import Habit and Completion types to satisfy BadgeItemProps.
import { PlayerProfile, Habit, Completion } from '../types';
import { BADGE_CATALOG } from '../utils/badges';
import BadgeItem from './BadgeItem';

interface ProfilePageProps {
  profile: PlayerProfile;
  // Fix: Add habits and completions to props to be passed down.
  habits: Habit[];
  completions: Completion[];
}

const ProfilePage: React.FC<ProfilePageProps> = ({ profile, habits, completions }) => {
  return (
    <div>
      <h2 className="text-2xl md:text-3xl text-[#f5b342] mb-6">Achievements</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {BADGE_CATALOG.map(badge => (
          <BadgeItem 
            key={badge.id} 
            badge={badge} 
            unlockedTierNum={profile.unlockedBadges[badge.id] || 0}
            profile={profile}
            habits={habits}
            completions={completions}
          />
        ))}
      </div>
    </div>
  );
};

export default ProfilePage;