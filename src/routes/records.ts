import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/pool';
import { authenticate, authorize } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

/**
 * POST /api/records
 */
router.post('/', authenticate, authorize('doctor'), (req: AuthRequest, res: Response) => {
  const { patientId, appointmentId, diagnosis, treatment, medications, notes, isSensitive } = req.body as {
    patientId: string; appointmentId?: string; diagnosis: string;
    treatment?: string; medications?: string; notes?: string; isSensitive?: boolean;
  };

  if (!patientId || !diagnosis) { res.status(400).json({ error: 'patientId and diagnosis are required' }); return; }

  try {
    const doctorResult = pool.query<{ id: string }>('SELECT id FROM doctors WHERE user_id = $1', [req.user!.id]);
    if (doctorResult.rows.length === 0) { res.status(403).json({ error: 'Doctor profile not found' }); return; }

    const id = uuidv4();
    pool.query(
      `INSERT INTO medical_records (id, patient_id, doctor_id, appointment_id, diagnosis, treatment, medications, notes, is_sensitive)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, patientId, doctorResult.rows[0].id, appointmentId ?? null, diagnosis, treatment ?? null, medications ?? null, notes ?? null, isSensitive ? 1 : 0]
    );
    const result = pool.query(`SELECT * FROM medical_records WHERE id = $1`, [id]);
    res.status(201).json({ record: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create medical record' });
  }
});

/**
 * GET /api/records/patient/:patientId
 */
router.get('/patient/:patientId', authenticate, (req: AuthRequest, res: Response) => {
  const { patientId } = req.params;
  const user = req.user!;

  try {
    if (user.role === 'patient') {
      const selfCheck = pool.query('SELECT id FROM patients WHERE id = $1 AND user_id = $2', [patientId, user.id]);
      if (selfCheck.rows.length === 0) { res.status(403).json({ error: 'Access denied' }); return; }
    } else if (user.role === 'doctor') {
      const consentCheck = pool.query(
        `SELECT id FROM record_access_tokens
         WHERE patient_id = $1
           AND doctor_id = (SELECT id FROM doctors WHERE user_id = $2)
           AND is_active = 1
           AND (expires_at IS NULL OR expires_at > datetime('now'))`,
        [patientId, user.id]
      );
      if (consentCheck.rows.length === 0) {
        res.status(403).json({ error: 'Access denied: patient consent required', hint: 'Request consent via /api/consent/grant' });
        return;
      }
    }

    const result = pool.query(
      `SELECT mr.*, d.first_name AS doctor_first, d.last_name AS doctor_last, d.specialization
       FROM medical_records mr
       JOIN doctors d ON mr.doctor_id = d.id
       WHERE mr.patient_id = $1 ORDER BY mr.created_at DESC`,
      [patientId]
    );
    res.json({ records: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

export default router;
