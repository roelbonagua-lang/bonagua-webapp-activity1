import type {
  AthleteUser,
  Drill,
  GeneratedPlan,
  NutritionLog,
  NutritionTotals,
  SchemaTable,
  TrainingLog,
  WeekDayCheckIn,
  WeeklyCritique,
} from '../types';

const TOKEN_STORAGE_KEY = 'welhoop_auth_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors in restricted environments
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const data = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }
  return data;
}

export const api = {
  register: (payload: {
    name: string;
    email: string;
    password: string;
    position: string;
    height_cm: number;
    weight_kg: number;
    goal: string;
  }) =>
    apiFetch<{ token: string; user: AthleteUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    apiFetch<{ token: string; user: AthleteUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  demoLogin: () =>
    apiFetch<{ token: string; user: AthleteUser }>('/api/auth/demo', {
      method: 'POST',
    }),

  getMe: () => apiFetch<{ user: AthleteUser }>('/api/auth/me'),

  updateProfile: (payload: {
    name?: string;
    position?: string;
    height_cm?: number;
    weight_kg?: number;
    goal?: string;
    daily_skill_mins_target?: number;
  }) =>
    apiFetch<{ user: AthleteUser }>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  getDrills: (category?: string) => {
    const qs = category && category !== 'All' ? `?category=${encodeURIComponent(category)}` : '';
    return apiFetch<{ drills: Drill[] }>(`/api/drills${qs}`);
  },

  getTrainingLogs: () =>
    apiFetch<{
      logs: TrainingLog[];
      todayMinutes: number;
      weekDays: WeekDayCheckIn[];
      streakCount: number;
    }>('/api/training-logs'),

  logTraining: (payload: {
    drill_id?: number | null;
    drill_title: string;
    category: string;
    duration_mins: number;
    notes?: string;
  }) =>
    apiFetch<{ log: TrainingLog }>('/api/training-logs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteTrainingLog: (id: number) =>
    apiFetch<{ deleted: boolean }>(`/api/training-logs/${id}`, {
      method: 'DELETE',
    }),

  getNutritionLogs: () =>
    apiFetch<{
      logs: NutritionLog[];
      todayMeals: NutritionLog[];
      todayTotals: NutritionTotals;
    }>('/api/nutrition-logs'),

  logMeal: (payload: {
    meal_timing: string;
    food_name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
  }) =>
    apiFetch<{ log: NutritionLog }>('/api/nutrition-logs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteNutritionLog: (id: number) =>
    apiFetch<{ deleted: boolean }>(`/api/nutrition-logs/${id}`, {
      method: 'DELETE',
    }),

  getHydration: () => apiFetch<{ date: string; glasses_count: number }>('/api/hydration'),

  updateHydration: (glasses_count: number) =>
    apiFetch<{ date: string; glasses_count: number }>('/api/hydration', {
      method: 'POST',
      body: JSON.stringify({ glasses_count }),
    }),

  getSchema: () => apiFetch<{ engine: string; tables: SchemaTable[] }>('/api/schema'),

  generatePlan: (payload: {
    focusSkill: string;
    availableMins: number;
    equipment: string;
  }) =>
    apiFetch<{ mode: 'plan'; plan: GeneratedPlan }>('/api/ai-coach', {
      method: 'POST',
      body: JSON.stringify({ mode: 'plan', ...payload }),
    }),

  generateCritique: () =>
    apiFetch<{ mode: 'critique'; critique: WeeklyCritique }>('/api/ai-coach', {
      method: 'POST',
      body: JSON.stringify({ mode: 'critique' }),
    }),
};
