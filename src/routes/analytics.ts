import { Router, Response } from 'express';
import pool from '../db/pool';
import { authenticate, authorize } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

/**
 * GET /api/analytics/summary
 * Returns impact metrics for the dashboard and pitch deck
 */
router.get('/summary', authenticate, authorize('admin', 'doctor'), (_req: AuthRequest, res: Response) => {
  try {
    const patients   = pool.query<{ c: number }>('SELECT COUNT(*) as c FROM patients', []);
    const doctors    = pool.query<{ c: number }>('SELECT COUNT(*) as c FROM doctors', []);
    const appts      = pool.query<{ c: number }>('SELECT COUNT(*) as c FROM appointments', []);
    const completed  = pool.query<{ c: number }>("SELECT COUNT(*) as c FROM appointments WHERE status='completed'", []);
    const scheduled  = pool.query<{ c: number }>("SELECT COUNT(*) as c FROM appointments WHERE status='scheduled'", []);
    const cancelled  = pool.query<{ c: number }>("SELECT COUNT(*) as c FROM appointments WHERE status='cancelled'", []);
    const records    = pool.query<{ c: number }>('SELECT COUNT(*) as c FROM medical_records', []);
    const invoices   = pool.query<{ c: number }>('SELECT COUNT(*) as c FROM invoices', []);
    const paidInv    = pool.query<{ c: number; total: number }>("SELECT COUNT(*) as c, COALESCE(SUM(amount_usd),0) as total FROM invoices WHERE status='paid'", []);
    const pendingInv = pool.query<{ c: number; total: number }>("SELECT COUNT(*) as c, COALESCE(SUM(amount_usd),0) as total FROM invoices WHERE status='pending'", []);
    const xlmVol     = pool.query<{ total: number }>("SELECT COALESCE(SUM(amount_xlm),0) as total FROM stellar_transactions WHERE status='success'", []);
    const consentGr  = pool.query<{ c: number }>("SELECT COUNT(*) as c FROM record_access_tokens WHERE is_active=1", []);

    // Appointments by specialization
    const bySpec = pool.query<{ specialization: string; c: number }>(
      `SELECT d.specialization, COUNT(*) as c
       FROM appointments a JOIN doctors d ON a.doctor_id = d.id
       GROUP BY d.specialization ORDER BY c DESC`, []
    );

    // Monthly appointments (last 6 months)
    const monthly = pool.query<{ month: string; c: number }>(
      `SELECT strftime('%Y-%m', appointment_date) as month, COUNT(*) as c
       FROM appointments
       GROUP BY month ORDER BY month DESC LIMIT 6`, []
    );

    // Waitlist count
    let waitlistCount = 0;
    try {
      const wl = pool.query<{ c: number }>('SELECT COUNT(*) as c FROM waitlist', []);
      waitlistCount = Number(wl.rows[0]?.c ?? 0);
    } catch { /* table may not exist yet */ }

    res.json({
      overview: {
        patients:   Number(patients.rows[0]?.c ?? 0),
        doctors:    Number(doctors.rows[0]?.c ?? 0),
        appointments: Number(appts.rows[0]?.c ?? 0),
        records:    Number(records.rows[0]?.c ?? 0),
        waitlist:   waitlistCount,
      },
      appointments: {
        total:     Number(appts.rows[0]?.c ?? 0),
        completed: Number(completed.rows[0]?.c ?? 0),
        scheduled: Number(scheduled.rows[0]?.c ?? 0),
        cancelled: Number(cancelled.rows[0]?.c ?? 0),
      },
      billing: {
        totalInvoices:  Number(invoices.rows[0]?.c ?? 0),
        paidCount:      Number(paidInv.rows[0]?.c ?? 0),
        paidUsd:        Number(paidInv.rows[0]?.total ?? 0),
        pendingCount:   Number(pendingInv.rows[0]?.c ?? 0),
        pendingUsd:     Number(pendingInv.rows[0]?.total ?? 0),
        xlmVolume:      Number(xlmVol.rows[0]?.total ?? 0),
      },
      consent: {
        activeTokens: Number(consentGr.rows[0]?.c ?? 0),
      },
      bySpecialization: bySpec.rows.map(r => ({ name: r.specialization, appointments: Number(r.c) })),
      monthlyAppointments: monthly.rows.reverse().map(r => ({ month: r.month, count: Number(r.c) })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
