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
    <div className="bg-surface border-4 border-frame p-4 shadow-hard text-center">
      {icon && <div className="flex justify-center mb-2 text-accent">{icon}</div>}
      <p className={`text-3xl md:text-4xl font-bold ${accent || 'text-ink-hi'}`}>{value}</p>
      <p className="text-sm text-ink-dim mt-1">{label}</p>
      {sub && <p className="text-[10px] text-ink-faint mt-1">{sub}</p>}
    </div>
  );
};

export default StatCard;
