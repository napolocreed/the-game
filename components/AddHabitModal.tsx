
import React, { useState, useEffect } from 'react';
import { PRE_CONFIGURED_HABITS, SCHEDULED_HABIT_TEMPLATES } from '../constants';
import { HabitCategory, HabitType, PreConfiguredHabit, TemplateHabit, Habit } from '../types';
import PixelatedButton from './PixelatedButton';
import TimePicker from './TimePicker';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHabit: (newHabit: { 
    name: string; 
    category: HabitCategory; 
    type: HabitType; 
    reminderTime: string | null; 
    scheduleDays: number[];
    difficulty: string;
    xpReward: number;
  }, duplicatedFromId?: string) => void;
  habitToDuplicate: Habit | null;
}

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type DifficultyMode = 'easy' | 'medium' | 'hard' | 'custom';
const DIFFICULTY_PRESETS = {
  easy: { name: 'Easy', xp: 5 },
  medium: { name: 'Medium', xp: 10 },
  hard: { name: 'Hard', xp: 20 },
};

const AddHabitModal: React.FC<AddHabitModalProps> = ({ isOpen, onClose, onAddHabit, habitToDuplicate }) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom' | 'templates'>('presets');
  
  // Custom Habit State
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<HabitCategory>(HabitCategory.HEALTH);
  const [customType, setCustomType] = useState<HabitType>(HabitType.BUILD);
  const [customReminderTime, setCustomReminderTime] = useState('');
  const [scheduleDays, setScheduleDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  
  // Difficulty & Reward State
  const [difficultyMode, setDifficultyMode] = useState<DifficultyMode>('medium');
  const [customDifficultyName, setCustomDifficultyName] = useState('Custom');
  const [customXpReward, setCustomXpReward] = useState(15);


  useEffect(() => {
    if (habitToDuplicate) {
        setCustomName(`${habitToDuplicate.name} (Copy)`);
        setCustomCategory(habitToDuplicate.category);
        setCustomType(habitToDuplicate.type);
        setCustomReminderTime(habitToDuplicate.reminderTime || '');
        setScheduleDays(habitToDuplicate.scheduleDays);
        
        const presetMatch = Object.entries(DIFFICULTY_PRESETS).find(
            ([key, value]) => value.name === habitToDuplicate.difficulty && value.xp === habitToDuplicate.xpReward
        );

        if (presetMatch) {
            setDifficultyMode(presetMatch[0] as DifficultyMode);
        } else {
            setDifficultyMode('custom');
            setCustomDifficultyName(habitToDuplicate.difficulty);
            setCustomXpReward(habitToDuplicate.xpReward);
        }

        setActiveTab('custom');
    }
  }, [habitToDuplicate, isOpen]);

  if (!isOpen) return null;
  
  const resetForm = () => {
      setCustomName('');
      setCustomCategory(HabitCategory.HEALTH);
      setCustomType(HabitType.BUILD);
      setCustomReminderTime('');
      setScheduleDays([0, 1, 2, 3, 4, 5, 6]);
      setDifficultyMode('medium');
      setCustomDifficultyName('Custom');
      setCustomXpReward(15);
      setActiveTab('presets');
  }

  const handleClose = () => {
    resetForm();
    onClose();
  }

  const handleDayToggle = (dayIndex: number) => {
    setScheduleDays(prev => 
      prev.includes(dayIndex) 
      ? prev.filter(d => d !== dayIndex)
      : [...prev, dayIndex]
    );
  };

  const handleSelectPreset = (preset: PreConfiguredHabit) => {
    setCustomName(preset.name);
    setCustomCategory(preset.category);
    setCustomType(preset.type);
    // Reset scheduling and difficulty to defaults for user configuration
    setScheduleDays([0, 1, 2, 3, 4, 5, 6]);
    setCustomReminderTime('');
    setDifficultyMode('medium');
    setActiveTab('custom');
  };

  const handleSelectTemplate = (template: TemplateHabit) => {
    setCustomName(template.name);
    setCustomCategory(template.category);
    setCustomType(template.type);
    setScheduleDays(template.scheduleDays);
    // Reset reminder and difficulty to defaults for user configuration
    setCustomReminderTime('');
    setDifficultyMode('medium');
    setActiveTab('custom');
  };
  
  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customName.trim() && scheduleDays.length > 0) {
      let difficulty: string;
      let xpReward: number;

      if (difficultyMode === 'custom') {
          difficulty = customDifficultyName.trim() || 'Custom';
          xpReward = customXpReward;
      } else {
          difficulty = DIFFICULTY_PRESETS[difficultyMode].name;
          xpReward = DIFFICULTY_PRESETS[difficultyMode].xp;
      }

      onAddHabit({ 
          name: customName.trim(), 
          category: customCategory, 
          type: customType,
          reminderTime: customReminderTime || null,
          scheduleDays: scheduleDays.sort((a,b) => a-b),
          difficulty,
          xpReward,
      }, habitToDuplicate?.id);
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl bg-[#4a3f36] border-4 border-[#8a6a4f] shadow-[8px_8px_0px_#1a1515] p-6 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl text-[#f5b342]">{habitToDuplicate ? 'Duplicate Habit' : 'Add a New Habit'}</h2>
          <button onClick={handleClose} className="text-2xl text-[#f0e9d6] hover:text-red-500">&times;</button>
        </div>
        
        <div className="flex mb-4 border-b-4 border-[#8a6a4f]">
            <button onClick={() => setActiveTab('presets')} className={`flex-1 p-2 ${activeTab === 'presets' ? 'bg-[#8a6a4f] text-white' : 'bg-transparent'}`}>Presets</button>
            <button onClick={() => setActiveTab('custom')} className={`flex-1 p-2 ${activeTab === 'custom' ? 'bg-[#8a6a4f] text-white' : 'bg-transparent'}`}>Custom</button>
            <button onClick={() => setActiveTab('templates')} className={`flex-1 p-2 ${activeTab === 'templates' ? 'bg-[#8a6a4f] text-white' : 'bg-transparent'}`}>Ideas</button>
        </div>
        
        <div className="overflow-y-auto pr-2">
            {activeTab === 'custom' && (
              <form onSubmit={handleAddCustom}>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm uppercase">Habit Name</label>
                    <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} required className="w-full p-2 bg-[#2c2121] border-2 border-[#8a6a4f] focus:outline-none focus:border-[#f5b342]" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2 text-sm uppercase">Category</label>
                        <select value={customCategory} onChange={(e) => setCustomCategory(e.target.value as HabitCategory)} className="w-full p-2 bg-[#2c2121] border-2 border-[#8a6a4f] focus:outline-none focus:border-[#f5b342]">
                          {Object.values(HabitCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block mb-2 text-sm uppercase">Type</label>
                        <select value={customType} onChange={(e) => setCustomType(e.target.value as HabitType)} className="w-full p-2 bg-[#2c2121] border-2 border-[#8a6a4f] focus:outline-none focus:border-[#f5b342]">
                          {Object.values(HabitType).map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                      </div>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm uppercase">Difficulty & Reward</label>
                    <div className="bg-[#2c2121] border-2 border-[#8a6a4f] p-3 space-y-3">
                        <div className="flex gap-2">
                           {(Object.keys(DIFFICULTY_PRESETS) as DifficultyMode[]).map(key => (
                                <button key={key} type="button" onClick={() => setDifficultyMode(key)} className={`flex-1 px-2 py-1 text-xs border-2 transition-colors ${difficultyMode === key ? 'bg-[#f5b342] text-black border-[#f5b342]' : 'border-[#8a6a4f] hover:bg-[#6a5340]'}`}>
                                    {DIFFICULTY_PRESETS[key].name} ({DIFFICULTY_PRESETS[key].xp} XP)
                                </button>
                           ))}
                           <button type="button" onClick={() => setDifficultyMode('custom')} className={`flex-1 px-2 py-1 text-xs border-2 transition-colors ${difficultyMode === 'custom' ? 'bg-[#f5b342] text-black border-[#f5b342]' : 'border-[#8a6a4f] hover:bg-[#6a5340]'}`}>
                                Custom
                           </button>
                        </div>
                        {difficultyMode === 'custom' && (
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div>
                                    <label className="block mb-1 text-xs uppercase">Custom Name</label>
                                    <input type="text" value={customDifficultyName} onChange={e => setCustomDifficultyName(e.target.value)} className="w-full p-2 text-sm bg-[#4a3f36] border-2 border-[#8a6a4f] focus:outline-none focus:border-[#f5b342]" />
                                </div>
                                <div>
                                    <label className="block mb-1 text-xs uppercase">Base XP</label>
                                    <input type="number" value={customXpReward} onChange={e => setCustomXpReward(Math.max(1, parseInt(e.target.value) || 1))} min="1" max="100" className="w-full p-2 text-sm bg-[#4a3f36] border-2 border-[#8a6a4f] focus:outline-none focus:border-[#f5b342]" />
                                </div>
                            </div>
                        )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm uppercase">Scheduling</label>
                    <div className="bg-[#2c2121] border-2 border-[#8a6a4f] p-3">
                        <div className="flex justify-around mb-3">
                            {DAYS.map((day, index) => (
                               <button key={index} type="button" onClick={() => handleDayToggle(index)}
                                className={`w-8 h-8 border-2 flex items-center justify-center transition-colors ${scheduleDays.includes(index) ? 'bg-[#f5b342] text-black border-[#f5b342]' : 'bg-transparent text-white border-[#8a6a4f] hover:bg-[#6a5340]'}`}>
                                   {day}
                               </button>
                            ))}
                        </div>
                        <div className="flex justify-center gap-2 flex-wrap">
                            <button type="button" onClick={() => setScheduleDays([0, 1, 2, 3, 4, 5, 6])} className="px-2 py-1 text-xs border border-[#8a6a4f] hover:bg-[#6a5340]">Every Day</button>
                            <button type="button" onClick={() => setScheduleDays([1, 2, 3, 4, 5])} className="px-2 py-1 text-xs border border-[#8a6a4f] hover:bg-[#6a5340]">Weekdays</button>
                            <button type="button" onClick={() => setScheduleDays([0, 6])} className="px-2 py-1 text-xs border border-[#8a6a4f] hover:bg-[#6a5340]">Weekends</button>
                        </div>
                    </div>
                  </div>

                   <div>
                    <label className="block mb-2 text-sm uppercase">Reminder Time (Optional)</label>
                    <TimePicker
                      value={customReminderTime}
                      onChange={setCustomReminderTime}
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <PixelatedButton type="submit" disabled={scheduleDays.length === 0 || !customName.trim()}>
                    {habitToDuplicate ? 'Save Copy' : 'Create Habit'}
                  </PixelatedButton>
                </div>
              </form>
            )}
            {activeTab === 'presets' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96">
                {PRE_CONFIGURED_HABITS.map(habit => (
                   <button key={habit.name} onClick={() => handleSelectPreset(habit)} className="p-4 bg-[#2c2121] border-2 border-[#8a6a4f] text-left hover:bg-[#6a5340] hover:border-[#f5b342]">
                    <p className="font-bold text-white">{habit.name}</p>
                    <p className="text-xs text-[#b0a08f]">{habit.category}</p>
                  </button>
                ))}
              </div>
            )}
            {activeTab === 'templates' && (
                <div className="space-y-4 max-h-96">
                    {SCHEDULED_HABIT_TEMPLATES.map(template => (
                        <div key={template.name} className="p-4 bg-[#2c2121] border-2 border-[#8a6a4f]">
                            <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4">
                                <div className="w-full">
                                    <h4 className="text-lg text-white">{template.name}</h4>
                                    <p className="text-sm text-[#b0a08f]">
                                        Scheduled for: {
                                            template.scheduleDays.length === 7 ? 'Every Day' :
                                            template.scheduleDays.length === 2 && template.scheduleDays.includes(0) && template.scheduleDays.includes(6) ? 'Weekends' :
                                            template.scheduleDays.length === 5 && !template.scheduleDays.includes(0) && !template.scheduleDays.includes(6) ? 'Weekdays' :
                                            template.scheduleDays.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')
                                        }
                                    </p>
                                </div>
                                <PixelatedButton onClick={() => handleSelectTemplate(template)} className="text-sm shrink-0 w-full sm:w-auto">Select</PixelatedButton>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default AddHabitModal;
