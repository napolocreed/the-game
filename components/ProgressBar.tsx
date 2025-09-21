import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, max, label }) => {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div className="w-full">
      <div className="w-full h-8 bg-[#2c2121] border-4 border-[#8a6a4f] p-1 shadow-[4px_4px_0px_#1a1515]">
        <div 
          className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500 ease-out" 
          style={{ width: `${percentage}%` }}
        />
      </div>
      {label && <p className="text-center text-sm mt-1 tracking-wider">{label}</p>}
    </div>
  );
};

export default ProgressBar;
