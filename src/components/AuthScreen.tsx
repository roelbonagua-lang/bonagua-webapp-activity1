import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { api, setStoredToken } from '../lib/api';
import type { AthleteGoal, AthleteUser } from '../types';
import { WelHoopLogo } from './WelHoopLogo';

interface AuthScreenProps {
  onAuthenticated: (user: AthleteUser) => void;
}

const POSITIONS = ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'];
const GOALS: AthleteGoal[] = [
  'Game-Day Stamina',
  'Lean Muscle / Bulk',
  'Cut Fat for Vertical & Speed',
];

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [position, setPosition] = useState('Point Guard');
  const [heightCm, setHeightCm] = useState('183');
  const [weightKg, setWeightKg] = useState('77');
  const [goal, setGoal] = useState<AthleteGoal>('Game-Day Stamina');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res =
        mode === 'login'
          ? await api.login({ email, password })
          : await api.register({
              name,
              email,
              password,
              position,
              height_cm: Number(heightCm) || 180,
              weight_kg: Number(weightKg) || 75,
              goal,
            });
      setStoredToken(res.token);
      onAuthenticated(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setDemoLoading(true);
    try {
      const res = await api.demoLogin();
      setStoredToken(res.token);
      onAuthenticated(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start demo session.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] grid lg:grid-cols-12">
      {/* Left Hardwood Visual Panel */}
      <div className="relative hidden lg:flex lg:col-span-5 flex-col justify-between overflow-hidden bg-[#1C1917] text-white">
        {!imgFailed ? (
          <img
            src="/src/assets/images/welhoop_court_hero_1795014711339.jpg"
            alt="Leather basketball on an indoor maple hardwood court"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#292524] via-[#1C1917] to-[#431407]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917] via-[#1C1917]/55 to-[#1C1917]/30" />

        <div className="relative z-10 p-10">
          <WelHoopLogo size={38} inverted />
        </div>

        <div className="relative z-10 p-10 space-y-5">
          <div className="space-y-3 max-w-md">
            <h1 className="font-display text-3xl font-bold tracking-tight text-white leading-tight [text-wrap:balance]">
              Train smarter on the hardwood. Fuel like a pro.
            </h1>
            <p className="text-sm text-[#E7E5E4]/90 leading-relaxed">
              Combine structured basketball skill progressions, injury-prevention guardrails, daily
              macro tracking, and Gemini AI court coaching in one athlete workspace.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#D6D3D1]">
            <span>Skill Drills &amp; Form Alerts</span>
            <span aria-hidden="true">·</span>
            <span>Macro &amp; Hydration Tracking</span>
            <span aria-hidden="true">·</span>
            <span>AI Court Coach</span>
          </div>
        </div>
      </div>

      {/* Right Auth Panel */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden">
            <WelHoopLogo size={36} />
          </div>

          <div className="space-y-1.5">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
              {mode === 'login' ? 'Sign in to WelHoop' : 'Create your athlete profile'}
            </h2>
            <p className="text-sm text-[#57534E]">
              {mode === 'login'
                ? 'Access your daily court rings, meal logs, and AI practice plans.'
                : 'Set your position and body metrics to auto-calculate your daily fuel targets.'}
            </p>
          </div>

          {/* One-Click Demo Athlete Login */}
          <div className="rounded-2xl bg-[#FFF7ED] border border-[#FED7AA] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-[#9A3412]">Explore instantly</p>
              <p className="text-xs text-[#7C2D12]/85">
                Sign in as Marcus Vance (PG) with seeded workouts &amp; meals.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={demoLoading || loading}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-semibold transition-colors disabled:opacity-60 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>{demoLoading ? 'Signing in...' : 'Demo Athlete Login'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#F5F2ED] border border-[#E7E5E4]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-2 px-4 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                mode === 'login'
                  ? 'bg-white text-[#1C1917] shadow-sm border border-[#E7E5E4]'
                  : 'text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`py-2 px-4 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                mode === 'register'
                  ? 'bg-white text-[#1C1917] shadow-sm border border-[#E7E5E4]'
                  : 'text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#B91C1C]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label htmlFor="auth-name" className="block text-sm font-medium text-[#292524]">
                  Athlete Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="auth-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jordan Reyes"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E7E5E4] text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/15"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="auth-email" className="block text-sm font-medium text-[#292524]">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="athlete@welhoop.app"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E7E5E4] text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/15"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="auth-password" className="block text-sm font-medium text-[#292524]">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-white border border-[#E7E5E4] text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917] p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-position"
                    className="block text-xs font-medium text-[#57534E]"
                  >
                    Position
                  </label>
                  <select
                    id="auth-position"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E7E5E4] text-sm text-[#1C1917] focus:outline-none focus:border-[#EA580C]"
                  >
                    {POSITIONS.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="auth-goal" className="block text-xs font-medium text-[#57534E]">
                    Goal
                  </label>
                  <select
                    id="auth-goal"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value as AthleteGoal)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E7E5E4] text-sm text-[#1C1917] focus:outline-none focus:border-[#EA580C]"
                  >
                    {GOALS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-height"
                    className="block text-xs font-medium text-[#57534E]"
                  >
                    Height (cm)
                  </label>
                  <input
                    id="auth-height"
                    type="number"
                    min={140}
                    max={235}
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E7E5E4] text-sm font-mono text-[#1C1917] focus:outline-none focus:border-[#EA580C]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-weight"
                    className="block text-xs font-medium text-[#57534E]"
                  >
                    Weight (kg)
                  </label>
                  <input
                    id="auth-weight"
                    type="number"
                    min={40}
                    max={180}
                    step="0.5"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E7E5E4] text-sm font-mono text-[#1C1917] focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || demoLoading}
              className="w-full py-2.5 px-5 rounded-xl bg-[#1C1917] hover:bg-[#292524] text-white text-sm font-semibold transition-colors disabled:opacity-60 cursor-pointer"
            >
              {loading
                ? mode === 'login'
                  ? 'Signing in...'
                  : 'Creating account...'
                : mode === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
