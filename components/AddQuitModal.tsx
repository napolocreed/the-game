import React, { useState } from 'react';
import PixelatedButton from './PixelatedButton';
import { formatISO } from 'date-fns';

interface AddQuitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuit: (data: { name: string; startDate: string; costPerDay: number | null; motivation: string; savingsGoal: { name: string; price: number } | null }) => void;
}

const AddQuitModal: React.FC<AddQuitModalProps> = ({ isOpen, onClose, onAddQuit }) => {
  const [name, setName] = useState('');
  const [sinceDate, setSinceDate] = useState('');
  const [costPerDay, setCostPerDay] = useState('');
  const [motivation, setMotivation] = useState('');
  const [goalName, setGoalName] = useState('');
  const [goalPrice, setGoalPrice] = useState('');

  if (!isOpen) return null;

  const todayKey = formatISO(new Date(), { representation: 'date' });

  const handleClose = () => {
    setName('');
    setSinceDate('');
    setCostPerDay('');
    setMotivation('');
    setGoalName('');
    setGoalPrice('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Backdating is supported: if the user is already N days clean, that
    // progress is real and the earned milestones unlock immediately.
    let startDate = formatISO(new Date());
    if (sinceDate) {
      const parsed = new Date(`${sinceDate}T00:00:00`);
      if (!Number.isNaN(parsed.getTime()) && parsed <= new Date()) {
        startDate = formatISO(parsed);
      }
    }

    const cost = parseFloat(costPerDay.replace(',', '.'));
    const price = parseFloat(goalPrice.replace(',', '.'));
    const savingsGoal = goalName.trim() && !Number.isNaN(price) && price > 0
      ? { name: goalName.trim(), price }
      : null;

    onAddQuit({
      name: name.trim(),
      startDate,
      costPerDay: !Number.isNaN(cost) && cost > 0 ? cost : null,
      motivation,
      savingsGoal,
    });
    handleClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-[#4a3f36] border-4 border-[#8a6a4f] shadow-[8px_8px_0px_#1a1515] p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl text-[#f5b342]">Challenge a New Boss</h2>
          <button onClick={handleClose} className="text-3xl text-[#f0e9d6] hover:text-red-500 leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 text-sm uppercase">What are you quitting?</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cigarettes, Alcohol, Doomscrolling..."
              required
              className="w-full p-2 bg-[#2c2121] border-2 border-[#8a6a4f] focus:outline-none focus:border-[#f5b342] placeholder:text-[#6a5340]"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm uppercase">Clean since (optional)</label>
            <input
              type="date"
              value={sinceDate}
              max={todayKey}
              onChange={(e) => setSinceDate(e.target.value)}
              className="w-full p-2 bg-[#2c2121] border-2 border-[#8a6a4f] focus:outline-none focus:border-[#f5b342]"
            />
            <p className="text-xs text-amber-300 mt-1">Backdating counts.</p>
          </div>

          <div>
            <label className="block mb-2 text-sm uppercase">Why are you quitting? (optional)</label>
            <textarea
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              rows={2}
              placeholder="Your own words. e.g. To breathe better, for my family, to be free..."
              className="w-full p-2 bg-[#2c2121] border-2 border-[#8a6a4f] focus:outline-none focus:border-[#f5b342] text-sm placeholder:text-[#6a5340]"
            />
            <p className="text-xs text-amber-300 mt-1">Shown during urges.</p>
          </div>

          <div>
            <label className="block mb-2 text-sm uppercase">Cost per day in € (optional)</label>
            <input
              type="text"
              inputMode="decimal"
              value={costPerDay}
              onChange={(e) => setCostPerDay(e.target.value)}
              placeholder="e.g. 11"
              className="w-full p-2 bg-[#2c2121] border-2 border-[#8a6a4f] focus:outline-none focus:border-[#f5b342] placeholder:text-[#6a5340]"
            />
          </div>

          {costPerDay.trim() !== '' && (
            <div>
              <label className="block mb-2 text-sm uppercase">🎁 Reward goal (optional)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="Treat yourself to..."
                  className="flex-1 min-w-0 p-2 bg-[#2c2121] border-2 border-[#8a6a4f] focus:outline-none focus:border-[#f5b342] placeholder:text-[#6a5340]"
                />
                <input
                  type="text"
                  inputMode="decimal"
                  value={goalPrice}
                  onChange={(e) => setGoalPrice(e.target.value)}
                  placeholder="Price €"
                  className="w-24 p-2 bg-[#2c2121] border-2 border-[#8a6a4f] focus:outline-none focus:border-[#f5b342] placeholder:text-[#6a5340]"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <PixelatedButton type="submit" disabled={!name.trim()}>
              ⚔️ Start the Fight
            </PixelatedButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddQuitModal;
