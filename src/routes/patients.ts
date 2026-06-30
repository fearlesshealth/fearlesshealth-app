import { Router, Response } from 'express';
import pool from '../db/pool';
import { authenticate, authorize } from '../middleware/auth';
import { verifyAccessToken } from '../stellar/stellarService';
import { AuthRequest } from '../types';

const router = Router();

/**
 * GET /api/patients
 */
router.get('/', authenticate, authorize('admin', 'doctor', 'nurse'), (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '20', search } = req.query as Record<string, string>;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params: (string | number)[] = [];
  let query = `SELECT id, first_name, last_name, date_of_birth, gender, blood_type, phone, stellar_public_key, created_at FROM patients`;

  if (search) { query += ` WHERE (first_name LIKE $1 OR last_name LIKE $1)`; params.push(`%${search}%`); }
  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(parseInt(limit), offset);

  try {
    const result = pool.query(query, params);
    res.json({ patients: result.rows, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

/**
 * GET /api/patients/:id
 */
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;

  try {
    const result = pool.query<{ id: string; stellar_public_key: string | null; email?: string }>(
      `SELECT p.*, u.email FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = $1`,
      [id]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'Patient not found' }); return; }
    const patient = result.rows[0];

    if (user.role === 'patient') {
      const selfCheck = pool.query('SELECT id FROM patients WHERE id = $1 AND user_id = $2', [id, user.id]);
      if (selfCheck.rows.length === 0) { res.status(403).json({ error: 'Access denied' }); return; }
    } else if (user.role === 'doctor') {
      const doctorResult = pool.query<{ stellar_public_key: string | null }>('SELECT stellar_public_key FROM doctors WHERE user_id = $1', [user.id]);
      if (doctorResult.rows.length === 0) { res.status(403).json({ error: 'Doctor profile not found' }); return; }

      const doctorKey = doctorResult.rows[0].stellar_public_key;
      const patientKey = patient.stellar_public_key;
      let hasAccess = false;

      if (doctorKey && patientKey) {
        const assetCode = `PAT${id.replace(/-/g, '').substring(0, 9).toUpperCase()}`.substring(0, 12);
        hasAccess = await verifyAccessToken(doctorKey, patientKey, assetCode);
      }

      if (!hasAccess) {
        const consentCheck = pool.query(
          `SELECT id FROM record_access_tokens
           WHERE patient_id = $1
             AND doctor_id = (SELECT id FROM doctors WHERE user_id = $2)
             AND is_active = 1
             AND (expires_at IS NULL OR expires_at > datetime('now'))`,
          [id, user.id]
        );
        if (consentCheck.rows.length === 0) {
          res.status(403).json({ error: 'Access denied: patient consent required', hint: 'Request record access from the patient' });
          return;
        }
      }
    }

    res.json({ patient });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

/**
 * PUT /api/patients/:id
 */
router.put('/:id', authenticate, authorize('admin', 'patient'), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { firstName, lastName, phone, address, emergencyContactName, emergencyContactPhone } = req.body as Record<string, string | undefined>;

  try {
    if (req.user!.role === 'patient') {
      const selfCheck = pool.query('SELECT id FROM patients WHERE id = $1 AND user_id = $2', [id, req.user!.id]);
      if (selfCheck.rows.length === 0) { res.status(403).json({ error: 'Access denied' }); return; }
    }

    pool.query(
      `UPDATE patients SET
         first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name),
         phone = COALESCE($3, phone), address = COALESCE($4, address),
         emergency_contact_name = COALESCE($5, emergency_contact_name),
         emergency_contact_phone = COALESCE($6, emergency_contact_phone),
         updated_at = datetime('now')
       WHERE id = $7`,
      [firstName, lastName, phone, address, emergencyContactName, emergencyContactPhone, id]
    );
    const result = pool.query(`SELECT * FROM patients WHERE id = $1`, [id]);
    if (result.rows.length === 0) { res.status(404).json({ error: 'Patient not found' }); return; }
    res.json({ patient: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

export default router;
