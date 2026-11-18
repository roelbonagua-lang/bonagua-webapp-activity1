import React, { useState } from 'react';
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  Plus,
  Trash2,
  Utensils,
} from 'lucide-react';
import { api } from '../lib/api';
import type { AthleteGoal, AthleteUser, NutritionLog, NutritionTotals } from '../types';

const MEAL_TIMINGS = ['Pre-Game Fuel', 'Post-Game Recovery', 'Daily Meals'] as const;
const GOALS: AthleteGoal[] = [
  'Lean Muscle / Bulk',
  'Cut Fat for Vertical & Speed',
  'Game-Day Stamina',
];

const BUDGET_ATHLETE_FOODS = [
  {
    name: '3 Boiled Eggs',
    timing: 'Post-Game Recovery',
    calories: 215,
    protein_g: 19,
    carbs_g: 2,
  },
  {
    name: 'Chicken Breast & Steamed Rice',
    timing: 'Daily Meals',
    calories: 560,
    protein_g: 44,
    carbs_g: 62,
  },
  {
    name: '2 Ripe Bananas',
    timing: 'Pre-Game Fuel',
    calories: 210,
    protein_g: 2.5,
    carbs_g: 54,
  },
  {
    name: 'Oatmeal with Peanut Butter',
    timing: 'Pre-Game Fuel',
    calories: 360,
    protein_g: 13,
    carbs_g: 49,
  },
  {
    name: 'Canned Tuna & Crackers',
    timing: 'Post-Game Recovery',
    calories: 265,
    protein_g: 28,
    carbs_g: 18,
  },
  {
    name: 'Boiled Sweet Potato (Kamote)',
    timing: 'Pre-Game Fuel',
    calories: 180,
    protein_g: 3.5,
    carbs_g: 41,
  },
];

interface NutritionTabProps {
  user: AthleteUser;
  nutritionLogs: NutritionLog[];
  todayTotals: NutritionTotals;
  onUserUpdated: (user: AthleteUser) => void;
  onRefresh: (message?: string) => Promise<void>;
}

export function NutritionTab({
  user,
  nutritionLogs,
  todayTotals,
  onUserUpdated,
  onRefresh,
}: NutritionTabProps) {
  const [weightKg, setWeightKg] = useState(String(user.weight_kg));
  const [goal, setGoal] = useState<string>(user.goal);
  const [savingTargets, setSavingTargets] = useState(false);

  const [mealTiming, setMealTiming] = useState<string>(MEAL_TIMINGS[0]);
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [proteinG, setProteinG] = useState('');
  const [carbsG, setCarbsG] = useState('');
  const [loggingMeal, setLoggingMeal] = useState(false);
  const [quickAddingFood, setQuickAddingFood] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRecalculateTargets = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavingTargets(true);
    try {
      const res = await api.updateProfile({
        weight_kg: Number(weightKg) || user.weight_kg,
        goal,
      });
      onUserUpdated(res.user);
      await onRefresh(
        `Updated fuel targets: ${res.user.daily_calorie_target} kcal & ${res.user.daily_protein_target}g protein`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update macro targets.');
    } finally {
      setSavingTargets(false);
    }
  };

  const handleQuickAddFood = async (preset: (typeof BUDGET_ATHLETE_FOODS)[number]) => {
    setError(null);
    setQuickAddingFood(preset.name);
    try {
      await api.logMeal({
        meal_timing: preset.timing,
        food_name: preset.name,
        calories: preset.calories,
        protein_g: preset.protein_g,
        carbs_g: preset.carbs_g,
      });
      await onRefresh(`Added "${preset.name}" to ${preset.timing}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log preset food.');
    } finally {
      setQuickAddingFood(null);
    }
  };

  const handleLogCustomMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoggingMeal(true);
    try {
      await api.logMeal({
        meal_timing: mealTiming,
        food_name: foodName,
        calories: Number(calories),
        protein_g: Number(proteinG) || 0,
        carbs_g: Number(carbsG) || 0,
      });
      const addedName = foodName;
      setFoodName('');
      setCalories('');
      setProteinG('');
      setCarbsG('');
      await onRefresh(`Logged "${addedName}"`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log meal.');
    } finally {
      setLoggingMeal(false);
    }
  };

  const handleDeleteMeal = async (id: number) => {
    setDeletingId(id);
    try {
      await api.deleteNutritionLog(id);
      await onRefresh('Removed meal entry.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#1C1917]">
            Athlete Diet &amp; Nutrition Tracker
          </h2>
          <p className="text-sm text-[#57534E]">
            Fuel practice, recovery, and body composition with dynamic court-ready macros.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs bg-white border border-[#E7E5E4] rounded-xl px-4 py-2.5">
          <div>
            <span className="text-[#78716C]">Today: </span>
            <span className="font-mono font-bold text-[#1C1917]">
              {todayTotals.calories} / {user.daily_calorie_target} kcal
            </span>
          </div>
          <span aria-hidden="true" className="text-[#D6D3D1]">
            |
          </span>
          <div>
            <span className="text-[#78716C]">Protein: </span>
            <span className="font-mono font-bold text-[#15803D]">
              {todayTotals.protein_g} / {user.daily_protein_target}g
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#B91C1C]"
        >
          {error}
        </div>
      )}

      {/* Dynamic Macro Calculator & Nutrition Do's/Don'ts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-5 court-card rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FFF7ED] border border-[#FED7AA] flex items-center justify-center text-[#EA580C]">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-[#1C1917]">
                Dynamic Macro Calculator
              </h3>
              <p className="text-xs text-[#78716C]">
                Updates your SQLite profile targets immediately.
              </p>
            </div>
          </div>

          <form onSubmit={handleRecalculateTargets} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="calc-weight" className="block text-xs font-medium text-[#57534E]">
                  Weight (kg)
                </label>
                <input
                  id="calc-weight"
                  type="number"
                  min={40}
                  max={180}
                  step="0.5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E7E5E4] text-sm font-mono text-[#1C1917] focus:outline-none focus:border-[#EA580C]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="calc-goal" className="block text-xs font-medium text-[#57534E]">
                  Athlete Goal
                </label>
                <select
                  id="calc-goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E7E5E4] text-sm text-[#1C1917] focus:outline-none focus:border-[#EA580C]"
                >
                  {GOALS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E7E5E4]">
              <div>
                <p className="text-[11px] font-medium text-[#78716C]">Calorie Target</p>
                <p className="font-mono text-lg font-bold text-[#1C1917]">
                  {user.daily_calorie_target} kcal
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-[#78716C]">Protein Target</p>
                <p className="font-mono text-lg font-bold text-[#15803D]">
                  {user.daily_protein_target} g
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingTargets}
              className="w-full py-2.5 px-4 rounded-xl bg-[#1C1917] hover:bg-[#292524] text-white text-sm font-semibold transition-colors disabled:opacity-60 cursor-pointer"
            >
              {savingTargets ? 'Recalculating...' : 'Recalculate & Save Targets'}
            </button>
          </form>
        </section>

        {/* Nutrition Do's & Don'ts Panel */}
        <section className="lg:col-span-7 court-card rounded-2xl p-6 space-y-4">
          <h3 className="font-display text-base font-bold text-[#1C1917]">
            Basketball Nutrition Do&apos;s &amp; Don&apos;ts
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] p-4 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#15803D]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>What TO Do (Game-Ready Fuel)</span>
              </div>
              <ul className="space-y-2 text-xs text-[#166534] leading-relaxed">
                <li>
                  • Eat fast-digesting carbs (banana, oats, or kamote) 45–90 mins before tip-off for
                  explosive 4th-quarter energy.
                </li>
                <li>
                  • Hit 25–40g lean protein (eggs, chicken, tuna) within 60 mins after practice to
                  repair muscle fibers.
                </li>
                <li>• Sip 500ml water 2 hours prior to court sessions to prevent cramping.</li>
              </ul>
            </div>

            <div className="rounded-xl bg-[#FEF2F2] border border-[#FECACA] p-4 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#B91C1C]">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>What NOT to Do (Energy Crashes)</span>
              </div>
              <ul className="space-y-2 text-xs text-[#991B1B] leading-relaxed">
                <li>
                  • Do not eat heavy, greasy fried meals within 2 hours of practice—blood diverts
                  to digestion and slows reaction speed.
                </li>
                <li>
                  • Do not rely on sugary sodas or energy drinks right before runs; glucose spikes
                  cause mid-game fatigue crashes.
                </li>
                <li>
                  • Do not slash protein while cutting fat for vertical jump; you will lose lean
                  force production.
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      {/* Budget-Friendly Quick Add + Custom Meal Logger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-6 court-card rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="font-display text-base font-bold text-[#1C1917]">
              Quick-Add Budget Athlete Foods
            </h3>
            <p className="text-xs text-[#78716C]">
              One click logs directly to your daily SQLite nutrition history.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {BUDGET_ATHLETE_FOODS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                disabled={quickAddingFood === preset.name}
                onClick={() => handleQuickAddFood(preset)}
                className="text-left p-3.5 rounded-xl bg-[#FAF8F5] hover:bg-[#FFF7ED] border border-[#E7E5E4] hover:border-[#FED7AA] transition-colors flex items-center justify-between gap-2 cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#1C1917] truncate">{preset.name}</p>
                  <p className="text-[11px] font-mono text-[#78716C] mt-0.5">
                    {preset.calories} kcal · {preset.protein_g}g P · {preset.carbs_g}g C
                  </p>
                </div>
                <Plus className="w-4 h-4 text-[#EA580C] shrink-0" />
              </button>
            ))}
          </div>
        </section>

        <section className="lg:col-span-6 court-card rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="font-display text-base font-bold text-[#1C1917]">Custom Meal Entry</h3>
            <p className="text-xs text-[#78716C]">
              Categorize by Pre-Game Fuel, Post-Game Recovery, or Daily Meals.
            </p>
          </div>

          <form onSubmit={handleLogCustomMeal} className="space-y-3.5">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="diet-timing" className="block text-xs font-medium text-[#57534E]">
                  Meal Timing
                </label>
                <select
                  id="diet-timing"
                  value={mealTiming}
                  onChange={(e) => setMealTiming(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E7E5E4] text-sm text-[#1C1917] focus:outline-none focus:border-[#EA580C]"
                >
                  {MEAL_TIMINGS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="diet-food" className="block text-xs font-medium text-[#57534E]">
                  Food Name
                </label>
                <input
                  id="diet-food"
                  type="text"
                  required
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="e.g., Grilled Tilapia & Rice"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E7E5E4] text-sm text-[#1C1917] focus:outline-none focus:border-[#EA580C]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label htmlFor="diet-cals" className="block text-xs font-medium text-[#57534E]">
                  Calories
                </label>
                <input
                  id="diet-cals"
                  type="number"
                  required
                  min={1}
                  max={5000}
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="480"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E7E5E4] text-sm font-mono text-[#1C1917] focus:outline-none focus:border-[#EA580C]"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="diet-protein" className="block text-xs font-medium text-[#57534E]">
                  Protein (g)
                </label>
                <input
                  id="diet-protein"
                  type="number"
                  min={0}
                  max={400}
                  step="0.5"
                  value={proteinG}
                  onChange={(e) => setProteinG(e.target.value)}
                  placeholder="32"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E7E5E4] text-sm font-mono text-[#1C1917] focus:outline-none focus:border-[#EA580C]"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="diet-carbs" className="block text-xs font-medium text-[#57534E]">
                  Carbs (g)
                </label>
                <input
                  id="diet-carbs"
                  type="number"
                  min={0}
                  max={600}
                  step="0.5"
                  value={carbsG}
                  onChange={(e) => setCarbsG(e.target.value)}
                  placeholder="54"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E7E5E4] text-sm font-mono text-[#1C1917] focus:outline-none focus:border-[#EA580C]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loggingMeal}
              className="w-full py-2.5 px-4 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors disabled:opacity-60 cursor-pointer"
            >
              {loggingMeal ? 'Saving Meal...' : 'Log Meal'}
            </button>
          </form>
        </section>
      </div>

      {/* Meal History Table */}
      <section className="court-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E7E5E4] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-[#EA580C]" />
            <h3 className="font-display text-base font-bold text-[#1C1917]">Nutrition Log</h3>
          </div>
          <span className="font-mono text-xs text-[#78716C]">{nutritionLogs.length} entries</span>
        </div>

        {nutritionLogs.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#57534E]">
            No meals logged yet. Use the quick-add presets or custom meal logger above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E7E5E4] bg-[#FAF8F5] text-xs font-semibold text-[#57534E]">
                  <th className="py-3 px-6">Food</th>
                  <th className="py-3 px-4">Timing</th>
                  <th className="py-3 px-4 text-right">Calories</th>
                  <th className="py-3 px-4 text-right">Protein</th>
                  <th className="py-3 px-4 text-right">Carbs</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E4] text-sm">
                {nutritionLogs.map((row) => (
                  <tr key={row.id} className="hover:bg-[#FAF8F5]">
                    <td className="py-3 px-6 font-medium text-[#1C1917]">
                      <div>{row.food_name}</div>
                      <div className="text-xs font-mono text-[#78716C]">
                        {row.logged_at.slice(0, 16)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-[#57534E]">
                      {row.meal_timing}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-[#1C1917]">
                      {row.calories}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#15803D]">
                      {row.protein_g}g
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#57534E]">
                      {row.carbs_g}g
                    </td>
                    <td className="py-3 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteMeal(row.id)}
                        disabled={deletingId === row.id}
                        aria-label={`Delete ${row.food_name}`}
                        className="p-1.5 rounded-lg text-[#A8A29E] hover:text-[#B91C1C] hover:bg-[#FEF2F2] cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
