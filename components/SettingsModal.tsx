import React, { useRef, useState } from 'react';
import { PlayerProfile, Habit, PlayerSettings, Skin } from '../types';
import SkinGallery from './SkinGallery';
import { UnlockContext } from '../utils/skinUnlocks';
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
  pushConfigured: boolean;
  pushEnabled: boolean;
  onTogglePush: (enabled: boolean) => void;
  pushStatusMessage: string;
  onExportData: () => void;
  onImportData: (event: React.ChangeEvent<HTMLInputElement>) => void;
  autoBackupEnabled: boolean;
  onToggleAutoBackup: (enabled: boolean) => void;
  lastAutoBackupDate: string | null;
  skins: Skin[];
  activeSkinId: string;
  unlockCtx: UnlockContext;
  onSelectSkin: (id: string) => void;
  onUpdateSettings: (settings: PlayerSettings) => void;
}

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; }> = ({ checked, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
    <div className="w-11 h-6 bg-inset peer-focus:outline-none border-2 border-frame peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-ink after:border-frame after:border after:h-5 after:w-5 after:transition-all peer-checked:bg-good"></div>
  </label>
);

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, profile, habits, onRestore, onDelete, notificationPermission, onRequestPermission, onSendTestNotification, testNotifMessage, pushConfigured, pushEnabled, onTogglePush, pushStatusMessage, onExportData, onImportData, autoBackupEnabled, onToggleAutoBackup, lastAutoBackupDate, onUpdateSettings, skins, activeSkinId, unlockCtx, onSelectSkin }) => {
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
    <div className="fixed inset-0 bg-scrim flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg bg-surface border-4 border-frame shadow-hard p-6 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-2xl text-accent">Settings</h2>
          <button onClick={onClose} className="text-3xl text-ink hover:text-danger-hi leading-none">&times;</button>
        </div>
        
        <div className="overflow-y-auto pr-2">
            <div className="space-y-4 bg-inset border-2 border-frame p-4 mb-6">
                <div className="flex justify-between items-center">
                    <p className="text-ink-dim">Player Level:</p>
                    <p className="text-xl text-ink-hi font-bold">{profile.level}</p>
                </div>
                <div className="flex justify-between items-center">
                    <p className="text-ink-dim">Total XP:</p>
                    <p className="text-xl text-ink-hi font-bold">{profile.totalXP.toLocaleString()}</p>
                </div>
                <div className="flex justify-between items-center">
                    <p className="text-ink-dim">Badges Unlocked:</p>
                    <p className="text-xl text-ink-hi font-bold">{Object.keys(profile.unlockedBadges).length}</p>
                </div>
            </div>

            <div className="mb-6">
                <h3 className="text-lg text-accent mb-2">Appearance</h3>
                <SkinGallery
                  skins={skins}
                  activeSkinId={activeSkinId}
                  ctx={unlockCtx}
                  onSelect={onSelectSkin}
                />
            </div>

            <div className="mb-6">
                <h3 className="text-lg text-accent mb-2">Gameplay</h3>
                <div className="bg-inset border-2 border-frame p-4">
                    <label className="block mb-2 text-sm uppercase text-ink-dim">Daily Habit Limit</label>
                    <input
                        type="number"
                        value={profile.settings?.dailyHabitLimit ?? ''}
                        onChange={handleLimitChange}
                        min="1"
                        placeholder="No limit"
                        className="w-full p-2 bg-surface border-2 border-frame focus:outline-none focus:border-accent"
                        aria-label="Daily Habit Limit"
                    />
                    <p className="text-xs text-warn mt-2">Blank = no limit.</p>
                </div>
            </div>

            <div className="mb-6">
                <h3 className="text-lg text-accent mb-2">Notifications</h3>
                <div className="bg-inset border-2 border-frame p-4">
                    <div className="flex justify-between items-center">
                        <p className="text-ink-dim">Reminders & Alerts</p>
                        {notificationPermission === 'granted' && <p className="text-good-soft font-bold">Enabled</p>}
                        {notificationPermission === 'default' && <PixelatedButton onClick={onRequestPermission}>Enable</PixelatedButton>}
                        {notificationPermission === 'denied' && <p className="text-danger-hi font-bold">Blocked</p>}
                    </div>
                    {notificationPermission === 'granted' && (
                        <div className="mt-4 pt-4 border-t-2 border-surface space-y-4">
                            <p className="text-xs text-ink-dim">Fires only while the app is open.</p>
                            {pushConfigured && (
                                <div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-ink-dim">Push (app closed)</p>
                                        <ToggleSwitch checked={pushEnabled} onChange={onTogglePush} />
                                    </div>
                                    {pushStatusMessage && <p className="text-xs text-warn mt-2">{pushStatusMessage}</p>}
                                </div>
                            )}
                            <div>
                                <PixelatedButton onClick={onSendTestNotification} disabled={!!testNotifMessage} className="text-sm">
                                    Send Test Notification
                                </PixelatedButton>
                                {testNotifMessage && <p className="text-xs text-warn mt-2">{testNotifMessage}</p>}
                            </div>
                        </div>
                    )}
                </div>
                {notificationPermission === 'denied' && <p className="text-xs text-warn mt-2">Enable it in your browser settings.</p>}
            </div>

            <div className="mb-6">
              <h3 className="text-lg text-accent mb-2">Backup & Restore</h3>
              <div className="bg-inset border-2 border-frame p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-ink-dim">Export game data</p>
                  <PixelatedButton onClick={onExportData} className="text-sm">
                    <ExportIcon className="w-4 h-4 mr-2" />
                    Export
                  </PixelatedButton>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-ink-dim">Import from file</p>
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
                    <p className="text-ink-dim">Enable weekly auto-backups</p>
                    <ToggleSwitch checked={autoBackupEnabled} onChange={onToggleAutoBackup} />
                  </div>
                  <p className="text-xs text-warn mt-1">
                    Weekly snapshot on this device.
                    {lastAutoBackupDate && ` Last: ${new Date(lastAutoBackupDate).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
              <p className="text-xs text-warn mt-2">Import overwrites your progress.</p>
            </div>

            <div>
                <h3 className="text-lg text-accent mb-2">Archived Habits</h3>
                <div className="bg-inset border-2 border-frame p-4 max-h-60 overflow-y-auto">
                    {archivedHabits.length > 0 ? (
                        <div className="space-y-3">
                            {archivedHabits.map(habit => (
                                <div key={habit.id} className="flex justify-between items-center bg-surface p-2 border border-frame-dim">
                                    <p className="text-ink-hi">{habit.name}</p>
                                    <div className="flex gap-2">
                                        <button onClick={() => onRestore(habit.id)} title="Restore" className="p-1 hover:bg-raised"><RestoreIcon className="w-5 h-5 text-good-soft"/></button>
                                        <button onClick={() => onDelete(habit)} title="Delete Permanently" className="p-1 hover:bg-raised"><TrashIcon className="w-5 h-5 text-danger-hi"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-ink-dim">No archived habits.</p>
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