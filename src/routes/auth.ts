import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/pool';
import { generateKeypair, fundTestnetAccount } from '../stellar/stellarService';
import { UserRole } from '../types';

const router = Router();

interface RegisterBody {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  phone?: string;
  address?: string;
  specialization?: string;
  licenseNumber?: string;
}

/**
 * POST /api/auth/register
 */
router.post('/register', async (req: Request<{}, {}, RegisterBody>, res: Response) => {
  const { email, password, role, firstName, lastName, ...extra } = req.body;

  if (!email || !password || !role || !firstName || !lastName) {
    res.status(400).json({ error: 'Missing required fields' }); return;
  }
  const validRoles: UserRole[] = ['admin', 'doctor', 'nurse', 'patient'];
  if (!validRoles.includes(role)) { res.status(400).json({ error: 'Invalid role' }); return; }

  const client = pool.connect();
  try {
    client.query('BEGIN');

    const existing = client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      client.query('ROLLBACK');
      res.status(409).json({ error: 'Email already registered' }); return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const keypair = generateKeypair();
    const userId = uuidv4();

    client.query(
      `INSERT INTO users (id, email, password_hash, role, stellar_public_key) VALUES ($1,$2,$3,$4,$5)`,
      [userId, email, passwordHash, role, keypair.publicKey]
    );

    if (role === 'patient') {
      client.query(
        `INSERT INTO patients (id, user_id, first_name, last_name, date_of_birth, gender, blood_type, phone, address, stellar_public_key)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [uuidv4(), userId, firstName, lastName, extra.dateOfBirth ?? null, extra.gender ?? null, extra.bloodType ?? null, extra.phone ?? null, extra.address ?? null, keypair.publicKey]
      );
    } else if (role === 'doctor') {
      client.query(
        `INSERT INTO doctors (id, user_id, first_name, last_name, specialization, license_number, phone, stellar_public_key)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [uuidv4(), userId, firstName, lastName, extra.specialization ?? 'General Practice', extra.licenseNumber ?? `LIC-${Date.now()}`, extra.phone ?? null, keypair.publicKey]
      );
    }

    client.query('COMMIT');
    client.release();

    if (process.env.STELLAR_NETWORK === 'testnet') {
      fundTestnetAccount(keypair.publicKey).catch((err: Error) =>
        console.warn('Friendbot funding failed (non-critical):', err.message)
      );
    }

    const signOptions: SignOptions = { expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'] };
    const token = jwt.sign({ id: userId, email, role }, process.env.JWT_SECRET as string, signOptions);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: userId, email, role },
      stellar: {
        publicKey: keypair.publicKey,
        secretKey: keypair.secretKey,
        note: 'Save your Stellar secret key securely. It will not be shown again.',
      },
    });
  } catch (err) {
    client.query('ROLLBACK');
    client.release();
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req: Request<{}, {}, { email: string; password: string }>, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) { res.status(400).json({ error: 'Email and password required' }); return; }

  try {
    const result = pool.query<{ id: string; email: string; password_hash: string; role: UserRole; stellar_public_key: string | null }>(
      'SELECT id, email, password_hash, role, stellar_public_key FROM users WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0) { res.status(401).json({ error: 'Invalid credentials' }); return; }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) { res.status(401).json({ error: 'Invalid credentials' }); return; }

    const signOptions: SignOptions = { expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'] };
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET as string, signOptions);

    res.json({ token, user: { id: user.id, email: user.email, role: user.role, stellarPublicKey: user.stellar_public_key } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
