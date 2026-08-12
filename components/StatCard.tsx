import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  /** Optional pixel icon rendered above the value. */
  icon?: React.ReactNode;
  /** Optional accent color for the value (defaults to white). */
  accent?: string;
  /** Optional context line under the label, e.g. a date or comparison. */
  sub?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, accent, sub }) => {
  return (
    <div className="bg-[#4a3f36] border-4 border-[#8a6a4f] p-4 shadow-[8px_8px_0px_#1a1515] text-center">
      {icon && <div className="flex justify-center mb-2 text-[#f5b342]">{icon}</div>}
      <p className={`text-3xl md:text-4xl font-bold ${accent || 'text-white'}`}>{value}</p>
      <p className="text-sm text-[#b0a08f] mt-1">{label}</p>
      {sub && <p className="text-[10px] text-[#8a7a68] mt-1">{sub}</p>}
    </div>
  );
};

export default StatCard;
