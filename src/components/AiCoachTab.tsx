import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Plus,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { api } from '../lib/api';
import type { GeneratedPlan, WeeklyCritique } from '../types';

const FOCUS_OPTIONS = [
  'Weak / Left-Hand Mastery + Stamina',
  'Shooting Mechanics & Catch-and-Shoot',
  'Dribbling Under Pressure + Conditioning',
  'Vertical Jump & First-Step Explosiveness',
  'Full Game-Ready Guard Workout',
];

interface AiCoachTabProps {
  onDataLogged: (message: string) => Promise<void>;
}

export function AiCoachTab({ onDataLogged }: AiCoachTabProps) {
  const [activeTool, setActiveTool] = useState<'generator' | 'critique'>('generator');

  const [focusSkill, setFocusSkill] = useState(FOCUS_OPTIONS[0]);
  const [availableMins, setAvailableMins] = useState('45');
  const [equipment, setEquipment] = useState('1 basketball, outdoor/indoor hoop, 2 cones');

  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);

  const [generatingCritique, setGeneratingCritique] = useState(false);
  const [critique, setCritique] = useState<WeeklyCritique | null>(null);
  const [critiqueError, setCritiqueError] = useState<string | null>(null);

  const [loggingItem, setLoggingItem] = useState<string | null>(null);

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlanError(null);
    setGeneratingPlan(true);
    try {
      const res = await api.generatePlan({
        focusSkill,
        availableMins: Number(availableMins) || 45,
        equipment,
      });
      setPlan(res.plan);
    } catch (err) {
      setPlanError(
        err instanceof Error ? err.message : 'Unable to generate custom practice plan.',
      );
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleGenerateCritique = async () => {
    setCritiqueError(null);
    setGeneratingCritique(true);
    try {
      const res = await api.generateCritique();
      setCritique(res.critique);
    } catch (err) {
      setCritiqueError(
        err instanceof Error ? err.message : 'Unable to run weekly progress critique.',
      );
    } finally {
      setGeneratingCritique(false);
    }
  };

  const handleQuickLogAiDrill = async (drill: GeneratedPlan['drills'][number]) => {
    setLoggingItem(drill.title);
    try {
      await api.logTraining({
        drill_title: drill.title,
        category: drill.category,
        duration_mins: drill.durationMins,
        notes: `${drill.setsReps} · ${drill.focusCue}`,
      });
      await onDataLogged(`Logged AI drill "${drill.title}"`);
    } finally {
      setLoggingItem(null);
    }
  };

  const handleQuickLogAiMeal = async (
    timing: string,
    mealData: GeneratedPlan['mealPlan']['preGame'],
  ) => {
    setLoggingItem(mealData.meal);
    try {
      await api.logMeal({
        meal_timing: timing,
        food_name: mealData.meal,
        calories: mealData.calories,
        protein_g: mealData.proteinG,
        carbs_g: mealData.carbsG,
      });
      await onDataLogged(`Logged AI meal "${mealData.meal}"`);
    } finally {
      setLoggingItem(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#1C1917]">AI WelHoop Coach</h2>
          <p className="text-sm text-[#57534E]">
            Personalized routines and weekly progress critiques powered by Gemini on the backend.
          </p>
        </div>

        <div className="inline-flex p-1 rounded-xl bg-[#F2EFE9] border border-[#E7E5E4] self-start">
          <button
            type="button"
            onClick={() => setActiveTool('generator')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTool === 'generator'
                ? 'bg-white text-[#1C1917] shadow-sm border border-[#E7E5E4]'
                : 'text-[#57534E] hover:text-[#1C1917]'
            }`}
          >
            Practice &amp; Meal Generator
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('critique')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTool === 'critique'
                ? 'bg-white text-[#1C1917] shadow-sm border border-[#E7E5E4]'
                : 'text-[#57534E] hover:text-[#1C1917]'
            }`}
          >
            Weekly Progress Critique
          </button>
        </div>
      </div>

      {activeTool === 'generator' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Request Form */}
          <section className="lg:col-span-4 court-card rounded-2xl p-6 space-y-4 self-start">
            <h3 className="font-display text-base font-bold text-[#1C1917]">
              Session Parameters
            </h3>

            <form onSubmit={handleGeneratePlan} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="ai-focus" className="block text-xs font-medium text-[#57534E]">
                  Focus Skill
                </label>
                <select
                  id="ai-focus"
                  value={focusSkill}
                  onChange={(e) => setFocusSkill(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E7E5E4] text-sm text-[#1C1917] focus:outline-none focus:border-[#EA580C]"
                >
                  {FOCUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="ai-mins" className="block text-xs font-medium text-[#57534E]">
                  Available Time (minutes)
                </label>
                <input
                  id="ai-mins"
                  type="number"
                  min={15}
                  max={120}
                  value={availableMins}
                  onChange={(e) => setAvailableMins(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E7E5E4] text-sm font-mono text-[#1C1917] focus:outline-none focus:border-[#EA580C]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="ai-equipment" className="block text-xs font-medium text-[#57534E]">
                  Available Equipment
                </label>
                <textarea
                  id="ai-equipment"
                  rows={2}
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E7E5E4] text-sm text-[#1C1917] focus:outline-none focus:border-[#EA580C] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={generatingPlan}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors disabled:opacity-60 cursor-pointer"
              >
                {generatingPlan ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>{generatingPlan ? 'Building Plan...' : 'Generate Routine & Meals'}</span>
              </button>
            </form>
          </section>

          {/* Plan Output */}
          <section className="lg:col-span-8 space-y-5">
            {planError && (
              <div
                role="alert"
                className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#B91C1C]"
              >
                {planError}
              </div>
            )}

            {!plan && !generatingPlan ? (
              <div className="court-card rounded-2xl p-10 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[#FFF7ED] border border-[#FED7AA] flex items-center justify-center text-[#EA580C]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-[#1C1917]">
                  Build a tailored practice &amp; nutrition plan
                </h3>
                <p className="text-sm text-[#57534E] max-w-md mx-auto">
                  Select your focus skill, time window, and equipment on the left. Coach WelHoop
                  will generate drills, pre/post-game fuel, and injury-prevention cues.
                </p>
              </div>
            ) : generatingPlan ? (
              <div className="court-card rounded-2xl p-12 flex flex-col items-center justify-center gap-3 text-sm text-[#57534E]">
                <Loader2 className="w-7 h-7 text-[#EA580C] animate-spin" />
                <span>Coaching staff is building your custom court &amp; fuel blueprint...</span>
              </div>
            ) : (
              plan && (
                <div className="space-y-5">
                  <div className="court-card rounded-2xl p-6 space-y-3">
                    <h3 className="font-display text-xl font-bold text-[#1C1917]">
                      {plan.routineTitle}
                    </h3>
                    <p className="text-sm text-[#44403C]">{plan.coachingNote}</p>
                    <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E7E5E4] text-xs text-[#292524]">
                      <span className="font-bold text-[#EA580C]">Warm-Up: </span>
                      {plan.warmup}
                    </div>
                  </div>

                  {/* Drills */}
                  <div className="court-card rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#E7E5E4]">
                      <h4 className="font-display text-base font-bold text-[#1C1917]">
                        Practice Drills
                      </h4>
                    </div>
                    <div className="divide-y divide-[#E7E5E4]">
                      {plan.drills.map((d) => (
                        <div
                          key={d.title}
                          className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-[#78716C]">
                              <span className="font-semibold text-[#EA580C]">{d.category}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono">{d.durationMins} mins</span>
                              <span aria-hidden="true">·</span>
                              <span>{d.setsReps}</span>
                            </div>
                            <p className="font-semibold text-[#1C1917] text-sm">{d.title}</p>
                            <p className="text-xs text-[#57534E]">{d.focusCue}</p>
                          </div>

                          <button
                            type="button"
                            disabled={loggingItem === d.title}
                            onClick={() => handleQuickLogAiDrill(d)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold shrink-0 cursor-pointer self-start sm:self-center"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{loggingItem === d.title ? 'Logging...' : 'Log Drill'}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Meal Recommendations */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    {(
                      [
                        { label: 'Pre-Game Fuel', data: plan.mealPlan.preGame },
                        { label: 'Post-Game Recovery', data: plan.mealPlan.postGame },
                      ] as const
                    ).map((m) => (
                      <div key={m.label} className="court-card rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#EA580C]">{m.label}</span>
                          <span className="text-xs font-mono text-[#78716C]">{m.data.timing}</span>
                        </div>
                        <p className="text-sm font-semibold text-[#1C1917]">{m.data.meal}</p>
                        <p className="text-xs font-mono text-[#57534E]">
                          {m.data.calories} kcal · {m.data.proteinG}g P · {m.data.carbsG}g C
                        </p>
                        <button
                          type="button"
                          disabled={loggingItem === m.data.meal}
                          onClick={() => handleQuickLogAiMeal(m.label, m.data)}
                          className="w-full py-2 px-3 rounded-xl bg-[#FFF7ED] hover:bg-[#FFEDD5] border border-[#FED7AA] text-xs font-semibold text-[#C2410C] cursor-pointer"
                        >
                          {loggingItem === m.data.meal ? 'Logging...' : `Log as ${m.label}`}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Mistakes to Avoid */}
                  <div className="rounded-2xl bg-[#FEF2F2] border border-[#FECACA] p-5 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#B91C1C]">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Mistakes to Avoid</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-[#991B1B]">
                      {plan.mistakesToAvoid.map((item, idx) => (
                        <li key={idx}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            )}
          </section>
        </div>
      ) : (
        /* Weekly Progress Critique */
        <div className="space-y-5">
          <div className="court-card rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-display text-lg font-bold text-[#1C1917]">
                7-Day Training &amp; Nutrition Critique
              </h3>
              <p className="text-sm text-[#57534E]">
                Analyzes your live SQLite training_logs, nutrition_logs, and hydration counts.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerateCritique}
              disabled={generatingCritique}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1C1917] hover:bg-[#292524] text-white text-sm font-semibold disabled:opacity-60 cursor-pointer shrink-0"
            >
              {generatingCritique ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ClipboardCheck className="w-4 h-4 text-[#FDBA74]" />
              )}
              <span>
                {generatingCritique ? 'Analyzing Database Logs...' : 'Analyze My Weekly Progress'}
              </span>
            </button>
          </div>

          {critiqueError && (
            <div
              role="alert"
              className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#B91C1C]"
            >
              {critiqueError}
            </div>
          )}

          {critique && (
            <div className="space-y-5">
              <div className="court-card rounded-2xl p-6 space-y-3">
                <span className="inline-block text-xs font-bold text-[#EA580C]">
                  {critique.readinessVerdict}
                </span>
                <h4 className="font-display text-xl font-bold text-[#1C1917]">
                  {critique.headline}
                </h4>
                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E7E5E4] space-y-1">
                    <p className="text-xs font-bold text-[#1C1917]">Training Assessment</p>
                    <p className="text-xs text-[#44403C] leading-relaxed">
                      {critique.trainingSummary}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E7E5E4] space-y-1">
                    <p className="text-xs font-bold text-[#1C1917]">Nutrition Assessment</p>
                    <p className="text-xs text-[#44403C] leading-relaxed">
                      {critique.nutritionSummary}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div className="rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] p-5 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#15803D]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Strengths</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-[#166534]">
                    {critique.strengths.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] p-5 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#B45309]">
                    <TrendingUp className="w-4 h-4" />
                    <span>Priority Adjustments</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-[#92400E]">
                    {critique.improvements.map((imp, i) => (
                      <li key={i}>• {imp}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="court-card rounded-2xl p-5 flex items-start gap-3 bg-[#FFF7ED]/70 border-[#FED7AA]">
                <Sparkles className="w-5 h-5 text-[#EA580C] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[#9A3412]">Next Session Focus</p>
                  <p className="text-sm text-[#1C1917] mt-0.5">{critique.nextSessionFocus}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
