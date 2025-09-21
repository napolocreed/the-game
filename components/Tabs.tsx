import React from 'react';
import { HomeIcon } from './icons/HomeIcon';
import { QuestIcon } from './icons/QuestIcon';
import { ChartIcon } from './icons/ChartIcon';
import { CalendarIcon } from './icons/CalendarIcon';

type ActiveTab = 'habits' | 'quests' | 'progress' | 'calendar';

interface TabsProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

const TabButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-2 text-xs sm:text-base
        transition-colors duration-200
        ${isActive ? 'bg-[#8a6a4f] text-white' : 'bg-[#4a3f36] text-[#b0a08f] hover:bg-[#6a5340]'}
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex border-4 border-[#8a6a4f] shadow-[8px_8px_0px_#1a1515] mt-8">
      <TabButton
        label="Habits"
        icon={<HomeIcon className="w-6 h-6 sm:w-5 sm:h-5" />}
        isActive={activeTab === 'habits'}
        onClick={() => setActiveTab('habits')}
      />
      <div className="w-1 bg-[#8a6a4f]" />
      <TabButton
        label="Quests"
        icon={<QuestIcon className="w-6 h-6 sm:w-5 sm:h-5" />}
        isActive={activeTab === 'quests'}
        onClick={() => setActiveTab('quests')}
      />
      <div className="w-1 bg-[#8a6a4f]" />
      <TabButton
        label="Calendar"
        icon={<CalendarIcon className="w-6 h-6 sm:w-5 sm:h-5" />}
        isActive={activeTab === 'calendar'}
        onClick={() => setActiveTab('calendar')}
      />
      <div className="w-1 bg-[#8a6a4f]" />
       <TabButton
        label="Progress"
        icon={<ChartIcon className="w-6 h-6 sm:w-5 sm:h-5" />}
        isActive={activeTab === 'progress'}
        onClick={() => setActiveTab('progress')}
      />
    </div>
  );
};

export default Tabs;