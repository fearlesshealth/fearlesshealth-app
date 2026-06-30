import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/pool';

const router = Router();

/**
 * POST /api/waitlist
 * Public — no auth required
 */
router.post('/', (req: Request, res: Response) => {
  const { email, name, organisation, role } = req.body as {
    email: string; name?: string; organisation?: string; role?: string;
  };

  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'Valid email required' });
    return;
  }

  try {
    // Ensure table exists
    pool.query(`CREATE TABLE IF NOT EXISTS waitlist (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      organisation TEXT,
      role TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`, []);

    const existing = pool.query('SELECT id FROM waitlist WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      res.json({ message: "You're already on the list!", position: existing.rows.length });
      return;
    }

    pool.query(
      `INSERT INTO waitlist (id, email, name, organisation, role) VALUES ($1,$2,$3,$4,$5)`,
      [uuidv4(), email, name ?? null, organisation ?? null, role ?? null]
    );

    const count = pool.query<{ c: number }>('SELECT COUNT(*) as c FROM waitlist', []);
    const position = Number(count.rows[0]?.c ?? 1);

    res.status(201).json({
      message: "You're on the list!",
      position,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to join waitlist' });
  }
});

/**
 * GET /api/waitlist/count — public count for social proof
 */
router.get('/count', (_req, res: Response) => {
  try {
    pool.query(`CREATE TABLE IF NOT EXISTS waitlist (
      id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT,
      organisation TEXT, role TEXT, created_at TEXT DEFAULT (datetime('now'))
    )`, []);
    const result = pool.query<{ c: number }>('SELECT COUNT(*) as c FROM waitlist', []);
    res.json({ count: Number(result.rows[0]?.c ?? 0) });
  } catch {
    res.json({ count: 0 });
  }
});

/**
 * GET /api/waitlist — admin only
 */
router.get('/', (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (!auth) { res.status(401).json({ error: 'Unauthorized' }); return; }
  try {
    pool.query(`CREATE TABLE IF NOT EXISTS waitlist (
      id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT,
      organisation TEXT, role TEXT, created_at TEXT DEFAULT (datetime('now'))
    )`, []);
    const result = pool.query('SELECT * FROM waitlist ORDER BY created_at DESC', []);
    res.json({ signups: result.rows, count: result.rows.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch waitlist' });
  }
});

export default router;
