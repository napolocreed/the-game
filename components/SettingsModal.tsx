import React, { useRef, useState } from 'react';
import { PlayerProfile, Habit, PlayerSettings } from '../types';
import PixelatedButton from './PixelatedButton';
import { RestoreIcon } from './icons/RestoreIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ExportIcon } from './icons/ExportIcon';
import { ImportIcon } from './icons/ImportIcon';


interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  habits: Habit[];
  onRestore: (habitId: string) => void;
  onDelete: (habit: Habit) => void;
  notificationPermission: string;
  onRequestPermission: () => void;
  onSendTestNotification: () => void;
  testNotifMessage: string;
  onExportData: () => void;
  onImportData: (event: React.ChangeEvent<HTMLInputElement>) => void;
  autoBackupEnabled: boolean;
  onToggleAutoBackup: (enabled: boolean) => void;
  onUpdateSettings: (settings: PlayerSettings) => void;
}

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; }> = ({ checked, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
    <div className="w-11 h-6 bg-[#2c2121] peer-focus:outline-none border-2 border-[#8a6a4f] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:h-5 after:w-5 after:transition-all peer-checked:bg-green-700"></div>
  </label>
);

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, profile, habits, onRestore, onDelete, notificationPermission, onRequestPermission, onSendTestNotification, testNotifMessage, onExportData, onImportData, autoBackupEnabled, onToggleAutoBackup, onUpdateSettings }) => {
  const importInputRef = useRef<HTMLInputElement>(null);
  
  if (!isOpen) return null;

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value === '' ? null : parseInt(value, 10);

    if (profile.settings && (numValue === null || (!isNaN(numValue) && numValue > 0))) {
        onUpdateSettings({ ...profile.settings, dailyHabitLimit: numValue });
    } else if (value === '' && profile.settings) {
        onUpdateSettings({ ...profile.settings, dailyHabitLimit: null });
    }
  };

  const archivedHabits = habits.filter(h => h.isArchived);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg bg-[#4a3f36] border-4 border-[#8a6a4f] shadow-[8px_8px_0px_#1a1515] p-6 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-2xl text-[#f5b342]">Settings</h2>
          <button onClick={onClose} className="text-3xl text-[#f0e9d6] hover:text-red-500 leading-none">&times;</button>
        </div>
        
        <div className="overflow-y-auto pr-2">
            <div className="space-y-4 bg-[#2c2121] border-2 border-[#8a6a4f] p-4 mb-6">
                <div className="flex justify-between items-center">
                    <p className="text-[#b0a08f]">Player Level:</p>
                    <p className="text-xl text-white font-bold">{profile.level}</p>
                </div>
                <div className="flex justify-between items-center">
                    <p className="text-[#b0a08f]">Total XP:</p>
                    <p className="text-xl text-white font-bold">{profile.totalXP.toLocaleString()}</p>
                </div>
                <div className="flex justify-between items-center">
                    <p className="text-[#b0a08f]">Badges Unlocked:</p>
                    <p className="text-xl text-white font-bold">{Object.keys(profile.unlockedBadges).length}</p>
                </div>
            </div>

            <div className="mb-6">
                <h3 className="text-lg text-[#f5b342] mb-2">Gameplay</h3>
                <div className="bg-[#2c2121] border-2 border-[#8a6a4f] p-4">
                    <label className="block mb-2 text-sm uppercase text-[#b0a08f]">Daily Habit Limit</label>
                    <input
                        type="number"
                        value={profile.settings?.dailyHabitLimit ?? ''}
                        onChange={handleLimitChange}
                        min="1"
                        placeholder="No limit"
                        className="w-full p-2 bg-[#4a3f36] border-2 border-[#8a6a4f] focus:outline-none focus:border-[#f5b342]"
                        aria-label="Daily Habit Limit"
                    />
                    <p className="text-xs text-amber-300 mt-2">Set a limit on habits per day to maintain focus. Leave blank for unlimited.</p>
                </div>
            </div>

            <div className="mb-6">
                <h3 className="text-lg text-[#f5b342] mb-2">Notifications</h3>
                <div className="bg-[#2c2121] border-2 border-[#8a6a4f] p-4">
                    <div className="flex justify-between items-center">
                        <p className="text-[#b0a08f]">Reminders & Alerts</p>
                        {notificationPermission === 'granted' && <p className="text-green-400 font-bold">Enabled</p>}
                        {notificationPermission === 'default' && <PixelatedButton onClick={onRequestPermission}>Enable</PixelatedButton>}
                        {notificationPermission === 'denied' && <p className="text-red-400 font-bold">Blocked</p>}
                    </div>
                    {notificationPermission === 'granted' && (
                        <div className="mt-4 pt-4 border-t-2 border-[#4a3f36]">
                            <PixelatedButton onClick={onSendTestNotification} disabled={!!testNotifMessage} className="text-sm">
                                Send Test Notification
                            </PixelatedButton>
                            {testNotifMessage && <p className="text-xs text-amber-300 mt-2">{testNotifMessage}</p>}
                        </div>
                    )}
                </div>
                {notificationPermission === 'denied' && <p className="text-xs text-amber-300 mt-2">You need to enable notifications in your browser settings for this site.</p>}
            </div>

            <div className="mb-6">
              <h3 className="text-lg text-[#f5b342] mb-2">Backup & Restore</h3>
              <div className="bg-[#2c2121] border-2 border-[#8a6a4f] p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-[#b0a08f]">Export game data</p>
                  <PixelatedButton onClick={onExportData} className="text-sm">
                    <ExportIcon className="w-4 h-4 mr-2" />
                    Export
                  </PixelatedButton>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[#b0a08f]">Import from file</p>
                  <div>
                    <PixelatedButton onClick={() => importInputRef.current?.click()} className="text-sm">
                      <ImportIcon className="w-4 h-4 mr-2" />
                      Import
                    </PixelatedButton>
                    <input type="file" ref={importInputRef} accept=".json" className="hidden" onChange={onImportData} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <p className="text-[#b0a08f]">Enable weekly auto-backups</p>
                    <ToggleSwitch checked={autoBackupEnabled} onChange={onToggleAutoBackup} />
                  </div>
                  <p className="text-xs text-amber-300 mt-1">Automatically saves a weekly snapshot to local storage.</p>
                </div>
              </div>
              <p className="text-xs text-amber-300 mt-2">Manual backups are recommended. Importing data will overwrite your current progress.</p>
            </div>

            <div>
                <h3 className="text-lg text-[#f5b342] mb-2">Archived Habits</h3>
                <div className="bg-[#2c2121] border-2 border-[#8a6a4f] p-4 max-h-60 overflow-y-auto">
                    {archivedHabits.length > 0 ? (
                        <div className="space-y-3">
                            {archivedHabits.map(habit => (
                                <div key={habit.id} className="flex justify-between items-center bg-[#4a3f36] p-2 border border-[#6a5340]">
                                    <p className="text-white">{habit.name}</p>
                                    <div className="flex gap-2">
                                        <button onClick={() => onRestore(habit.id)} title="Restore" className="p-1 hover:bg-[#6a5340]"><RestoreIcon className="w-5 h-5 text-green-400"/></button>
                                        <button onClick={() => onDelete(habit)} title="Delete Permanently" className="p-1 hover:bg-[#6a5340]"><TrashIcon className="w-5 h-5 text-red-500"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-[#b0a08f]">No archived habits.</p>
                    )}
                </div>
            </div>
        </div>
        
        <div className="mt-8 flex justify-end shrink-0">
            <PixelatedButton onClick={onClose}>Close</PixelatedButton>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;