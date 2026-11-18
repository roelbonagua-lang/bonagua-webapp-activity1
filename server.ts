import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import { generateCustomPlan, generateWeeklyCritique } from './server/ai.ts';
import {
  calculateMacroTargets,
  db,
  type DrillRow,
  getLocalDateStr,
  hashPassword,
  type HydrationRow,
  initializeDatabase,
  type NutritionLogRow,
  toSafeUser,
  type TrainingLogRow,
  type UserRow,
  verifyPassword,
} from './server/db.ts';

initializeDatabase();

const app = express();
app.use(express.json({ limit: '1mb' }));

const TOKEN_SECRET =
  process.env.SESSION_SECRET ||
  crypto.createHash('sha256').update(process.cwd() + '_welhoop_secret').digest('hex');

interface AuthenticatedRequest extends Request {
  userId?: number;
}

function signToken(userId: number): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, iat: Date.now() })).toString(
    'base64url',
  );
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token: string): { uid: number } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payload)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      uid?: number;
    };
    return typeof parsed.uid === 'number' ? { uid: parsed.uid } : null;
  } catch {
    return null;
  }
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const verified = token ? verifyToken(token) : null;
  if (!verified) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(verified.uid) as
    | { id: number }
    | undefined;
  if (!userExists) {
    res.status(401).json({ error: 'Session expired. Please sign in again.' });
    return;
  }
  req.userId = verified.uid;
  next();
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'WelHoop' });
});

