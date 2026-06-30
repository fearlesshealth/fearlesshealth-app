import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/pool';
import { authenticate, authorize } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

/**
 * POST /api/appointments
 */
router.post('/', authenticate, authorize('admin', 'patient', 'nurse'), (req: AuthRequest, res: Response) => {
  const { patientId, doctorId, appointmentDate, reason } = req.body as {
    patientId: string; doctorId: string; appointmentDate: string; reason?: string;
  };

  if (!patientId || !doctorId || !appointmentDate) {
    res.status(400).json({ error: 'patientId, doctorId, and appointmentDate are required' });
    return;
  }

  try {
    if (req.user!.role === 'patient') {
      const selfCheck = pool.query('SELECT id FROM patients WHERE id = $1 AND user_id = $2', [patientId, req.user!.id]);
      if (selfCheck.rows.length === 0) { res.status(403).json({ error: 'You can only book appointments for yourself' }); return; }
    }

    const doctorCheck = pool.query('SELECT id FROM doctors WHERE id = $1', [doctorId]);
    if (doctorCheck.rows.length === 0) { res.status(404).json({ error: 'Doctor not found' }); return; }

    const conflict = pool.query(
      `SELECT id FROM appointments
       WHERE doctor_id = $1
         AND appointment_date BETWEEN datetime($2, '-30 minutes') AND datetime($2, '+30 minutes')
         AND status NOT IN ('cancelled')`,
      [doctorId, appointmentDate]
    );
    if (conflict.rows.length > 0) { res.status(409).json({ error: 'Doctor is not available at that time' }); return; }

    const id = uuidv4();
    pool.query(
      `INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, reason) VALUES ($1, $2, $3, $4, $5)`,
      [id, patientId, doctorId, appointmentDate, reason ?? null]
    );
    const appt = pool.query(`SELECT * FROM appointments WHERE id = $1`, [id]);
    res.status(201).json({ appointment: appt.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

/**
 * GET /api/appointments
 */
router.get('/', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { status, page = '1', limit = '20' } = req.query as Record<string, string>;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params: (string | number)[] = [];
  const conditions: string[] = [];

  let query = `
    SELECT a.*,
           p.first_name AS patient_first, p.last_name AS patient_last,
           d.first_name AS doctor_first,  d.last_name AS doctor_last, d.specialization
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    JOIN doctors  d ON a.doctor_id  = d.id
  `;

  try {
    if (user.role === 'patient') {
      const pat = pool.query<{ id: string }>('SELECT id FROM patients WHERE user_id = $1', [user.id]);
      if (pat.rows.length === 0) { res.json({ appointments: [] }); return; }
      conditions.push(`a.patient_id = $${params.length + 1}`); params.push(pat.rows[0].id);
    } else if (user.role === 'doctor') {
      const doc = pool.query<{ id: string }>('SELECT id FROM doctors WHERE user_id = $1', [user.id]);
      if (doc.rows.length === 0) { res.json({ appointments: [] }); return; }
      conditions.push(`a.doctor_id = $${params.length + 1}`); params.push(doc.rows[0].id);
    }

    if (status) { conditions.push(`a.status = $${params.length + 1}`); params.push(status); }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ` ORDER BY a.appointment_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const result = pool.query(query, params);
    res.json({ appointments: result.rows, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

/**
 * PATCH /api/appointments/:id/status
 */
router.patch('/:id/status', authenticate, authorize('admin', 'doctor', 'nurse'), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, notes } = req.body as { status: string; notes?: string };

  const validStatuses = ['scheduled', 'completed', 'cancelled', 'no_show'];
  if (!validStatuses.includes(status)) { res.status(400).json({ error: 'Invalid status' }); return; }

  try {
    pool.query(
      `UPDATE appointments SET status = $1, notes = COALESCE($2, notes), updated_at = datetime('now') WHERE id = $3`,
      [status, notes ?? null, id]
    );
    const result = pool.query(`SELECT * FROM appointments WHERE id = $1`, [id]);
    if (result.rows.length === 0) { res.status(404).json({ error: 'Appointment not found' }); return; }
    res.json({ appointment: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

export default router;
