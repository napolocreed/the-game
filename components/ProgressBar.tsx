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
      <div className="w-full h-8 bg-inset border-4 border-frame p-1 shadow-hard-sm">
        <div 
          className="h-full bg-gradient-to-r from-accent to-title transition-all duration-500 ease-out" 
          style={{ width: `${percentage}%` }}
        />
      </div>
      {label && <p className="text-center text-sm mt-1 tracking-wider">{label}</p>}
    </div>
  );
};

export default ProgressBar;
