import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Completion, CompletionStatus } from '../types';
import { format } from 'date-fns';

interface CompletionHeatmapProps {
  completions: Completion[];
}

// Geometry has to match the classes below (w-3 = 12px, gap-1 = 4px).
const CELL = 12;
const GAP = 4;
const LABEL_W = 32;
const MIN_WEEKS = 8;
const MAX_WEEKS = 53;

// This used to render a fixed 53 columns inside a scroll box. On a phone that
// meant the *oldest* — and therefore empty — months were the only thing on
// screen, and your actual history sat off-canvas behind a nested scrollbar.
// Now it renders as many weeks as genuinely fit, always ending on today.
const CompletionHeatmap: React.FC<CompletionHeatmapProps> = ({ completions }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [weeks, setWeeks] = useState(MIN_WEEKS);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const available = el.clientWidth - LABEL_W - GAP;
      const fits = Math.floor((available + GAP) / (CELL + GAP));
      setWeeks(Math.max(MIN_WEEKS, Math.min(MAX_WEEKS, fits)));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { days, firstDay } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Back up to the Sunday that opens the current week, then back `weeks - 1`
    // more weeks, so every column is a whole Sun→Sat week.
    const start = new Date(today);
    start.setDate(start.getDate() - today.getDay() - (weeks - 1) * 7);
    const list: Date[] = [];
    for (const d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      list.push(new Date(d));
    }
    return { days: list, firstDay: start };
  }, [weeks]);

  const completionsByDate = useMemo(
    () =>
      completions.reduce((acc, comp) => {
        if (comp.status !== CompletionStatus.COMPLETED) return acc; // failed/skipped logs aren't wins
        const dateKey = format(new Date(comp.date), 'yyyy-MM-dd');
        acc[dateKey] = (acc[dateKey] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    [completions],
  );

  const getCellColor = (count: number) => {
    if (count === 0) return 'bg-[#2c2121]';
    if (count <= 1) return 'bg-yellow-700';
    if (count <= 3) return 'bg-yellow-500';
    return 'bg-yellow-300';
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div ref={containerRef} className="bg-[#4a3f36] border-4 border-[#8a6a4f] p-4 shadow-[8px_8px_0px_#1a1515]">
      <p className="text-[10px] text-[#b0a08f] mb-2">
        {format(firstDay, 'MMM d')} - today · {weeks} weeks
      </p>
      <div className="flex gap-1">
        <div className="flex flex-col shrink-0 text-xs text-[#b0a08f]" style={{ width: LABEL_W }}>
          {dayLabels.map((day, i) => (
            <div
              key={day}
              className="flex items-center"
              style={{ height: CELL, marginBottom: i === dayLabels.length - 1 ? 0 : GAP }}
            >
              {i % 2 !== 0 ? day : ''}
            </div>
          ))}
        </div>
        <div className="grid grid-flow-col grid-rows-7 gap-1">
          {days.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const count = completionsByDate[dateKey] || 0;
            return (
              <div
                key={dateKey}
                className={`w-3 h-3 ${getCellColor(count)}`}
                title={`${count} completed on ${format(day, 'MMM d, yyyy')}`}
              />
            );
          })}
        </div>
      </div>
      <div className="flex justify-end items-center gap-2 mt-2 text-xs text-[#b0a08f]">
        <span>Less</span>
        <div className="w-3 h-3 bg-[#2c2121]" />
        <div className="w-3 h-3 bg-yellow-700" />
        <div className="w-3 h-3 bg-yellow-500" />
        <div className="w-3 h-3 bg-yellow-300" />
        <span>More</span>
      </div>
    </div>
  );
};

export default CompletionHeatmap;
