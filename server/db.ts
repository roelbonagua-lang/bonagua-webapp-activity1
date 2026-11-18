import crypto from 'node:crypto';
import path from 'node:path';
import Database from 'better-sqlite3';

export interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  position: string;
  height_cm: number;
  weight_kg: number;
  goal: string;
  daily_calorie_target: number;
  daily_protein_target: number;
  daily_skill_mins_target: number;
  created_at: string;
}

export interface SafeUser {
  id: number;
  name: string;
  email: string;
  position: string;
  height_cm: number;
  weight_kg: number;
  goal: string;
  daily_calorie_target: number;
  daily_protein_target: number;
  daily_skill_mins_target: number;
  created_at: string;
}

export interface DrillRow {
  id: number;
  category: string;
  title: string;
  difficulty: string;
  duration_mins: number;
  sets_reps: string;
  instructions: string;
  donts_warning: string;
}

export interface TrainingLogRow {
  id: number;
  user_id: number;
  drill_id: number | null;
  drill_title: string;
  category: string;
  duration_mins: number;
  notes: string;
  logged_at: string;
}

export interface NutritionLogRow {
  id: number;
  user_id: number;
  meal_timing: string;
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  logged_at: string;
}

export interface HydrationRow {
  id: number;
  user_id: number;
  glasses_count: number;
  date: string;
}

const dbPath = path.resolve(process.cwd(), 'welhoop.db');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const keyBuffer = Buffer.from(keyHex, 'hex');
  const derivedBuffer = crypto.scryptSync(password, salt, 64);
  if (keyBuffer.length !== derivedBuffer.length) return false;
  return crypto.timingSafeEqual(keyBuffer, derivedBuffer);
}

export function toSafeUser(row: UserRow): SafeUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    position: row.position,
    height_cm: row.height_cm,
    weight_kg: row.weight_kg,
    goal: row.goal,
    daily_calorie_target: row.daily_calorie_target,
    daily_protein_target: row.daily_protein_target,
    daily_skill_mins_target: row.daily_skill_mins_target,
    created_at: row.created_at,
  };
}

export function calculateMacroTargets(weightKg: number, goal: string): {
  daily_calorie_target: number;
  daily_protein_target: number;
} {
  const safeWeight = Math.max(40, Math.min(180, Number(weightKg) || 75));
  const baseCalories = Math.round(safeWeight * 33);

  if (goal === 'Lean Muscle / Bulk') {
    return {
      daily_calorie_target: baseCalories + 350,
      daily_protein_target: Math.round(safeWeight * 2.1),
    };
  }
  if (goal === 'Cut Fat for Vertical & Speed') {
    return {
      daily_calorie_target: Math.max(1650, baseCalories - 400),
      daily_protein_target: Math.round(safeWeight * 2.2),
    };
  }
  // Game-Day Stamina
  return {
    daily_calorie_target: baseCalories + 150,
    daily_protein_target: Math.round(safeWeight * 1.8),
  };
}

