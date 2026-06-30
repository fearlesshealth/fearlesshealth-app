import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import pool, { initSchema } from './db/pool';

import authRoutes from './routes/auth';
import patientRoutes from './routes/patients';
import doctorRoutes from './routes/doctors';
import appointmentRoutes from './routes/appointments';
import recordRoutes from './routes/records';
import billingRoutes from './routes/billing';
import consentRoutes from './routes/consent';
import waitlistRoutes from './routes/waitlist';
import analyticsRoutes from './routes/analytics';

const app = express();
const PORT = process.env.PORT ?? 5000;
const IS_PROD = process.env.NODE_ENV === 'production';

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (!IS_PROD) {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    project: 'FearlessHealth',
    version: '1.0.0',
    blockchain: `Stellar ${process.env.STELLAR_NETWORK ?? 'testnet'}`,
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/patients',    patientRoutes);
app.use('/api/doctors',     doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/records',     recordRoutes);
app.use('/api/billing',     billingRoutes);
app.use('/api/consent',     consentRoutes);
app.use('/api/waitlist',    waitlistRoutes);
app.use('/api/analytics',   analyticsRoutes);

// ─── Serve built React frontend in production ─────────────────────────────────
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (IS_PROD && fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // All non-API routes → React app
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else if (!IS_PROD) {
  // Dev: show API reference page at root
  app.get('/', (_req: Request, res: Response) => {
    res.send(devLandingHtml());
  });
}

// ─── Error Handlers ───────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  console.log('📦 Initialising database...');
  initSchema();

  const existing = pool.query<{ id: string }>('SELECT id FROM users WHERE role = $1', ['admin']);
  if (existing.rows.length === 0) {
    const passwordHash = await bcrypt.hash('admin123', 12);
    pool.query(`INSERT INTO users (id, email, password_hash, role) VALUES ($1,$2,$3,$4)`,
      [uuidv4(), 'admin@hospital.local', passwordHash, 'admin']);
    console.log('🌱 Seeded default admin  →  admin@hospital.local / admin123');
  }

  app.listen(PORT, () => {
    console.log(`\n🏥  FearlessHealth`);
    console.log(`🌐  http://localhost:${PORT}`);
    console.log(`⭐  Stellar: ${process.env.STELLAR_NETWORK ?? 'testnet'}`);
    console.log(`🗄️   DB: SQLite (hospital.db)\n`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});

export default app;

// ─── Dev landing HTML ─────────────────────────────────────────────────────────
function devLandingHtml(): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
  <title>FearlessHealth</title>
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem}.card{background:#1e293b;border-radius:1rem;padding:2.5rem;max-width:600px;width:100%}h1{font-size:1.6rem;font-weight:700;color:#f8fafc;margin-bottom:.5rem}.sub{color:#94a3b8;margin-bottom:1.5rem}.green{color:#22c55e}.purple{color:#a78bfa}code{background:#0f172a;padding:.2rem .4rem;border-radius:4px;font-family:monospace;font-size:.85rem}</style>
  </head><body><div class="card">
  <h1>🏥 FearlessHealth</h1>
  <p class="sub">API running · <span class="green">●</span> SQLite · <span class="purple">⭐ Stellar testnet</span></p>
  <p>Frontend dev server: <code>http://localhost:5173</code></p>
  <p style="margin-top:1rem">API health: <code>GET /health</code></p>
  <p style="margin-top:.5rem">Default admin: <code>admin@hospital.local / admin123</code></p>
  </div></body></html>`;
}