// Auth Routes (/api/auth/*)
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, position, height_cm, weight_kg, goal } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    position?: string;
    height_cm?: number;
    weight_kg?: number;
    goal?: string;
  };

  const cleanName = String(name || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPassword = String(password || '');

  if (!cleanName || !cleanEmail || cleanPassword.length < 6) {
    res.status(400).json({
      error: 'Name, valid email, and password (at least 6 characters) are required.',
    });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
  if (existing) {
    res.status(409).json({ error: 'An athlete account with this email already exists.' });
    return;
  }

  const safeWeight = Math.max(40, Math.min(180, Number(weight_kg) || 75));
  const safeHeight = Math.max(140, Math.min(235, Number(height_cm) || 180));
  const safePosition = String(position || 'Point Guard').trim() || 'Point Guard';
  const safeGoal = String(goal || 'Game-Day Stamina').trim() || 'Game-Day Stamina';
  const targets = calculateMacroTargets(safeWeight, safeGoal);
  const passwordHash = hashPassword(cleanPassword);

  const result = db
    .prepare(`
      INSERT INTO users (name, email, password_hash, position, height_cm, weight_kg, goal, daily_calorie_target, daily_protein_target, daily_skill_mins_target)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      cleanName,
      cleanEmail,
      passwordHash,
      safePosition,
      safeHeight,
      safeWeight,
      safeGoal,
      targets.daily_calorie_target,
      targets.daily_protein_target,
      60,
    );

  const user = db
    .prepare('SELECT * FROM users WHERE id = ?')
    .get(Number(result.lastInsertRowid)) as UserRow;
  const token = signToken(user.id);
  res.status(201).json({ token, user: toSafeUser(user) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPassword = String(password || '');

  if (!cleanEmail || !cleanPassword) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail) as
    | UserRow
    | undefined;
  if (!user || !verifyPassword(cleanPassword, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const token = signToken(user.id);
  res.json({ token, user: toSafeUser(user) });
});

app.post('/api/auth/demo', (_req, res) => {
  const user = db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get('demo@welhoop.app') as UserRow | undefined;
  if (!user) {
    res.status(500).json({ error: 'Demo athlete account is unavailable.' });
    return;
  }
  const token = signToken(user.id);
  res.json({ token, user: toSafeUser(user) });
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as
    | UserRow
    | undefined;
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }
  res.json({ user: toSafeUser(user) });
});

// Profile & Dynamic Macro Calculator
app.put('/api/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  const current = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as UserRow;
  const body = req.body as Partial<{
    name: string;
    position: string;
    height_cm: number;
    weight_kg: number;
    goal: string;
    daily_skill_mins_target: number;
  }>;

  const nextName = String(body.name ?? current.name).trim() || current.name;
  const nextPosition = String(body.position ?? current.position).trim() || current.position;
  const nextHeight = Math.max(140, Math.min(235, Number(body.height_cm ?? current.height_cm)));
  const nextWeight = Math.max(40, Math.min(180, Number(body.weight_kg ?? current.weight_kg)));
  const nextGoal = String(body.goal ?? current.goal).trim() || current.goal;
  const nextSkillTarget = Math.max(
    15,
    Math.min(240, Number(body.daily_skill_mins_target ?? current.daily_skill_mins_target)),
  );

  const targets = calculateMacroTargets(nextWeight, nextGoal);

  db.prepare(`
    UPDATE users
    SET name = ?, position = ?, height_cm = ?, weight_kg = ?, goal = ?,
        daily_calorie_target = ?, daily_protein_target = ?, daily_skill_mins_target = ?
    WHERE id = ?
  `).run(
    nextName,
    nextPosition,
    nextHeight,
    nextWeight,
    nextGoal,
    targets.daily_calorie_target,
    targets.daily_protein_target,
    nextSkillTarget,
    req.userId,
  );

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as UserRow;
  res.json({ user: toSafeUser(updated) });
});

// Drills Catalog
app.get('/api/drills', requireAuth, (req, res) => {
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  const drills =
    category && category !== 'All'
      ? (db
          .prepare('SELECT * FROM drills WHERE category = ? ORDER BY id ASC')
          .all(category) as DrillRow[])
      : (db.prepare('SELECT * FROM drills ORDER BY id ASC').all() as DrillRow[]);
  res.json({ drills });
});

// Training Logs & Weekly Consistency Streak
app.get('/api/training-logs', requireAuth, (req: AuthenticatedRequest, res) => {
  const logs = db
    .prepare('SELECT * FROM training_logs WHERE user_id = ? ORDER BY logged_at DESC, id DESC')
    .all(req.userId) as TrainingLogRow[];

  const today = getLocalDateStr(0);
  const todayMinutes = logs
    .filter((l) => l.logged_at.startsWith(today))
    .reduce((sum, l) => sum + l.duration_mins, 0);

  // Build 7-day court check-in tracker (oldest -> today)
  const weekDays: { date: string; label: string; minutes: number; completed: boolean }[] = [];
  for (let offset = -6; offset <= 0; offset++) {
    const dateStr = getLocalDateStr(offset);
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const label = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d);
    const mins = logs
      .filter((l) => l.logged_at.startsWith(dateStr))
      .reduce((sum, l) => sum + l.duration_mins, 0);
    weekDays.push({
      date: dateStr,
      label,
      minutes: mins,
      completed: mins > 0,
    });
  }

  let streakCount = 0;
  for (let i = weekDays.length - 1; i >= 0; i--) {
    if (weekDays[i].completed) {
      streakCount++;
    } else if (i < weekDays.length - 1) {
      break;
    }
  }

  res.json({ logs, todayMinutes, weekDays, streakCount });
});

app.post('/api/training-logs', requireAuth, (req: AuthenticatedRequest, res) => {
  const { drill_id, drill_title, category, duration_mins, notes } = req.body as {
    drill_id?: number | null;
    drill_title?: string;
    category?: string;
    duration_mins?: number;
    notes?: string;
  };

  const cleanTitle = String(drill_title || '').trim();
  const cleanCategory = String(category || 'Dribbling & Ball Handling').trim();
  const safeMins = Math.max(1, Math.min(240, Math.round(Number(duration_mins) || 0)));
  const cleanNotes = String(notes || '').trim().slice(0, 500);

  if (!cleanTitle || safeMins <= 0) {
    res.status(400).json({ error: 'Drill title and valid duration in minutes are required.' });
    return;
  }

  const nowLocal = `${getLocalDateStr(0)} ${new Date().toTimeString().slice(0, 8)}`;
  const result = db
    .prepare(`
      INSERT INTO training_logs (user_id, drill_id, drill_title, category, duration_mins, notes, logged_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      req.userId,
      drill_id ?? null,
      cleanTitle,
      cleanCategory,
      safeMins,
      cleanNotes,
      nowLocal,
    );

  const created = db
    .prepare('SELECT * FROM training_logs WHERE id = ?')
    .get(Number(result.lastInsertRowid)) as TrainingLogRow;
  res.status(201).json({ log: created });
});

app.delete('/api/training-logs/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const result = db
    .prepare('DELETE FROM training_logs WHERE id = ? AND user_id = ?')
    .run(id, req.userId);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Training log not found.' });
    return;
  }
  res.json({ deleted: true });
});

// Nutrition Logs
app.get('/api/nutrition-logs', requireAuth, (req: AuthenticatedRequest, res) => {
  const logs = db
    .prepare('SELECT * FROM nutrition_logs WHERE user_id = ? ORDER BY logged_at DESC, id DESC')
    .all(req.userId) as NutritionLogRow[];

  const today = getLocalDateStr(0);
  const todayMeals = logs.filter((l) => l.logged_at.startsWith(today));
  const todayTotals = todayMeals.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein_g: Math.round((acc.protein_g + item.protein_g) * 10) / 10,
      carbs_g: Math.round((acc.carbs_g + item.carbs_g) * 10) / 10,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0 },
  );

  res.json({ logs, todayMeals, todayTotals });
});

