import { Router, Response } from 'express';
import pool from '../db/pool';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.get('/', authenticate, (req: AuthRequest, res: Response) => {
  const { specialization, search, page = '1', limit = '20' } = req.query as Record<string, string>;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params: (string | number)[] = [];
  const conditions: string[] = [];

  let query = `SELECT id, first_name, last_name, specialization, phone, stellar_public_key, created_at FROM doctors`;
  if (specialization) { conditions.push(`specialization LIKE $${params.length + 1}`); params.push(`%${specialization}%`); }
  if (search) { conditions.push(`(first_name LIKE $${params.length + 1} OR last_name LIKE $${params.length + 1})`); params.push(`%${search}%`); }
  if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
  query += ` ORDER BY last_name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(parseInt(limit), offset);

  try {
    const result = pool.query(query, params);
    res.json({ doctors: result.rows, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

router.get('/:id', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const result = pool.query(
      `SELECT d.*, u.email FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'Doctor not found' }); return; }
    res.json({ doctor: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch doctor' });
  }
});

export default router;
