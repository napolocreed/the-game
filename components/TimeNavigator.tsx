import React from 'react';
import { format, isToday, isYesterday } from 'date-fns';

interface TimeNavigatorProps {
  viewingDate: Date;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

const ArrowButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...props }) => (
  <button
    className="px-3 py-2 bg-[#6a5340] border-2 border-[#8a6a4f] hover:bg-[#8a6a4f] transition-colors disabled:bg-gray-700 disabled:text-gray-500 disabled:border-gray-800 disabled:cursor-not-allowed"
    {...props}
  >
    {children}
  </button>
);

const TimeNavigator: React.FC<TimeNavigatorProps> = ({ viewingDate, onPrevious, onNext, onToday }) => {
  const isViewingToday = isToday(viewingDate);

  const displayDate = () => {
    if (isViewingToday) return "Today";
    if (isYesterday(viewingDate)) return "Yesterday";
    return format(viewingDate, 'MMMM d, yyyy');
  };

  return (
    <div className="mt-8 bg-[#4a3f36] border-4 border-[#8a6a4f] shadow-[8px_8px_0px_#1a1515] p-3 flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <ArrowButton onClick={onPrevious} aria-label="Previous Day">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </ArrowButton>
        <ArrowButton onClick={onNext} disabled={isViewingToday} aria-label="Next Day">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </ArrowButton>
      </div>
      <div className="text-center flex-grow">
        <h3 className="text-xl text-white">{displayDate()}</h3>
      </div>
      <div className="flex items-center gap-2">
        {!isViewingToday && (
          <button onClick={onToday} className="px-3 py-2 text-sm bg-[#6a5340] border-2 border-[#8a6a4f] hover:bg-[#8a6a4f] transition-colors">
            Today
          </button>
        )}
      </div>
    </div>
  );
};

export default TimeNavigator;