app.post('/api/nutrition-logs', requireAuth, (req: AuthenticatedRequest, res) => {
  const { meal_timing, food_name, calories, protein_g, carbs_g } = req.body as {
    meal_timing?: string;
    food_name?: string;
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
  };

  const cleanFood = String(food_name || '').trim();
  const cleanTiming = String(meal_timing || 'Daily Meals').trim();
  const safeCalories = Math.max(1, Math.min(5000, Math.round(Number(calories) || 0)));
  const safeProtein = Math.max(0, Math.min(400, Number(protein_g) || 0));
  const safeCarbs = Math.max(0, Math.min(600, Number(carbs_g) || 0));

  if (!cleanFood || safeCalories <= 0) {
    res.status(400).json({ error: 'Food name and positive calorie value are required.' });
    return;
  }

  const nowLocal = `${getLocalDateStr(0)} ${new Date().toTimeString().slice(0, 8)}`;
  const result = db
    .prepare(`
      INSERT INTO nutrition_logs (user_id, meal_timing, food_name, calories, protein_g, carbs_g, logged_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(req.userId, cleanTiming, cleanFood, safeCalories, safeProtein, safeCarbs, nowLocal);

  const created = db
    .prepare('SELECT * FROM nutrition_logs WHERE id = ?')
    .get(Number(result.lastInsertRowid)) as NutritionLogRow;
  res.status(201).json({ log: created });
});

app.delete('/api/nutrition-logs/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const result = db
    .prepare('DELETE FROM nutrition_logs WHERE id = ? AND user_id = ?')
    .run(id, req.userId);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Nutrition log not found.' });
    return;
  }
  res.json({ deleted: true });
});

// Hydration Tracker
app.get('/api/hydration', requireAuth, (req: AuthenticatedRequest, res) => {
  const today = getLocalDateStr(0);
  const row = db
    .prepare('SELECT * FROM daily_hydration WHERE user_id = ? AND date = ?')
    .get(req.userId, today) as HydrationRow | undefined;
  res.json({
    date: today,
    glasses_count: row ? row.glasses_count : 0,
  });
});

app.post('/api/hydration', requireAuth, (req: AuthenticatedRequest, res) => {
  const { glasses_count } = req.body as { glasses_count?: number };
  const safeCount = Math.max(0, Math.min(16, Math.round(Number(glasses_count) || 0)));
  const today = getLocalDateStr(0);

  db.prepare(`
    INSERT INTO daily_hydration (user_id, glasses_count, date)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, date) DO UPDATE SET glasses_count = excluded.glasses_count
  `).run(req.userId, safeCount, today);

  res.json({ date: today, glasses_count: safeCount });
});

// Live Database Schema Inspector (for Settings tab demo inspection)
app.get('/api/schema', requireAuth, (_req, res) => {
  const tableRows = db
    .prepare(
      "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC",
    )
    .all() as { name: string; sql: string }[];

  const tables = tableRows.map((t) => {
    const columns = db.prepare(`PRAGMA table_info(${t.name})`).all() as {
      cid: number;
      name: string;
      type: string;
      notnull: number;
      dflt_value: string | null;
      pk: number;
    }[];
    const countRow = db.prepare(`SELECT COUNT(*) as count FROM ${t.name}`).get() as {
      count: number;
    };
    return {
      name: t.name,
      rowCount: countRow.count,
      sql: t.sql,
      columns,
    };
  });

  res.json({ engine: 'SQLite (better-sqlite3)', tables });
});

// Gemini AI Coach Endpoint (/api/ai-coach)
app.post('/api/ai-coach', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as UserRow;
    const profile = toSafeUser(userRow);
    const { mode, focusSkill, availableMins, equipment } = req.body as {
      mode?: 'plan' | 'critique';
      focusSkill?: string;
      availableMins?: number;
      equipment?: string;
    };

    if (mode === 'critique') {
      const weekAgo = getLocalDateStr(-6);
      const recentTraining = db
        .prepare(
          'SELECT * FROM training_logs WHERE user_id = ? AND substr(logged_at, 1, 10) >= ? ORDER BY logged_at DESC',
        )
        .all(req.userId, weekAgo) as TrainingLogRow[];

      const recentNutrition = db
        .prepare(
          'SELECT * FROM nutrition_logs WHERE user_id = ? AND substr(logged_at, 1, 10) >= ? ORDER BY logged_at DESC',
        )
        .all(req.userId, weekAgo) as NutritionLogRow[];

      const hydrationRow = db
        .prepare('SELECT glasses_count FROM daily_hydration WHERE user_id = ? AND date = ?')
        .get(req.userId, getLocalDateStr(0)) as { glasses_count: number } | undefined;

      const critique = await generateWeeklyCritique({
        profile,
        recentTraining,
        recentNutrition,
        todayHydration: hydrationRow?.glasses_count ?? 0,
      });
      res.json({ mode: 'critique', critique });
      return;
    }

    const plan = await generateCustomPlan({
      profile,
      focusSkill: String(focusSkill || 'Weak / Left-Hand Mastery + Stamina'),
      availableMins: Math.max(15, Math.min(120, Number(availableMins) || 45)),
      equipment: String(equipment || '1 basketball, full hoop, cones'),
    });
    res.json({ mode: 'plan', plan });
  } catch (err) {
    console.error('AI Coach Error:', err);
    const message =
      err instanceof Error ? err.message : 'Unable to generate coaching insights right now.';
    res.status(500).json({ error: message });
  }
});

async function startServer() {
  const port = Number(process.env.PORT || 3000);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`WelHoop server running on http://0.0.0.0:${port}`);
  });
}

void startServer();
