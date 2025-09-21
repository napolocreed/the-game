import React from 'react';
import { Quest, Habit } from '../types';
import QuestItem from './QuestItem';
import ProgressBar from './ProgressBar';

interface QuestBoardProps {
  quests: Quest[];
  habits: Habit[];
}

const QuestBoard: React.FC<QuestBoardProps> = ({ quests, habits }) => {
  const allQuestsCompleted = quests.length > 0 && quests.every(q => q.isCompleted);
  const QUEST_UNLOCK_TIERS = [3, 5, 7]; // More meaningful tiers

  const renderContent = () => {
    if (habits.length === 0) {
      return (
        <div className="text-center border-4 border-dashed border-[#6a5340] p-10 bg-[#4a3f36] shadow-[8px_8px_0px_#1a1515]">
          <p className="text-xl text-[#f0e9d6]">Your Quest Log is Empty</p>
          <p className="mt-2 text-[#b0a08f]">Create your first habit to start receiving daily quests!</p>
        </div>
      );
    }

    if (quests.length > 0) {
      return (
        <>
          {quests.map(quest => <QuestItem key={quest.id} quest={quest} />)}
          {allQuestsCompleted && (
            <div className="mt-6 text-center border-4 border-dashed border-green-700 p-6 bg-green-900 bg-opacity-30 shadow-[8px_8px_0px_#1a1515]">
                <p className="text-xl text-green-300">All quests complete for today!</p>
                <p className="mt-2 text-[#b0a08f]">Well done! Come back tomorrow for new challenges.</p>
            </div>
          )}
        </>
      );
    }
    
    // At this point, habits.length > 0 and quests.length === 0
    const nextQuestTier = QUEST_UNLOCK_TIERS.find(tier => tier > habits.length);
    if (nextQuestTier) {
        return (
            <div className="text-center border-4 border-dashed border-[#6a5340] p-10 bg-[#4a3f36] shadow-[8px_8px_0px_#1a1515]">
                <p className="text-xl text-[#f0e9d6]">Unlock More Powerful Quests</p>
                <p className="mt-2 mb-6 text-[#b0a08f]">Your journey is just beginning! Add more habits to unlock new challenges and earn greater rewards.</p>
                <div className="w-full max-w-sm mx-auto">
                    <ProgressBar 
                        value={habits.length} 
                        max={nextQuestTier} 
                        label={`Habits for next tier: ${habits.length} / ${nextQuestTier}`} 
                    />
                </div>
            </div>
        );
    }

    return (
      <div className="text-center border-4 border-dashed border-[#6a5340] p-10 bg-[#4a3f36] shadow-[8px_8px_0px_#1a1515]">
        <p className="text-lg text-[#b0a08f]">No new quests available right now. Check back tomorrow for new adventures!</p>
      </div>
    );
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl md:text-3xl text-[#f5b342] mb-4">Today's Quests</h2>
      <div className="space-y-4">
        {renderContent()}
      </div>
    </div>
  );
};

export default QuestBoard;