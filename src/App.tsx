/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Dumbbell,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  Utensils,
  X,
} from 'lucide-react';
import { AuthScreen } from './components/AuthScreen';
import { AiCoachTab } from './components/AiCoachTab';
import { DashboardTab } from './components/DashboardTab';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NutritionTab } from './components/NutritionTab';
import { LogDrillModal, LogMealModal } from './components/QuickLogModals';
import { SettingsTab } from './components/SettingsTab';
import { SkillsTab } from './components/SkillsTab';
import { WelHoopLogo } from './components/WelHoopLogo';
import { api, getStoredToken, setStoredToken } from './lib/api';
import type {
  AthleteUser,
  Drill,
  NavTab,
  NutritionLog,
  NutritionTotals,
  TrainingLog,
  WeekDayCheckIn,
} from './types';

function WelHoopShell() {
  const [user, setUser] = useState<AthleteUser | null>(null);
  const [booting, setBooting] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [drills, setDrills] = useState<Drill[]>([]);
  const [trainingLogs, setTrainingLogs] = useState<TrainingLog[]>([]);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [weekDays, setWeekDays] = useState<WeekDayCheckIn[]>([]);
  const [streakCount, setStreakCount] = useState(0);

  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
  const [todayMeals, setTodayMeals] = useState<NutritionLog[]>([]);
  const [todayTotals, setTodayTotals] = useState<NutritionTotals>({
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
  });
  const [hydrationGlasses, setHydrationGlasses] = useState(0);

  const [drillModalOpen, setDrillModalOpen] = useState(false);
  const [mealModalOpen, setMealModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => {
      setToast((prev) => (prev === message ? null : prev));
    }, 4000);
  }, []);

  const refreshWorkspace = useCallback(async () => {
    const [drillsRes, trainingRes, nutritionRes, hydrationRes] = await Promise.all([
      api.getDrills(),
      api.getTrainingLogs(),
      api.getNutritionLogs(),
      api.getHydration(),
    ]);
    setDrills(drillsRes.drills);
    setTrainingLogs(trainingRes.logs);
    setTodayMinutes(trainingRes.todayMinutes);
    setWeekDays(trainingRes.weekDays);
    setStreakCount(trainingRes.streakCount);
    setNutritionLogs(nutritionRes.logs);
    setTodayMeals(nutritionRes.todayMeals);
    setTodayTotals(nutritionRes.todayTotals);
    setHydrationGlasses(hydrationRes.glasses_count);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      const token = getStoredToken();
      if (!token) {
        setBooting(false);
        return;
      }
      try {
        const meRes = await api.getMe();
        if (cancelled) return;
        setUser(meRes.user);
        await refreshWorkspace();
      } catch {
        setStoredToken(null);
      } finally {
        if (!cancelled) setBooting(false);
      }
    };
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [refreshWorkspace]);

  const handleAuthenticated = async (loggedInUser: AthleteUser) => {
    setUser(loggedInUser);
    await refreshWorkspace();
  };

  const handleSignOut = () => {
    setStoredToken(null);
    setUser(null);
    setActiveTab('dashboard');
  };

  const handleHydrationChange = async (glasses: number) => {
    const res = await api.updateHydration(glasses);
    setHydrationGlasses(res.glasses_count);
  };

  if (booting) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center gap-3 text-[#57534E]">
        <WelHoopLogo size={42} />
        <div className="flex items-center gap-2 text-sm mt-2">
          <Loader2 className="w-4 h-4 text-[#EA580C] animate-spin" />
          <span>Loading your athlete portal...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'skills', label: 'Skill & Drill Hub', icon: <Dumbbell className="w-4 h-4" /> },
    { id: 'nutrition', label: 'Athlete Diet', icon: <Utensils className="w-4 h-4" /> },
    { id: 'coach', label: 'AI WelHoop Coach', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings & Schema', icon: <Settings className="w-4 h-4" /> },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#1C1917] text-[#FAF8F5]">
      <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
        <WelHoopLogo size={34} inverted />
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation"
          className="lg:hidden p-1.5 rounded-lg text-[#A8A29E] hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1.5" aria-label="Primary navigation">
        {navItems.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-[#EA580C] text-white shadow-sm'
                  : 'text-[#D6D3D1] hover:text-white hover:bg-[#292524]'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Athlete Summary Footer */}
      <div className="p-4 border-t border-white/10 space-y-3 bg-[#171412]">
        <div className="px-2 space-y-0.5">
          <p className="text-sm font-semibold text-white truncate">{user.name}</p>
          <p className="text-xs text-[#A8A29E] truncate">
            {user.position} · {user.weight_kg} kg
          </p>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#292524] hover:bg-[#3A3432] border border-white/10 text-xs font-semibold text-white transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-[#FDBA74]" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative z-10 w-72 max-w-[85vw] h-full">{sidebarContent}</aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-[#FAF8F5]/95 backdrop-blur-sm border-b border-[#E7E5E4] px-4 sm:px-8 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation"
                className="lg:hidden p-2 rounded-xl bg-white border border-[#E7E5E4] text-[#1C1917]"
              >
                <Menu className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-display font-bold text-[#1C1917]">WelHoop</span>
                <span aria-hidden="true" className="text-[#A8A29E]">
                  /
                </span>
                <span className="text-[#57534E] font-medium">
                  {navItems.find((n) => n.id === activeTab)?.label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-[#57534E]">
              <span className="hidden sm:inline">
                Target: {user.daily_calorie_target} kcal · {user.daily_protein_target}g P
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {toast && (
              <div
                role="status"
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-sm text-[#15803D]"
              >
                <span className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {toast}
                </span>
                <button
                  type="button"
                  onClick={() => setToast(null)}
                  aria-label="Dismiss message"
                  className="hover:opacity-75 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {activeTab === 'dashboard' && (
              <DashboardTab
                user={user}
                todayMinutes={todayMinutes}
                weekDays={weekDays}
                streakCount={streakCount}
                trainingLogs={trainingLogs}
                todayMeals={todayMeals}
                todayTotals={todayTotals}
                hydrationGlasses={hydrationGlasses}
                onHydrationChange={handleHydrationChange}
                onOpenLogDrill={() => setDrillModalOpen(true)}
                onOpenLogMeal={() => setMealModalOpen(true)}
                onRefresh={refreshWorkspace}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'skills' && (
              <SkillsTab
                drills={drills}
                onDrillLogged={async (msg) => {
                  await refreshWorkspace();
                  showToast(msg);
                }}
              />
            )}

            {activeTab === 'nutrition' && (
              <NutritionTab
                user={user}
                nutritionLogs={nutritionLogs}
                todayTotals={todayTotals}
                onUserUpdated={(updatedUser) => setUser(updatedUser)}
                onRefresh={async (msg) => {
                  await refreshWorkspace();
                  if (msg) showToast(msg);
                }}
              />
            )}

            {activeTab === 'coach' && (
              <AiCoachTab
                onDataLogged={async (msg) => {
                  await refreshWorkspace();
                  showToast(msg);
                }}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsTab
                user={user}
                onUserUpdated={(updatedUser, msg) => {
                  setUser(updatedUser);
                  showToast(msg);
                }}
              />
            )}
          </div>
        </main>
      </div>

      <LogDrillModal
        open={drillModalOpen}
        drills={drills}
        onClose={() => setDrillModalOpen(false)}
        onSuccess={async (msg) => {
          await refreshWorkspace();
          showToast(msg);
        }}
      />

      <LogMealModal
        open={mealModalOpen}
        onClose={() => setMealModalOpen(false)}
        onSuccess={async (msg) => {
          await refreshWorkspace();
          showToast(msg);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <WelHoopShell />
    </ErrorBoundary>
  );
}