export function getLocalDateStr(daysOffset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      position TEXT NOT NULL DEFAULT 'Point Guard',
      height_cm INTEGER NOT NULL DEFAULT 180,
      weight_kg REAL NOT NULL DEFAULT 75,
      goal TEXT NOT NULL DEFAULT 'Game-Day Stamina',
      daily_calorie_target INTEGER NOT NULL DEFAULT 2625,
      daily_protein_target INTEGER NOT NULL DEFAULT 135,
      daily_skill_mins_target INTEGER NOT NULL DEFAULT 60,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS drills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      duration_mins INTEGER NOT NULL,
      sets_reps TEXT NOT NULL,
      instructions TEXT NOT NULL,
      donts_warning TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS training_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      drill_id INTEGER REFERENCES drills(id) ON DELETE SET NULL,
      drill_title TEXT NOT NULL,
      category TEXT NOT NULL,
      duration_mins INTEGER NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      logged_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS nutrition_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      meal_timing TEXT NOT NULL,
      food_name TEXT NOT NULL,
      calories INTEGER NOT NULL,
      protein_g REAL NOT NULL,
      carbs_g REAL NOT NULL,
      logged_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS daily_hydration (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      glasses_count INTEGER NOT NULL DEFAULT 0,
      date TEXT NOT NULL,
      UNIQUE(user_id, date)
    );
  `);

  const drillCount = (db.prepare('SELECT COUNT(*) as count FROM drills').get() as { count: number })
    .count;

  if (drillCount === 0) {
    const seedDrills: Omit<DrillRow, 'id'>[] = [
      // 1. Dribbling & Ball Handling
      {
        category: 'Dribbling & Ball Handling',
        title: 'Two-Ball Pound & Alternating Rhythm',
        difficulty: 'Intermediate',
        duration_mins: 15,
        sets_reps: '4 sets × 45 sec work / 30 sec rest',
        instructions:
          'Stay in an athletic quarter-squat stance with chest up. Pound both basketballs simultaneously below knee height for 20 seconds, then switch to an alternating piston rhythm for 25 seconds while scanning an imaginary defender ahead.',
        donts_warning:
          'Do not stand upright with locked knees or slap the ball with your palms; use your fingertips and keep your eyes up off the floor.',
      },
      {
        category: 'Dribbling & Ball Handling',
        title: 'Pocket Pull & Retreats Against Pressure',
        difficulty: 'Pro',
        duration_mins: 15,
        sets_reps: '3 sets × 12 reps each hand',
        instructions:
          'Attack a cone at game speed, drop your hips into a hard stop, pull the ball cleanly into your hip pocket without carrying, execute a two-dribble retreat back, and explode into a crossover change of pace.',
        donts_warning:
          'Do not let your hand slide underneath the ball during the pocket pull (traveling/carry violation) or leave the ball exposed in front of your chest.',
      },
      {
        category: 'Dribbling & Ball Handling',
        title: 'Figure-Eight Stationary Control & Snaps',
        difficulty: 'Beginner',
        duration_mins: 10,
        sets_reps: '3 sets × 60 sec continuous',
        instructions:
          'Weave the ball tightly around your ankles in a fast figure-eight pattern using low, rapid fingertip taps. Reverse direction halfway through each set to build ambidextrous touch.',
        donts_warning:
          'Do not bend over from your lower back; hinge your hips back and keep your shoulders level to protect your spine.',
      },

      // 2. Weak / Left-Hand Mastery
      {
        category: 'Weak / Left-Hand Mastery',
        title: 'Left-Hand Mikan & Reverse Glass Finishes',
        difficulty: 'Beginner',
        duration_mins: 15,
        sets_reps: '4 sets × 20 makes (left hand only)',
        instructions:
          'Stand directly beneath the rim, step off your right foot, and kiss left-handed layups high off the backboard square. Finish sets 3 and 4 with reverse left-hand layups using the rim as protection.',
        donts_warning:
          'Do not guide the ball with your right hand or let the ball drop below your chin before releasing.',
      },
      {
        category: 'Weak / Left-Hand Mastery',
        title: 'Weak-Hand Full-Court Speed Dribble & Pull-Up',
        difficulty: 'Intermediate',
        duration_mins: 15,
        sets_reps: '6 full-court trips × left hand only',
        instructions:
          'Push the ball out in front of your left hip at a sprint from baseline to opposite three-point line, keeping your right arm active as a shield. Brake sharply at the elbow for a controlled left-hand float or reset.',
        donts_warning:
          'Do not look down at the ball while sprinting or dribble too close to your left shoe where it can kick off your foot.',
      },
      {
        category: 'Weak / Left-Hand Mastery',
        title: 'Off-Hand Tennis Ball Reaction Dribble',
        difficulty: 'Pro',
        duration_mins: 12,
        sets_reps: '4 sets × 40 sec',
        instructions:
          'Pound dribble hard with your weak hand while tossing and catching a tennis ball with your dominant hand at shoulder height. Progress to bouncing the tennis ball off a wall between dribbles.',
        donts_warning:
          'Do not sacrifice dribble velocity just to catch the tennis ball; keep every pound dribble crisp and forceful.',
      },

      // 3. Shooting & Mechanics
      {
        category: 'Shooting & Mechanics',
        title: 'One-Hand Form Shooting Progression',
        difficulty: 'Beginner',
        duration_mins: 15,
        sets_reps: '50 swishes from 5–12 feet',
        instructions:
          'Start 5 feet from the hoop with your guide hand behind your back. Load the ball into your shooting pocket, align elbow under wrist, and finish with a soft high arc and fingers pointing down inside the rim.',
        donts_warning:
          'Do not thumb-flick with your guide hand or rush your follow-through before the ball hits the rim.',
      },
      {
        category: 'Shooting & Mechanics',
        title: '5-Spot Catch-and-Shoot Hop Balance',
        difficulty: 'Intermediate',
        duration_mins: 20,
        sets_reps: '5 spots × 10 makes per spot (50 total)',
        instructions:
          'Spin the ball out to yourself at each three-point spot (corners, wings, top). Land on a balanced two-foot hop as you catch in a low stance, rise straight up in one fluid motion, and hold your gooseneck follow-through.',
        donts_warning:
          'Do not catch the ball standing straight up and then dip slowly; stay shot-ready with knees bent before the ball arrives.',
      },
      {
        category: 'Shooting & Mechanics',
        title: 'Relocation Off-Screen Footwork Drill',
        difficulty: 'Pro',
        duration_mins: 20,
        sets_reps: '4 sets × 8 makes per wing',
        instructions:
          'Sprint from the dunker spot around an imaginary pindown screen at the wing, square your hips mid-air on the turn, and fire within 0.6 seconds. Alternate curl cuts and fade cuts.',
        donts_warning:
          'Do not drift sideways on your jump shot unless intentionally fading; keep your shoulders square and landing spot consistent.',
      },

      // 4. Vertical Jump & Explosiveness
      {
        category: 'Vertical Jump & Explosiveness',
        title: 'Depth Drops & Reactive Pogo Hops',
        difficulty: 'Intermediate',
        duration_mins: 15,
        sets_reps: '3 sets × 5 depth drops + 10 pogo hops',
        instructions:
          'Step off a 12-inch wooden box and stick a silent, athletic landing with knees tracking over toes. Immediately transition into crisp ankle-stiff pogo hops focusing on minimal ground contact time.',
        donts_warning:
          'Do not perform max-effort plyometrics on concrete without 48-hour recovery, and never let your knees cave inward (valgus) on landing.',
      },
      {
        category: 'Vertical Jump & Explosiveness',
        title: 'Penultimate Step Approach Rim Touches',
        difficulty: 'Pro',
        duration_mins: 18,
        sets_reps: '4 sets × 4 max-intent jumps (2 min rest)',
        instructions:
          'Take a long, low penultimate stride into a quick block step (left-right or right-left) to convert horizontal speed into vertical lift. Swing both arms aggressively overhead toward the backboard.',
        donts_warning:
          'Do not train max-approach jumps when your legs feel heavy or fatigued; stop the set immediately once jump height visibly drops.',
      },
      {
        category: 'Vertical Jump & Explosiveness',
        title: 'Split-Squat Isometric & Explosive Box Jump',
        difficulty: 'Beginner',
        duration_mins: 15,
        sets_reps: '3 sets × 20s iso hold + 5 box jumps per leg',
        instructions:
          'Hold the bottom of a split squat for 20 seconds to activate glutes and quads, shake out for 15 seconds, then explode onto a soft plyo box landing lightly in a quarter-squat.',
        donts_warning:
          'Do not jump onto a box so high that you have to tuck your knees to your chest just to clear the edge; measure hip power, not hip mobility.',
      },

      // 5. Stamina & Court Conditioning
      {
        category: 'Stamina & Court Conditioning',
        title: '17s Sideline Conditioning Sprints',
        difficulty: 'Pro',
        duration_mins: 15,
        sets_reps: '4 sets × 17 sideline touches (60s rest)',
        instructions:
          'Sprint sideline-to-sideline 17 times in under 60 seconds per set. Drop your center of gravity cleanly on every line touch and accelerate out of low shin angles.',
        donts_warning:
          'Do not round out turns or skip touching the line with your foot; never sprint cold without a 5-minute dynamic hip and ankle warm-up.',
      },
      {
        category: 'Stamina & Court Conditioning',
        title: 'Fatigue Free-Throw Pressure Intervals',
        difficulty: 'Intermediate',
        duration_mins: 15,
        sets_reps: '5 rounds × 2 suicides + 2 free throws',
        instructions:
          'Run two full-court suicide shuttles, walk calmly to the free-throw line, take two deep nasal breaths to drop your heart rate, and sink two game-pressure free throws.',
        donts_warning:
          'Do not rush straight into your free-throw release while gasping; control your breathing cadence first so mechanics stay identical to practice.',
      },
      {
        category: 'Stamina & Court Conditioning',
        title: 'Defensive Slide Zig-Zag & Closeout Waves',
        difficulty: 'Beginner',
        duration_mins: 12,
        sets_reps: '4 sets × 45 sec continuous slides',
        instructions:
          'Stay in a wide, low defensive stance sliding diagonally across the lane without crossing your feet, then sprint forward into a high-hand choppy-step closeout at the three-point line.',
        donts_warning:
          'Do not click your heels together or cross your ankles during slides, and never jump forward out of control on a closeout.',
      },
    ];

    const insertDrill = db.prepare(`
      INSERT INTO drills (category, title, difficulty, duration_mins, sets_reps, instructions, donts_warning)
      VALUES (@category, @title, @difficulty, @duration_mins, @sets_reps, @instructions, @donts_warning)
    `);
    const insertMany = db.transaction((items: Omit<DrillRow, 'id'>[]) => {
      for (const item of items) insertDrill.run(item);
    });
    insertMany(seedDrills);
  }

  // Seed Demo Athlete if missing
  const demoEmail = 'demo@welhoop.app';
  const existingDemo = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get(demoEmail) as { id: number } | undefined;

  if (!existingDemo) {
    const targets = calculateMacroTargets(79, 'Game-Day Stamina');
    const demoPass = hashPassword('welhoop-demo');
    const userResult = db
      .prepare(`
        INSERT INTO users (name, email, password_hash, position, height_cm, weight_kg, goal, daily_calorie_target, daily_protein_target, daily_skill_mins_target)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        'Marcus Vance',
        demoEmail,
        demoPass,
        'Point Guard',
        185,
        79,
        'Game-Day Stamina',
        targets.daily_calorie_target,
        targets.daily_protein_target,
        60,
      );

    const demoUserId = Number(userResult.lastInsertRowid);
    const allDrills = db.prepare('SELECT id, title, category, duration_mins FROM drills').all() as Pick<
      DrillRow,
      'id' | 'title' | 'category' | 'duration_mins'
    >[];

    const findDrill = (idx: number) => allDrills[idx % allDrills.length];

    const insertTraining = db.prepare(`
      INSERT INTO training_logs (user_id, drill_id, drill_title, category, duration_mins, notes, logged_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const seedTrainingOffsets = [
      { days: -5, idx: 0, mins: 20, notes: 'Felt crisp with left-right crossover cadence.' },
      { days: -4, idx: 3, mins: 25, notes: 'Left-hand Mikan finishing 20/24 clean.' },
      { days: -3, idx: 6, mins: 30, notes: 'Locked in high-arc release from midrange.' },
      { days: -2, idx: 9, mins: 25, notes: 'Soft landings on hardwood, zero knee valgus.' },
      { days: -1, idx: 12, mins: 35, notes: '4 sets under 57s each. Conditioning improving.' },
      { days: 0, idx: 1, mins: 20, notes: 'Morning ball-handling pocket pulls.' },
      { days: 0, idx: 7, mins: 25, notes: '50 corner & wing threes at game hop speed.' },
    ];

    for (const entry of seedTrainingOffsets) {
      const drill = findDrill(entry.idx);
      const dateStr = `${getLocalDateStr(entry.days)} 09:30:00`;
      insertTraining.run(
        demoUserId,
        drill.id,
        drill.title,
        drill.category,
        entry.mins,
        entry.notes,
        dateStr,
      );
    }

    const insertMeal = db.prepare(`
      INSERT INTO nutrition_logs (user_id, meal_timing, food_name, calories, protein_g, carbs_g, logged_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const todayPrefix = getLocalDateStr(0);
    insertMeal.run(
      demoUserId,
      'Pre-Game Fuel',
      'Oatmeal with Sliced Banana & Honey',
      380,
      11,
      68,
      `${todayPrefix} 07:45:00`,
    );
    insertMeal.run(
      demoUserId,
      'Daily Meals',
      'Chicken Breast & Steamed Rice Bowl',
      590,
      46,
      64,
      `${todayPrefix} 12:30:00`,
    );
    insertMeal.run(
      demoUserId,
      'Post-Game Recovery',
      '3 Boiled Eggs & Roasted Sweet Potato',
      410,
      22,
      42,
      `${todayPrefix} 16:15:00`,
    );

    db.prepare(`
      INSERT INTO daily_hydration (user_id, glasses_count, date)
      VALUES (?, ?, ?)
    `).run(demoUserId, 5, todayPrefix);
  }
}
