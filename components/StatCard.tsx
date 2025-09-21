import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value }) => {
  return (
    <div className="bg-[#4a3f36] border-4 border-[#8a6a4f] p-4 shadow-[8px_8px_0px_#1a1515] text-center">
      <p className="text-3xl md:text-4xl font-bold text-white">{value}</p>
      <p className="text-sm text-[#b0a08f] mt-1">{label}</p>
    </div>
  );
};

export default StatCard;
