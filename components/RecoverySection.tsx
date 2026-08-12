import React from 'react';
import { Quit, DayNote, Habit, Completion } from '../types';
import { formatISO, format } from 'date-fns';
import StatCard from './StatCard';
import { topTriggers, riskiestWeekday, recoveryTotals } from '../utils/quits';
import { battleRecord, moodVsActivity } from '../utils/analytics';
import { ShieldIcon } from './icons/ShieldIcon';
import { HeartIcon } from './icons/HeartIcon';

interface RecoverySectionProps {
  quits: Quit[];
  dayNotes: { [dateKey: string]: DayNote };
  habits: Habit[];
  completions: Completion[];
}

// A five-point DIVERGING scale, not five categories: two hues meeting at a
// neutral middle. The previous red-orange-yellow-lime-green rainbow implied
// five unrelated things rather than one ordered axis.
const MOOD_COLORS: { [mood: number]: string } = {
  1: 'bg-mood-worst',
  2: 'bg-mood-bad',
  3: 'bg-mood-mid',
  4: 'bg-mood-good',
  5: 'bg-mood-best',
};

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Mood over the last 30 days, with relapse days marked underneath — the point
// is to make "how I felt" and "when I slipped" visible side by side.
const MoodTrendChart: React.FC<{ dayNotes: { [dateKey: string]: DayNote }; relapseDayKeys: Set<string> }> = ({ dayNotes, relapseDayKeys }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 30 }).map((_, i) => {
    const day = new Date(today);
    day.setDate(day.getDate() - (29 - i));
    return day;
  });

  const hasMoodData = days.some(day => dayNotes[formatISO(day, { representation: 'date' })]?.mood);
  if (!hasMoodData) {
    return (
      <p className="text-sm text-ink-dim text-center p-4">
        Log a mood in Calendar to see this.
      </p>
    );
  }

  return (
    <div>
      {/* Single row of columns; the relapse marker is a small red block inside
          each column (an emoji row here forced ~12px per column and overflowed
          phone screens). */}
      <div className="h-24 flex items-end gap-[2px]">
        {days.map(day => {
          const key = formatISO(day, { representation: 'date' });
          const mood = dayNotes[key]?.mood;
          const hadRelapse = relapseDayKeys.has(key);
          return (
            <div
              key={key}
              className="flex-1 min-w-0 h-full flex flex-col justify-end"
              title={`${format(day, 'MMM d')}${mood ? ` — mood ${mood}/5` : ''}${hadRelapse ? ' — relapse' : ''}`}
            >
              {mood
                ? <div className={`w-full ${MOOD_COLORS[mood]}`} style={{ height: `${(mood / 5) * 100}%` }} />
                : <div className="w-full h-[2px] bg-raised" />}
              <div className={`w-full h-1.5 mt-[2px] ${hadRelapse ? 'bg-danger-hi' : 'bg-transparent'}`} />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-ink-dim mt-1">
        <span>{format(days[0], 'MMM d')}</span>
        <span className="flex items-center gap-1 text-danger-hi">
          <span className="inline-block w-2 h-2 bg-danger-hi" /> relapse
        </span>
        <span>Today</span>
      </div>
    </div>
  );
};

const RecoverySection: React.FC<RecoverySectionProps> = ({ quits, dayNotes, habits, completions }) => {
  const totals = recoveryTotals(quits);
  const triggers = topTriggers(quits, 3);
  const riskyDay = riskiestWeekday(quits);
  const record = battleRecord(quits);
  const moodLink = moodVsActivity(dayNotes, habits, completions);

  const relapseDayKeys = new Set(
    quits.flatMap(q => q.relapses.map(r => formatISO(new Date(r.date), { representation: 'date' })))
  );

  return (
    <div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Clean Days" value={`${totals.cleanDays}`} />
        <StatCard label="Urges Resisted" value={`${totals.urgesResisted}`} />
        <StatCard label="Money Saved" value={`${Math.round(totals.moneySaved).toLocaleString()}€`} />
      </div>

      {record && (
        <div className="bg-surface border-4 border-frame p-4 shadow-hard mb-6">
          <div className="flex items-center gap-2 mb-3">
            <ShieldIcon className="w-5 h-5 text-accent shrink-0" />
            <h4 className="text-lg text-ink-hi">Battle Record</h4>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-3xl font-bold text-accent shrink-0">{Math.round(record.winRate * 100)}%</p>
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-inset border-2 border-shadowc flex">
                <div className="bg-good-soft h-full" style={{ width: `${record.winRate * 100}%` }} />
              </div>
              <p className="text-[10px] text-ink-dim mt-1">
                {/* The old tail read "most battles, you win" unconditionally,
                    which becomes a lie below a 50% rate. The number says it. */}
                {record.urgesResisted} urges beaten · {record.relapses} slip{record.relapses === 1 ? '' : 's'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-surface border-4 border-frame p-4 shadow-hard mb-6">
        <h4 className="text-lg text-ink-hi mb-3">Mood — Last 30 Days</h4>
        <MoodTrendChart dayNotes={dayNotes} relapseDayKeys={relapseDayKeys} />
      </div>

      {moodLink && (
        <div className="bg-surface border-4 border-frame p-4 shadow-hard mb-6">
          <div className="flex items-center gap-2 mb-1">
            <HeartIcon className="w-5 h-5 text-accent shrink-0" />
            <h4 className="text-lg text-ink-hi">Mood × Discipline</h4>
          </div>
          <p className="text-[10px] text-ink-dim mb-3">Avg mood by day type · 90 days</p>
          <div className="space-y-2">
            {[
              { label: `50%+ done (${moodLink.activeDays})`, value: moodLink.activeAvg },
              { label: `Quieter days (${moodLink.quietDays})`, value: moodLink.quietAvg },
            ].map(row => (
              <div key={row.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-ink">{row.label}</span>
                  <span className="text-warn">{row.value}/5</span>
                </div>
                <div className="w-full h-3 bg-inset border-2 border-shadowc">
                  <div className="h-full bg-accent" style={{ width: `${(row.value / 5) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          {moodLink.activeAvg > moodLink.quietAvg && (
            <p className="text-xs text-warn mt-3">
              Mood is higher on habit days.
            </p>
          )}
        </div>
      )}

      {(triggers.length > 0 || riskyDay !== null) && (
        <div className="bg-surface border-4 border-frame p-4 shadow-hard">
          <h4 className="text-lg text-ink-hi mb-3">Know Your Enemy</h4>
          {triggers.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-ink-dim uppercase mb-2">Top triggers</p>
              <div className="space-y-1">
                {triggers.map(t => (
                  <div key={t.trigger} className="flex justify-between text-sm">
                    <span className="text-ink">⚡ {t.trigger}</span>
                    <span className="text-warn">{t.count}×</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {riskyDay !== null && (
            <p className="text-sm text-warn">
              📅 Your riskiest day is <span className="font-bold">{WEEKDAY_NAMES[riskyDay]}</span> — plan something for it.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default RecoverySection;
