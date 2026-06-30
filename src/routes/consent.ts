import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/pool';
import { authenticate, authorize } from '../middleware/auth';
import { issueAccessToken, revokeAccessToken, verifyAccessToken } from '../stellar/stellarService';
import { AuthRequest } from '../types';

const router = Router();

function getAssetCode(patientId: string): string {
  return `PAT${patientId.replace(/-/g, '').substring(0, 9).toUpperCase()}`.substring(0, 12);
}

/**
 * POST /api/consent/grant
 */
router.post('/grant', authenticate, authorize('patient'), async (req: AuthRequest, res: Response) => {
  const { doctorId, patientStellarSecret, expiresAt } = req.body as { doctorId: string; patientStellarSecret: string; expiresAt?: string };

  if (!doctorId || !patientStellarSecret) { res.status(400).json({ error: 'doctorId and patientStellarSecret are required' }); return; }

  try {
    const patResult = pool.query<{ id: string; stellar_public_key: string | null }>('SELECT id, stellar_public_key FROM patients WHERE user_id = $1', [req.user!.id]);
    if (patResult.rows.length === 0) { res.status(404).json({ error: 'Patient profile not found' }); return; }
    const patient = patResult.rows[0];

    const docResult = pool.query<{ id: string; stellar_public_key: string | null }>('SELECT id, stellar_public_key FROM doctors WHERE id = $1', [doctorId]);
    if (docResult.rows.length === 0) { res.status(404).json({ error: 'Doctor not found' }); return; }
    const doctor = docResult.rows[0];

    if (!doctor.stellar_public_key) { res.status(400).json({ error: 'Doctor does not have a Stellar account' }); return; }

    const assetCode = getAssetCode(patient.id);
    let stellarTx = null;
    try {
      stellarTx = await issueAccessToken(patientStellarSecret, doctor.stellar_public_key, assetCode);
    } catch (stellarErr) {
      console.warn('Stellar token issuance failed, recording consent in DB only:', (stellarErr as Error).message);
    }

    const consentId = uuidv4();
    pool.query(
      `INSERT OR IGNORE INTO record_access_tokens (id, patient_id, doctor_id, stellar_asset_code, stellar_asset_issuer, expires_at, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,1)`,
      [consentId, patient.id, doctorId, assetCode, patient.stellar_public_key, expiresAt ?? null]
    );
    const consentResult = pool.query(`SELECT * FROM record_access_tokens WHERE id = $1`, [consentId]);

    res.status(201).json({
      message: 'Access granted successfully',
      consent: consentResult.rows[0] ?? { patientId: patient.id, doctorId, assetCode },
      stellar: stellarTx
        ? { txHash: stellarTx.hash, assetCode: stellarTx.assetCode, explorer: `https://stellar.expert/explorer/testnet/tx/${stellarTx.hash}` }
        : { note: 'Consent recorded in DB (Stellar tx pending doctor trustline setup)' },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to grant access' });
  }
});

/**
 * POST /api/consent/revoke
 */
router.post('/revoke', authenticate, authorize('patient'), async (req: AuthRequest, res: Response) => {
  const { doctorId, patientStellarSecret } = req.body as { doctorId: string; patientStellarSecret?: string };

  if (!doctorId) { res.status(400).json({ error: 'doctorId is required' }); return; }

  try {
    const patResult = pool.query<{ id: string; stellar_public_key: string | null }>('SELECT id, stellar_public_key FROM patients WHERE user_id = $1', [req.user!.id]);
    if (patResult.rows.length === 0) { res.status(404).json({ error: 'Patient profile not found' }); return; }
    const patient = patResult.rows[0];

    const docResult = pool.query<{ id: string; stellar_public_key: string | null }>('SELECT id, stellar_public_key FROM doctors WHERE id = $1', [doctorId]);
    if (docResult.rows.length === 0) { res.status(404).json({ error: 'Doctor not found' }); return; }
    const doctor = docResult.rows[0];

    pool.query(`UPDATE record_access_tokens SET is_active = 0, revoked_at = datetime('now') WHERE patient_id = $1 AND doctor_id = $2 AND is_active = 1`, [patient.id, doctorId]);

    let stellarResult: { hash: string; revoked: boolean } | null = null;
    if (patientStellarSecret && doctor.stellar_public_key) {
      try {
        stellarResult = await revokeAccessToken(patientStellarSecret, doctor.stellar_public_key, getAssetCode(patient.id));
      } catch (e) {
        console.warn('Stellar clawback failed:', (e as Error).message);
      }
    }

    res.json({ message: 'Access revoked', stellar: stellarResult ? { txHash: stellarResult.hash } : { note: 'DB revocation applied' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to revoke access' });
  }
});

/**
 * GET /api/consent/verify
 */
router.get('/verify', authenticate, async (req: AuthRequest, res: Response) => {
  const { patientId, doctorId } = req.query as { patientId?: string; doctorId?: string };
  if (!patientId || !doctorId) { res.status(400).json({ error: 'patientId and doctorId are required' }); return; }

  try {
    const dbCheck = pool.query<{ is_active: number; expires_at: string | null }>(
      `SELECT is_active, expires_at FROM record_access_tokens WHERE patient_id = $1 AND doctor_id = $2 ORDER BY granted_at DESC LIMIT 1`,
      [patientId, doctorId]
    );
    const dbAccess = dbCheck.rows.length > 0 && dbCheck.rows[0].is_active === 1 &&
      (dbCheck.rows[0].expires_at === null || new Date(dbCheck.rows[0].expires_at) > new Date());

    const patKey = pool.query<{ stellar_public_key: string | null }>('SELECT stellar_public_key FROM patients WHERE id = $1', [patientId]).rows[0]?.stellar_public_key;
    const docKey = pool.query<{ stellar_public_key: string | null }>('SELECT stellar_public_key FROM doctors WHERE id = $1', [doctorId]).rows[0]?.stellar_public_key;

    let stellarAccess = false;
    if (patKey && docKey) stellarAccess = await verifyAccessToken(docKey, patKey, getAssetCode(patientId));

    res.json({ hasAccess: dbAccess || stellarAccess, dbConsent: dbAccess, stellarToken: stellarAccess });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to verify access' });
  }
});

/**
 * GET /api/consent/my-consents
 */
router.get('/my-consents', authenticate, authorize('patient'), (req: AuthRequest, res: Response) => {
  try {
    const pat = pool.query<{ id: string }>('SELECT id FROM patients WHERE user_id = $1', [req.user!.id]);
    if (pat.rows.length === 0) { res.json({ consents: [] }); return; }

    const result = pool.query(
      `SELECT rat.*, d.first_name, d.last_name, d.specialization
       FROM record_access_tokens rat JOIN doctors d ON rat.doctor_id = d.id
       WHERE rat.patient_id = $1 ORDER BY rat.granted_at DESC`,
      [pat.rows[0].id]
    );
    res.json({ consents: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch consents' });
  }
});

export default router;
