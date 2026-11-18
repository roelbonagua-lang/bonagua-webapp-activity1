export type AthleteGoal =
  | 'Lean Muscle / Bulk'
  | 'Cut Fat for Vertical & Speed'
  | 'Game-Day Stamina';

export type NavTab = 'dashboard' | 'skills' | 'nutrition' | 'coach' | 'settings';

export interface AthleteUser {
  id: number;
  name: string;
  email: string;
  position: string;
  height_cm: number;
  weight_kg: number;
  goal: AthleteGoal | string;
  daily_calorie_target: number;
  daily_protein_target: number;
  daily_skill_mins_target: number;
  created_at: string;
}

export interface Drill {
  id: number;
  category: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Pro' | string;
  duration_mins: number;
  sets_reps: string;
  instructions: string;
  donts_warning: string;
}

export interface TrainingLog {
  id: number;
  user_id: number;
  drill_id: number | null;
  drill_title: string;
  category: string;
  duration_mins: number;
  notes: string;
  logged_at: string;
}

export interface WeekDayCheckIn {
  date: string;
  label: string;
  minutes: number;
  completed: boolean;
}

export interface NutritionLog {
  id: number;
  user_id: number;
  meal_timing: 'Pre-Game Fuel' | 'Post-Game Recovery' | 'Daily Meals' | string;
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  logged_at: string;
}

export interface NutritionTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
}

export interface SchemaColumn {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

export interface SchemaTable {
  name: string;
  rowCount: number;
  sql: string;
  columns: SchemaColumn[];
}

export interface GeneratedPlan {
  routineTitle: string;
  coachingNote: string;
  warmup: string;
  drills: {
    title: string;
    category: string;
    durationMins: number;
    setsReps: string;
    focusCue: string;
  }[];
  mealPlan: {
    preGame: {
      meal: string;
      timing: string;
      calories: number;
      proteinG: number;
      carbsG: number;
    };
    postGame: {
      meal: string;
      timing: string;
      calories: number;
      proteinG: number;
      carbsG: number;
    };
  };
  mistakesToAvoid: string[];
}

export interface WeeklyCritique {
  headline: string;
  readinessVerdict: string;
  trainingSummary: string;
  nutritionSummary: string;
  strengths: string[];
  improvements: string[];
  nextSessionFocus: string;
}
