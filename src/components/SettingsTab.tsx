import React, { useEffect, useState } from 'react';
import { Database, RefreshCw, Save, UserCheck } from 'lucide-react';
import { api } from '../lib/api';
import type { AthleteGoal, AthleteUser, SchemaTable } from '../types';

const POSITIONS = ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'];
const GOALS: AthleteGoal[] = [
  'Game-Day Stamina',
  'Lean Muscle / Bulk',
  'Cut Fat for Vertical & Speed',
];

interface SettingsTabProps {
  user: AthleteUser;
  onUserUpdated: (user: AthleteUser, message: string) => void;
}

export function SettingsTab({ user, onUserUpdated }: SettingsTabProps) {
  const [name, setName] = useState(user.name);
  const [position, setPosition] = useState(user.position);
  const [heightCm, setHeightCm] = useState(String(user.height_cm));
  const [weightKg, setWeightKg] = useState(String(user.weight_kg));
  const [goal, setGoal] = useState(user.goal);
  const [skillTarget, setSkillTarget] = useState(String(user.daily_skill_mins_target));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [engine, setEngine] = useState('SQLite (better-sqlite3)');
  const [tables, setTables] = useState<SchemaTable[]>([]);
  const [loadingSchema, setLoadingSchema] = useState(true);

  const loadSchema = async () => {
    setLoadingSchema(true);
    try {
      const res = await api.getSchema();
      setEngine(res.engine);
      setTables(res.tables);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to inspect database schema.');
    } finally {
      setLoadingSchema(false);
    }
  };

  useEffect(() => {
    void loadSchema();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await api.updateProfile({
        name,
        position,
        height_cm: Number(heightCm),
        weight_kg: Number(weightKg),
        goal,
        daily_skill_mins_target: Number(skillTarget),
      });
      onUserUpdated(res.user, 'Saved athlete profile & recalculated macro targets.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-[#1C1917]">
          Settings &amp; Database Schema
        </h2>
        <p className="text-sm text-[#57534E]">
          Manage your athlete metrics and inspect the live relational SQLite tables.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#B91C1C]">
          {error}
        </div>
      )}

      {/* Athlete Profile Form */}
      <section className="court-card rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#FFF7ED] border border-[#FED7AA] flex items-center justify-center text-[#EA580C]">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-[#1C1917]">Athlete Profile</h3>
            <p className="text-xs text-[#78716C]">{user.email}</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="set-name" className="block text-xs font-medium text-[#57534E]">
              Full Name
            </label>
            <input
              id="set-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E7E5E4] text-sm text-[#1C1917] focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="set-pos" className="block text-xs font-medium text-[#57534E]">
              Position
            </label>
            <select
              id="set-pos"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E7E5E4] text-sm text-[#1C1917] focus:outline-none focus:border-[#EA580C]"
            >
              {POSITIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="set-goal" className="block text-xs font-medium text-[#57534E]">
              Primary Goal
            </label>
            <select
              id="set-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E7E5E4] text-sm text-[#1C1917] focus:outline-none focus:border-[#EA580C]"
            >
              {GOALS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="set-height" className="block text-xs font-medium text-[#57534E]">
              Height (cm)
            </label>
            <input
              id="set-height"
              type="number"
              min={140}
              max={235}
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E7E5E4] text-sm font-mono text-[#1C1917] focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="set-weight" className="block text-xs font-medium text-[#57534E]">
              Weight (kg)
            </label>
            <input
              id="set-weight"
              type="number"
              min={40}
              max={180}
              step="0.5"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E7E5E4] text-sm font-mono text-[#1C1917] focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="set-skill-target" className="block text-xs font-medium text-[#57534E]">
              Daily Skill Target (mins)
            </label>
            <input
              id="set-skill-target"
              type="number"
              min={15}
              max={240}
              value={skillTarget}
              onChange={(e) => setSkillTarget(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E7E5E4] text-sm font-mono text-[#1C1917] focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3 flex items-center justify-between pt-2">
            <p className="text-xs font-mono text-[#78716C]">
              Active Targets: {user.daily_calorie_target} kcal · {user.daily_protein_target}g
              protein · {user.daily_skill_mins_target}m skills
            </p>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors disabled:opacity-60 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* Live SQLite Database Schema Viewer */}
      <section className="court-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E7E5E4] flex items-center justify-between gap-4 bg-[#FAF8F5]">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-[#EA580C]" />
            <div>
              <h3 className="font-display text-base font-bold text-[#1C1917]">
                Database Schema Viewer
              </h3>
              <p className="text-xs text-[#78716C]">{engine}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadSchema}
            disabled={loadingSchema}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E7E5E4] text-xs font-medium text-[#1C1917] hover:bg-[#FAF8F5] cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingSchema ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
          {tables.map((table) => (
            <div
              key={table.name}
              className="rounded-xl border border-[#E7E5E4] bg-[#FAF8F5] overflow-hidden"
            >
              <div className="px-4 py-3 bg-[#1C1917] text-white flex items-center justify-between">
                <span className="font-mono text-sm font-semibold text-[#FDBA74]">
                  {table.name}
                </span>
                <span className="font-mono text-xs text-[#D6D3D1]">
                  {table.rowCount} {table.rowCount === 1 ? 'row' : 'rows'}
                </span>
              </div>

              <div className="divide-y divide-[#E7E5E4] bg-white">
                {table.columns.map((col) => (
                  <div
                    key={col.name}
                    className="px-4 py-2 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-medium text-[#1C1917] truncate">
                        {col.name}
                      </span>
                      {col.pk === 1 && (
                        <span className="font-mono text-[10px] font-bold text-[#EA580C]">PK</span>
                      )}
                    </div>
                    <span className="font-mono text-[#78716C] shrink-0">
                      {col.type || 'TEXT'}
                      {col.notnull === 1 ? ' NOT NULL' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
