import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Dumbbell, Search } from 'lucide-react';
import { api } from '../lib/api';
import type { Drill } from '../types';

const SKILL_CATEGORIES = [
  'All',
  'Dribbling & Ball Handling',
  'Weak / Left-Hand Mastery',
  'Shooting & Mechanics',
  'Vertical Jump & Explosiveness',
  'Stamina & Court Conditioning',
] as const;

interface SkillsTabProps {
  drills: Drill[];
  onDrillLogged: (message: string) => Promise<void>;
}

export function SkillsTab({ drills, onDrillLogged }: SkillsTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loggingId, setLoggingId] = useState<number | null>(null);
  const [customNotes, setCustomNotes] = useState<Record<number, string>>({});

  const filteredDrills = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return drills.filter((d) => {
      if (selectedCategory !== 'All' && d.category !== selectedCategory) return false;
      if (q) {
        return (
          d.title.toLowerCase().includes(q) ||
          d.instructions.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [drills, selectedCategory, searchQuery]);

  const handleCompleteAndLog = async (drill: Drill) => {
    setLoggingId(drill.id);
    try {
      await api.logTraining({
        drill_id: drill.id,
        drill_title: drill.title,
        category: drill.category,
        duration_mins: drill.duration_mins,
        notes: customNotes[drill.id] || '',
      });
      setCustomNotes((prev) => ({ ...prev, [drill.id]: '' }));
      await onDrillLogged(`Completed & logged "${drill.title}" (+${drill.duration_mins} mins)`);
    } finally {
      setLoggingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#1C1917]">
            Basketball Skill &amp; Conditioning Hub
          </h2>
          <p className="text-sm text-[#57534E]">
            Structured drills with form cues and injury-prevention guardrails.
          </p>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search drills..."
            aria-label="Search basketball drills"
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-[#E7E5E4] text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#EA580C]"
          />
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {SKILL_CATEGORIES.map((category) => {
          const active = selectedCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-[#EA580C] text-white shadow-sm'
                  : 'bg-white border border-[#E7E5E4] text-[#57534E] hover:text-[#1C1917] hover:border-[#D6D3D1]'
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* Drill Cards Grid */}
      {filteredDrills.length === 0 ? (
        <div className="court-card rounded-2xl p-10 text-center space-y-2">
          <p className="text-sm font-medium text-[#1C1917]">No drills match your filter.</p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
            }}
            className="text-xs font-semibold text-[#EA580C] hover:underline cursor-pointer"
          >
            Show all drills
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredDrills.map((drill) => (
            <article
              key={drill.id}
              className="court-card rounded-2xl p-6 flex flex-col justify-between gap-5"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#78716C]">
                      <span className="font-semibold text-[#EA580C]">{drill.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-[#292524]">{drill.difficulty}</span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-[#1C1917]">
                      {drill.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-[#1C1917] bg-[#FAF8F5] border border-[#E7E5E4] px-2.5 py-1 rounded-lg shrink-0">
                    <Clock className="w-3.5 h-3.5 text-[#EA580C]" />
                    <span>{drill.duration_mins}m</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-[#292524] bg-[#FFF7ED] border border-[#FED7AA] px-3 py-2 rounded-xl">
                  <Dumbbell className="w-3.5 h-3.5 text-[#EA580C] shrink-0" />
                  <span>{drill.sets_reps}</span>
                </div>

                <p className="text-sm text-[#44403C] leading-relaxed">{drill.instructions}</p>

                {/* Distinct "What NOT to Do" Alert Box */}
                <div className="rounded-xl bg-[#FEF2F2] border border-[#FECACA] p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#B91C1C]">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>What NOT to Do — Injury &amp; Habit Prevention</span>
                  </div>
                  <p className="text-xs text-[#991B1B] leading-relaxed">{drill.donts_warning}</p>
                </div>
              </div>

              {/* Log Session Action */}
              <div className="pt-3 border-t border-[#E7E5E4] flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <input
                  type="text"
                  value={customNotes[drill.id] || ''}
                  onChange={(e) =>
                    setCustomNotes((prev) => ({ ...prev, [drill.id]: e.target.value }))
                  }
                  placeholder="Optional note (e.g., 18/20 makes)"
                  aria-label={`Session note for ${drill.title}`}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E7E5E4] text-xs text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#EA580C]"
                />
                <button
                  type="button"
                  onClick={() => handleCompleteAndLog(drill)}
                  disabled={loggingId === drill.id}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold transition-colors disabled:opacity-60 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{loggingId === drill.id ? 'Logging...' : 'Complete & Log Drill'}</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
