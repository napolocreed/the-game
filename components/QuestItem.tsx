import React from 'react';
import { Quest, QuestType } from '../types';
import ProgressBar from './ProgressBar';
import { QuestIcon } from './icons/QuestIcon';

interface QuestItemProps {
  quest: Quest;
}

const QuestItem: React.FC<QuestItemProps> = ({ quest }) => {
  const isCompleted = quest.isCompleted;

  let progressLabel = '';
  if (quest.type === QuestType.COUNT) {
    progressLabel = `${quest.progress} / ${quest.objective.target}`;
  } else if (quest.type === QuestType.STREAK) {
    progressLabel = `${quest.progress} / ${quest.objective.target} Day Streak`;
  }

  return (
    <div className={`p-4 bg-[#4a3f36] border-4 border-[#8a6a4f] shadow-[8px_8px_0px_#1a1515] transition-opacity ${isCompleted ? 'opacity-60' : 'opacity-100'}`}>
      <div className="flex items-start gap-4">
        <div className={`mt-1 flex-shrink-0 ${isCompleted ? 'text-green-400' : 'text-yellow-400'}`}>
          <QuestIcon className="w-8 h-8" />
        </div>
        <div className="flex-grow">
          <div className="flex justify-between items-baseline">
            <h3 className={`text-lg ${isCompleted ? 'line-through text-gray-400' : 'text-white'}`}>{quest.title}</h3>
            <span className="font-bold text-purple-300 whitespace-nowrap">+{quest.xpReward} XP</span>
          </div>
          <p className="text-sm text-[#b0a08f] mt-1">{quest.description}</p>
          {!isCompleted && (
            <div className="mt-3">
              <ProgressBar
                value={quest.progress}
                max={quest.objective.target}
                label={progressLabel}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestItem;