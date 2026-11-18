import { useState } from 'react';
import {
  Check,
  Droplets,
  Flame,
  Plus,
  Trash2,
  TrendingUp,
  Utensils,
} from 'lucide-react';
import { api } from '../lib/api';
import type {
  AthleteUser,
  NutritionLog,
  NutritionTotals,
  TrainingLog,
  WeekDayCheckIn,
} from '../types';
import { ProgressRing } from './ProgressRing';

interface DashboardTabProps {
  user: AthleteUser;
  todayMinutes: number;
  weekDays: WeekDayCheckIn[];
  streakCount: number;
  trainingLogs: TrainingLog[];
  todayMeals: NutritionLog[];
  todayTotals: NutritionTotals;
  hydrationGlasses: number;
  onHydrationChange: (glasses: number) => Promise<void>;
  onOpenLogDrill: () => void;
  onOpenLogMeal: () => void;
  onRefresh: () => Promise<void>;
  onNavigateTab: (tab: 'skills' | 'nutrition' | 'coach') => void;
}

export function DashboardTab({
  user,
  todayMinutes,
  weekDays,
  streakCount,
  trainingLogs,
  todayMeals,
  todayTotals,
  hydrationGlasses,
  onHydrationChange,
  onOpenLogDrill,
  onOpenLogMeal,
  onRefresh,
  onNavigateTab,
}: DashboardTabProps) {
  const [updatingWater, setUpdatingWater] = useState(false);
  const [deletingTrainingId, setDeletingTrainingId] = useState<number | null>(null);
  const [deletingMealId, setDeletingMealId] = useState<number | null>(null);

  const skillTarget = Math.max(15, user.daily_skill_mins_target);
  const calorieTarget = Math.max(1200, user.daily_calorie_target);
  const proteinTarget = Math.max(50, user.daily_protein_target);
  const carbsTarget = Math.round((calorieTarget * 0.48) / 4);

  const proteinPct = Math.min(100, Math.round((todayTotals.protein_g / proteinTarget) * 100));
  const carbsPct = Math.min(100, Math.round((todayTotals.carbs_g / carbsTarget) * 100));

  const todayDatePrefix = new Date().toISOString().slice(0, 10);
  const recentTraining = trainingLogs.slice(0, 6);

  const handleToggleGlass = async (glassIndex: number) => {
    if (updatingWater) return;
    setUpdatingWater(true);
    try {
      const nextCount = glassIndex === hydrationGlasses ? glassIndex - 1 : glassIndex;
      await onHydrationChange(nextCount);
    } finally {
      setUpdatingWater(false);
    }
  };

  const handleDeleteTraining = async (id: number) => {
    setDeletingTrainingId(id);
    try {
      await api.deleteTrainingLog(id);
      await onRefresh();
    } finally {
      setDeletingTrainingId(null);
    }
  };

  const handleDeleteMeal = async (id: number) => {
    setDeletingMealId(id);
    try {
      await api.deleteNutritionLog(id);
      await onRefresh();
    } finally {
      setDeletingMealId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner with Subtle Basketball Seam Arc */}
      <div className="relative overflow-hidden rounded-2xl bg-[#1C1917] text-white p-6 sm:p-7 shadow-md">
        <svg
          className="absolute -right-12 -top-14 w-72 h-72 text-[#EA580C]/20 pointer-events-none"
          viewBox="0 0 200 200"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="100" cy="100" r="88" stroke="currentColor" strokeWidth="2.5" />
          <path d="M22 68C64 90 64 140 22 162" stroke="currentColor" strokeWidth="2" />
          <path d="M178 38C136 60 136 110 178 132" stroke="currentColor" strokeWidth="2" />
          <path d="M12 100H188" stroke="currentColor" strokeWidth="2" />
        </svg>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-[#FDBA74]">
              {user.position} · {user.goal}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Ready for the court, {user.name.split(' ')[0]}
            </h2>
            <p className="text-sm text-[#D6D3D1] max-w-xl">
              Track daily skill minutes, fuel targets, hydration, and consistency streaks in one
              place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenLogDrill}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Log Basketball Drill
            </button>
            <button
              type="button"
              onClick={onOpenLogMeal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#292524] hover:bg-[#3A3432] border border-white/15 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-[#FDBA74]" />
              Log Meal
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* 1. Skill Training Ring */}
        <div className="court-card rounded-2xl p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-[#78716C]">Skill Training</p>
              <h3 className="font-display text-base font-bold text-[#1C1917] mt-0.5">
                Court Minutes
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('skills')}
              className="text-xs font-semibold text-[#EA580C] hover:text-[#C2410C] cursor-pointer"
            >
              View Drills
            </button>
          </div>

          <div className="flex items-center gap-4">
            <ProgressRing
              value={todayMinutes}
              max={skillTarget}
              color={todayMinutes >= skillTarget ? '#15803D' : '#EA580C'}
              centerLabel={`${todayMinutes}m`}
              centerSublabel={`of ${skillTarget}m`}
            />
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-[#1C1917]">
                {todayMinutes >= skillTarget
                  ? 'Daily goal hit'
                  : `${skillTarget - todayMinutes} mins left`}
              </p>
              <p className="text-[#78716C]">
                {trainingLogs.filter((l) => l.logged_at.startsWith(todayDatePrefix)).length} drills
                logged today
              </p>
            </div>
          </div>
        </div>

        {/* 2. Calorie & Macro Fuel Ring */}
        <div className="court-card rounded-2xl p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-[#78716C]">Calorie &amp; Macro Fuel</p>
              <h3 className="font-display text-base font-bold text-[#1C1917] mt-0.5">
                Daily Energy
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('nutrition')}
              className="text-xs font-semibold text-[#EA580C] hover:text-[#C2410C] cursor-pointer"
            >
              Diet Log
            </button>
          </div>

          <div className="flex items-center gap-4">
            <ProgressRing
              value={todayTotals.calories}
              max={calorieTarget}
              color={todayTotals.calories > calorieTarget + 250 ? '#D97706' : '#EA580C'}
              centerLabel={`${todayTotals.calories}`}
              centerSublabel={`of ${calorieTarget}`}
            />
            <div className="flex-1 space-y-2.5 min-w-0">
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-medium text-[#57534E]">Protein</span>
                  <span className="font-mono text-[#1C1917]">
                    {todayTotals.protein_g}/{proteinTarget}g
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[#F5EFE6] overflow-hidden">
                  <div
                    className="h-full bg-[#15803D] transition-all duration-300"
                    style={{ width: `${proteinPct}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-medium text-[#57534E]">Carbs</span>
                  <span className="font-mono text-[#1C1917]">
                    {todayTotals.carbs_g}/{carbsTarget}g
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[#F5EFE6] overflow-hidden">
                  <div
                    className="h-full bg-[#EA580C] transition-all duration-300"
                    style={{ width: `${carbsPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Hydration Tracker */}
        <div className="court-card rounded-2xl p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-[#78716C]">Hydration Tracker</p>
              <h3 className="font-display text-base font-bold text-[#1C1917] mt-0.5">
                {hydrationGlasses} / 8 Glasses
              </h3>
            </div>
            <Droplets className="w-5 h-5 text-[#0284C7]" />
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }, (_, idx) => {
                const glassNumber = idx + 1;
                const filled = glassNumber <= hydrationGlasses;
                return (
                  <button
                    key={glassNumber}
                    type="button"
                    disabled={updatingWater}
                    onClick={() => handleToggleGlass(glassNumber)}
                    aria-label={`Set hydration to ${glassNumber} glasses`}
                    className={`h-10 rounded-xl border text-xs font-mono font-semibold flex items-center justify-center transition-all cursor-pointer ${
                      filled
                        ? 'bg-[#E0F2FE] border-[#0284C7] text-[#0369A1]'
                        : 'bg-[#FAF8F5] border-[#E7E5E4] text-[#A8A29E] hover:border-[#0284C7]/50'
                    }`}
                  >
                    {glassNumber}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[#78716C]">
              {hydrationGlasses >= 8
                ? 'Target hydrated for practice & recovery.'
                : 'Tap a glass to sync hydration to your database.'}
            </p>
          </div>
        </div>

        {/* 4. Weekly Consistency Streak */}
        <div className="court-card rounded-2xl p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-[#78716C]">Court Consistency</p>
              <h3 className="font-display text-base font-bold text-[#1C1917] mt-0.5">
                {streakCount}-Day Streak
              </h3>
            </div>
            <Flame className="w-5 h-5 text-[#EA580C]" />
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-7 gap-1.5">
              {weekDays.map((day) => (
                <div key={day.date} className="flex flex-col items-center gap-1.5">
                  <div
                    title={`${day.date}: ${day.minutes} mins`}
                    className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${
                      day.completed
                        ? 'bg-[#EA580C] border-[#EA580C] text-white'
                        : 'bg-[#FAF8F5] border-[#E7E5E4] text-[#A8A29E]'
                    }`}
                  >
                    {day.completed ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <span className="text-[10px] font-mono">0</span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-[#78716C]">{day.label}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#78716C]">
              {weekDays.filter((d) => d.completed).length} of 7 days active this week.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Split: Recent Workouts & Today's Meals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Training Sessions */}
        <section className="lg:col-span-6 court-card rounded-2xl overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-[#E7E5E4] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-4 h-4 text-[#EA580C]" />
              <h3 className="font-display text-base font-bold text-[#1C1917]">
                Recent Skill Sessions
              </h3>
            </div>
            <button
              type="button"
              onClick={onOpenLogDrill}
              className="text-xs font-semibold text-[#EA580C] hover:text-[#C2410C] cursor-pointer"
            >
              + Log Drill
            </button>
          </div>

          {recentTraining.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-sm text-[#57534E]">No training sessions logged yet.</p>
              <button
                type="button"
                onClick={onOpenLogDrill}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FFF7ED] border border-[#FED7AA] text-xs font-semibold text-[#C2410C] cursor-pointer"
              >
                Log First Drill
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#E7E5E4]">
              {recentTraining.map((log) => (
                <div
                  key={log.id}
                  className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-[#FAF8F5] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1C1917] truncate">
                      {log.drill_title}
                    </p>
                    <p className="text-xs text-[#78716C] truncate">
                      {log.category} · {log.logged_at.slice(0, 10)}
                      {log.notes ? ` · ${log.notes}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-xs font-semibold text-[#EA580C]">
                      {log.duration_mins}m
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteTraining(log.id)}
                      disabled={deletingTrainingId === log.id}
                      aria-label={`Delete ${log.drill_title}`}
                      className="p-1.5 rounded-lg text-[#A8A29E] hover:text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Today's Fuel Log */}
        <section className="lg:col-span-6 court-card rounded-2xl overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-[#E7E5E4] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Utensils className="w-4 h-4 text-[#15803D]" />
              <h3 className="font-display text-base font-bold text-[#1C1917]">
                Today&apos;s Meals ({todayMeals.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={onOpenLogMeal}
              className="text-xs font-semibold text-[#EA580C] hover:text-[#C2410C] cursor-pointer"
            >
              + Log Meal
            </button>
          </div>

          {todayMeals.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-sm text-[#57534E]">No meals logged for today yet.</p>
              <button
                type="button"
                onClick={onOpenLogMeal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FFF7ED] border border-[#FED7AA] text-xs font-semibold text-[#C2410C] cursor-pointer"
              >
                Log First Meal
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#E7E5E4]">
              {todayMeals.map((meal) => (
                <div
                  key={meal.id}
                  className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-[#FAF8F5] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1C1917] truncate">
                      {meal.food_name}
                    </p>
                    <p className="text-xs text-[#78716C]">
                      {meal.meal_timing} · {meal.protein_g}g protein · {meal.carbs_g}g carbs
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-xs font-semibold text-[#1C1917]">
                      {meal.calories} kcal
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteMeal(meal.id)}
                      disabled={deletingMealId === meal.id}
                      aria-label={`Delete ${meal.food_name}`}
                      className="p-1.5 rounded-lg text-[#A8A29E] hover:text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
