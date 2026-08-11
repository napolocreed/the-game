import React from 'react';
import { HomeIcon } from './icons/HomeIcon';
import { QuestIcon } from './icons/QuestIcon';
import { ChartIcon } from './icons/ChartIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { SwordIcon } from './icons/SwordIcon';

type ActiveTab = 'habits' | 'quests' | 'battles' | 'progress' | 'calendar';

interface TabsProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

// Five tabs and a wide pixel font don't fit on a phone. On mobile the tabs
// are icon-first: only the active tab shows its (short) label. Desktop keeps
// full labels. The container clips overflow so a stray pixel can never spawn
// a horizontal page scrollbar.
const TabButton: React.FC<{
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, shortLabel, icon, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`
        flex-1 min-w-0 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-0.5 py-2 sm:p-2 text-base
        transition-colors duration-200
        ${isActive ? 'bg-[#8a6a4f] text-white' : 'bg-[#4a3f36] text-[#b0a08f] hover:bg-[#6a5340]'}
      `}
    >
      {icon}
      <span className={`${isActive ? 'block' : 'hidden'} sm:hidden text-[8px] leading-tight max-w-full truncate`}>{shortLabel}</span>
      <span className="hidden sm:block">{label}</span>
    </button>
  );
};

const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex overflow-hidden border-4 border-[#8a6a4f] shadow-[8px_8px_0px_#1a1515] mt-8">
      <TabButton
        label="Habits"
        shortLabel="Habits"
        icon={<HomeIcon className="w-6 h-6 sm:w-5 sm:h-5 shrink-0" />}
        isActive={activeTab === 'habits'}
        onClick={() => setActiveTab('habits')}
      />
      <div className="w-px sm:w-1 bg-[#8a6a4f] shrink-0" />
      <TabButton
        label="Quests"
        shortLabel="Quests"
        icon={<QuestIcon className="w-6 h-6 sm:w-5 sm:h-5 shrink-0" />}
        isActive={activeTab === 'quests'}
        onClick={() => setActiveTab('quests')}
      />
      <div className="w-px sm:w-1 bg-[#8a6a4f] shrink-0" />
      <TabButton
        label="Battles"
        shortLabel="Battles"
        icon={<SwordIcon className="w-6 h-6 sm:w-5 sm:h-5 shrink-0" />}
        isActive={activeTab === 'battles'}
        onClick={() => setActiveTab('battles')}
      />
      <div className="w-px sm:w-1 bg-[#8a6a4f] shrink-0" />
      <TabButton
        label="Calendar"
        shortLabel="Cal."
        icon={<CalendarIcon className="w-6 h-6 sm:w-5 sm:h-5 shrink-0" />}
        isActive={activeTab === 'calendar'}
        onClick={() => setActiveTab('calendar')}
      />
      <div className="w-px sm:w-1 bg-[#8a6a4f] shrink-0" />
      <TabButton
        label="Progress"
        shortLabel="Stats"
        icon={<ChartIcon className="w-6 h-6 sm:w-5 sm:h-5 shrink-0" />}
        isActive={activeTab === 'progress'}
        onClick={() => setActiveTab('progress')}
      />
    </div>
  );
};

export default Tabs;
