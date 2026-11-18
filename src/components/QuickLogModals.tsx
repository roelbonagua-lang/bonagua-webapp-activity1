import React, { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../lib/api';
import type { Drill } from '../types';

const CATEGORIES = [
  'Dribbling & Ball Handling',
  'Weak / Left-Hand Mastery',
  'Shooting & Mechanics',
  'Vertical Jump & Explosiveness',
  'Stamina & Court Conditioning',
];

const MEAL_TIMINGS = ['Pre-Game Fuel', 'Post-Game Recovery', 'Daily Meals'];

interface LogDrillModalProps {
  open: boolean;
  drills: Drill[];
  onClose: () => void;
  onSuccess: (message: string) => Promise<void>;
}

export function LogDrillModal({ open, drills, onClose, onSuccess }: LogDrillModalProps) {
  const [selectedDrillId, setSelectedDrillId] = useState<string>('custom');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [durationMins, setDurationMins] = useState('20');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSelectDrill = (val: string) => {
    setSelectedDrillId(val);
    if (val !== 'custom') {
      const found = drills.find((d) => String(d.id) === val);
      if (found) {
        setTitle(found.title);
        setCategory(found.category);
        setDurationMins(String(found.duration_mins));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.logTraining({
        drill_id: selectedDrillId === 'custom' ? null : Number(selectedDrillId),
        drill_title: title,
        category,
        duration_mins: Number(durationMins),
        notes,
      });
      setTitle('');
      setNotes('');
      setSelectedDrillId('custom');
      await onSuccess(`Logged "${title}" (${durationMins} mins)`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log training session.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1C1917]/50 backdrop-blur-[2px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="log-drill-modal-title"
    >
      <div className="w-full max-w-lg bg-white border border-[#E7E5E4] rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E5E4] bg-[#FAF8F5]">
          <h2 id="log-drill-modal-title" className="font-display text-lg font-bold text-[#1C1917]">
            Log Basketball Drill
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1C1917] hover:bg-[#E7E5E4]/50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C]">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="quick-drill-preset" className="block text-xs font-medium text-[#57534E]">
              Choose from Drill Library (or custom)
            </label>
            <select
              id="quick-drill-preset"
              value={selectedDrillId}
              onChange={(e) => handleSelectDrill(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E7E5E4] text-sm text-[#1C1917] focus:outline-none focus:border-[#EA580C]"
            >
              <option value="custom">Custom Drill / Scrimmage</option>
              {drills.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.duration_mins}m)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="quick-drill-title" className="block text-xs font-medium text-[#57534E]">
              Drill Title
            </label>
            <input
              id="quick-drill-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Left-Hand Mikan & Reverse Finishes"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E7E5E4] text-sm text-[#1C1917] focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                htmlFor="quick-drill-category"
                className="block text-xs font-medium text-[#57534E]"
              >
                Skill Category
              </label>
              <select
                id="quick-drill-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#E7E5E4] text-sm text-[#1C1917] focus:outline-none focus:border-[#EA580C]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="quick-drill-mins"
                className="block text-xs font-medium text-[#57534E]"
              >
                Duration (mins)
              </label>
              <input
                id="quick-drill-mins"
                type="number"
                required
                min={1}
                max={240}
                value={durationMins}
                onChange={(e) => setDurationMins(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E7E5E4] text-sm font-mono text-[#1C1917] focus:outline-none focus:border-[#EA580C]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="quick-drill-notes" className="block text-xs font-medium text-[#57534E]">
              Session Notes (optional)
            </label>
            <textarea
              id="quick-drill-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Made shots, fatigue level, form cues..."
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E7E5E4] text-sm text-[#1C1917] focus:outline-none focus:border-[#EA580C] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E7E5E4] text-sm font-medium text-[#57534E] hover:bg-[#FAF8F5] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Saving...' : 'Save Workout Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface LogMealModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (message: string) => Promise<void>;
}

export function LogMealModal({ open, onClose, onSuccess }: LogMealModalProps) {
  const [mealTiming, setMealTiming] = useState(MEAL_TIMINGS[0]);
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [proteinG, setProteinG] = useState('');
  const [carbsG, setCarbsG] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.logMeal({
        meal_timing: mealTiming,
        food_name: foodName,
        calories: Number(calories),
        protein_g: Number(proteinG) || 0,
        carbs_g: Number(carbsG) || 0,
      });
      const savedName = foodName;
      setFoodName('');
      setCalories('');
      setProteinG('');
      setCarbsG('');
      await onSuccess(`Logged "${savedName}"`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log meal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1C1917]/50 backdrop-blur-[2px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="log-meal-modal-title"
    >
      <div className="w-full max-w-lg bg-white border border-[#E7E5E4] rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E5E4] bg-[#FAF8F5]">
          <h2 id="log-meal-modal-title" className="font-display text-lg font-bold text-[#1C1917]">
            Log Athlete Meal
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1C1917] hover:bg-[#E7E5E4]/50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C]">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="quick-meal-timing" className="block text-xs font-medium text-[#57534E]">
              Meal Timing
            </label>
            <select
              id="quick-meal-timing"
              value={mealTiming}
              onChange={(e) => setMealTiming(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E7E5E4] text-sm text-[#1C1917] focus:outline-none focus:border-[#EA580C]"
            >
              {MEAL_TIMINGS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="quick-food-name" className="block text-xs font-medium text-[#57534E]">
              Food / Meal Name
            </label>
            <input
              id="quick-food-name"
              type="text"
              required
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              placeholder="e.g., Chicken Breast & Steamed Rice"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E7E5E4] text-sm text-[#1C1917] focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="quick-meal-cals" className="block text-xs font-medium text-[#57534E]">
                Calories (kcal)
              </label>
              <input
                id="quick-meal-cals"
                type="number"
                required
                min={1}
                max={5000}
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="450"
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#E7E5E4] text-sm font-mono text-[#1C1917] focus:outline-none focus:border-[#EA580C]"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="quick-meal-protein"
                className="block text-xs font-medium text-[#57534E]"
              >
                Protein (g)
              </label>
              <input
                id="quick-meal-protein"
                type="number"
                min={0}
                max={400}
                step="0.5"
                value={proteinG}
                onChange={(e) => setProteinG(e.target.value)}
                placeholder="35"
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#E7E5E4] text-sm font-mono text-[#1C1917] focus:outline-none focus:border-[#EA580C]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="quick-meal-carbs" className="block text-xs font-medium text-[#57534E]">
                Carbs (g)
              </label>
              <input
                id="quick-meal-carbs"
                type="number"
                min={0}
                max={600}
                step="0.5"
                value={carbsG}
                onChange={(e) => setCarbsG(e.target.value)}
                placeholder="55"
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#E7E5E4] text-sm font-mono text-[#1C1917] focus:outline-none focus:border-[#EA580C]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E7E5E4] text-sm font-medium text-[#57534E] hover:bg-[#FAF8F5] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Saving...' : 'Log Meal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
