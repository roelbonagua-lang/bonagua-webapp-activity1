import { GoogleGenAI, Type } from '@google/genai';
import type { NutritionLogRow, SafeUser, TrainingLogRow } from './db.ts';

const MODEL_NAME = 'gemini-4-hydrogen';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured on the server. Add your Gemini API key in Settings > Secrets.',
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface GeneratedPlanResponse {
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

export interface WeeklyCritiqueResponse {
  headline: string;
  readinessVerdict: string;
  trainingSummary: string;
  nutritionSummary: string;
  strengths: string[];
  improvements: string[];
  nextSessionFocus: string;
}

export async function generateCustomPlan(params: {
  profile: SafeUser;
  focusSkill: string;
  availableMins: number;
  equipment: string;
}): Promise<GeneratedPlanResponse> {
  const { profile, focusSkill, availableMins, equipment } = params;
  const ai = getGeminiClient();

  const prompt = `
Create a practical, pro-level basketball practice session and athlete meal plan tailored for this player:
- Name: ${profile.name}
- Position: ${profile.position}
- Height: ${profile.height_cm} cm, Weight: ${profile.weight_kg} kg
- Primary Goal: ${profile.goal}
- Daily Calorie Target: ${profile.daily_calorie_target} kcal, Protein Target: ${profile.daily_protein_target} g
- Session Focus Skill: ${focusSkill}
- Available Time: ${availableMins} minutes
- Available Equipment: ${equipment}

Design drills whose durations sum neatly to roughly ${availableMins} minutes (including warm-up), give realistic budget-friendly pre-game and post-game meal recommendations aligned with their targets, and list 3 specific "Mistakes to Avoid" for injury prevention and skill habits.
  `.trim();

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      systemInstruction:
        'You are Coach WelHoop, an elite basketball skill development trainer and certified sports nutritionist. Give concise, actionable, realistic coaching with zero fluff.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          routineTitle: { type: Type.STRING },
          coachingNote: { type: Type.STRING },
          warmup: { type: Type.STRING },
          drills: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                category: { type: Type.STRING },
                durationMins: { type: Type.INTEGER },
                setsReps: { type: Type.STRING },
                focusCue: { type: Type.STRING },
              },
              required: ['title', 'category', 'durationMins', 'setsReps', 'focusCue'],
            },
          },
          mealPlan: {
            type: Type.OBJECT,
            properties: {
              preGame: {
                type: Type.OBJECT,
                properties: {
                  meal: { type: Type.STRING },
                  timing: { type: Type.STRING },
                  calories: { type: Type.INTEGER },
                  proteinG: { type: Type.INTEGER },
                  carbsG: { type: Type.INTEGER },
                },
                required: ['meal', 'timing', 'calories', 'proteinG', 'carbsG'],
              },
              postGame: {
                type: Type.OBJECT,
                properties: {
                  meal: { type: Type.STRING },
                  timing: { type: Type.STRING },
                  calories: { type: Type.INTEGER },
                  proteinG: { type: Type.INTEGER },
                  carbsG: { type: Type.INTEGER },
                },
                required: ['meal', 'timing', 'calories', 'proteinG', 'carbsG'],
              },
            },
            required: ['preGame', 'postGame'],
          },
          mistakesToAvoid: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: [
          'routineTitle',
          'coachingNote',
          'warmup',
          'drills',
          'mealPlan',
          'mistakesToAvoid',
        ],
      },
    },
  });

  const text = (response.text ?? '{}').trim();
  return JSON.parse(text) as GeneratedPlanResponse;
}

export async function generateWeeklyCritique(params: {
  profile: SafeUser;
  recentTraining: TrainingLogRow[];
  recentNutrition: NutritionLogRow[];
  todayHydration: number;
}): Promise<WeeklyCritiqueResponse> {
  const { profile, recentTraining, recentNutrition, todayHydration } = params;
  const ai = getGeminiClient();

  const totalMins = recentTraining.reduce((acc, row) => acc + row.duration_mins, 0);
  const categoryBreakdown: Record<string, number> = {};
  for (const row of recentTraining) {
    categoryBreakdown[row.category] = (categoryBreakdown[row.category] || 0) + row.duration_mins;
  }

  const totalCals = recentNutrition.reduce((acc, row) => acc + row.calories, 0);
  const totalProtein = recentNutrition.reduce((acc, row) => acc + row.protein_g, 0);
  const totalCarbs = recentNutrition.reduce((acc, row) => acc + row.carbs_g, 0);

  const prompt = `
Analyze this athlete's real database logs from the last 7 days and deliver a personalized coaching critique:

Athlete Profile:
- Name: ${profile.name} (${profile.position}, ${profile.height_cm} cm, ${profile.weight_kg} kg)
- Goal: ${profile.goal}
- Targets: ${profile.daily_skill_mins_target} skill mins/day, ${profile.daily_calorie_target} kcal/day, ${profile.daily_protein_target} g protein/day

Training Logs (past 7 days, ${recentTraining.length} sessions, ${totalMins} total mins):
- Category Breakdown (mins): ${JSON.stringify(categoryBreakdown)}
- Recent Entries: ${JSON.stringify(recentTraining.slice(0, 12).map((t) => ({ title: t.drill_title, category: t.category, mins: t.duration_mins, notes: t.notes, date: t.logged_at })))}

Nutrition Logs (past 7 days, ${recentNutrition.length} logged meals):
- Total Logged Calories: ${totalCals} kcal, Protein: ${Math.round(totalProtein)} g, Carbs: ${Math.round(totalCarbs)} g
- Recent Meals: ${JSON.stringify(recentNutrition.slice(0, 12).map((n) => ({ timing: n.meal_timing, food: n.food_name, kcal: n.calories, protein: n.protein_g, carbs: n.carbs_g, date: n.logged_at })))}

Today's Hydration: ${todayHydration} of 8 glasses.

Provide honest, specific feedback grounded in the exact numbers above—identifying any skill imbalances (e.g., missing weak-hand or vertical work), calorie/protein gaps, and concrete next-session adjustments.
  `.trim();

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      systemInstruction:
        'You are Coach WelHoop, an elite basketball skill trainer and sports dietitian. Base every critique point on the exact training and nutrition logs provided.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          headline: { type: Type.STRING },
          readinessVerdict: { type: Type.STRING },
          trainingSummary: { type: Type.STRING },
          nutritionSummary: { type: Type.STRING },
          strengths: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          improvements: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          nextSessionFocus: { type: Type.STRING },
        },
        required: [
          'headline',
          'readinessVerdict',
          'trainingSummary',
          'nutritionSummary',
          'strengths',
          'improvements',
          'nextSessionFocus',
        ],
      },
    },
  });

  const text = (response.text ?? '{}').trim();
  return JSON.parse(text) as WeeklyCritiqueResponse;
}
