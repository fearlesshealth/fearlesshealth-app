import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/pool';
import { authenticate, authorize } from '../middleware/auth';
import { sendPayment, usdToXlm, getAccountBalances } from '../stellar/stellarService';
import { AuthRequest, InvoiceRow } from '../types';

const router = Router();

/**
 * POST /api/billing/invoice
 */
router.post('/invoice', authenticate, authorize('admin', 'nurse'), async (req: AuthRequest, res: Response) => {
  const { patientId, appointmentId, amountUsd, description, dueDate } = req.body as {
    patientId: string; appointmentId?: string; amountUsd: number; description?: string; dueDate?: string;
  };

  if (!patientId || !amountUsd) { res.status(400).json({ error: 'patientId and amountUsd are required' }); return; }

  try {
    const { xlmAmount, xlmPriceUsd } = await usdToXlm(amountUsd);
    const id = uuidv4();
    pool.query(
      `INSERT INTO invoices (id, patient_id, appointment_id, amount_usd, amount_xlm, description, due_date) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [id, patientId, appointmentId ?? null, amountUsd, xlmAmount, description ?? null, dueDate ?? null]
    );
    const result = pool.query(`SELECT * FROM invoices WHERE id = $1`, [id]);
    res.status(201).json({ invoice: result.rows[0], payment: { amountXlm: xlmAmount, xlmRateUsd: xlmPriceUsd, network: process.env.STELLAR_NETWORK ?? 'testnet' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

/**
 * GET /api/billing/invoices
 */
router.get('/invoices', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { status } = req.query as { status?: string };
  const params: (string | number)[] = [];
  const conditions: string[] = [];
  let query = `SELECT i.*, p.first_name, p.last_name FROM invoices i JOIN patients p ON i.patient_id = p.id`;

  try {
    if (user.role === 'patient') {
      const pat = pool.query<{ id: string }>('SELECT id FROM patients WHERE user_id = $1', [user.id]);
      if (pat.rows.length === 0) { res.json({ invoices: [] }); return; }
      conditions.push(`i.patient_id = $${params.length + 1}`); params.push(pat.rows[0].id);
    }
    if (status) { conditions.push(`i.status = $${params.length + 1}`); params.push(status); }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY i.created_at DESC';
    const result = pool.query(query, params);
    res.json({ invoices: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

/**
 * POST /api/billing/pay
 */
router.post('/pay', authenticate, authorize('patient', 'admin'), async (req: AuthRequest, res: Response) => {
  const { invoiceId, patientStellarSecret } = req.body as { invoiceId: string; patientStellarSecret: string };

  if (!invoiceId || !patientStellarSecret) { res.status(400).json({ error: 'invoiceId and patientStellarSecret are required' }); return; }

  try {
    const invoiceResult = pool.query<InvoiceRow>(`SELECT * FROM invoices WHERE id = $1 AND status = 'pending'`, [invoiceId]);
    if (invoiceResult.rows.length === 0) { res.status(404).json({ error: 'Invoice not found or already paid' }); return; }
    const invoice = invoiceResult.rows[0];

    const hospitalPublicKey = process.env.HOSPITAL_STELLAR_PUBLIC;
    if (!hospitalPublicKey) { res.status(500).json({ error: 'Hospital Stellar account not configured' }); return; }

    const txResult = await sendPayment(patientStellarSecret, hospitalPublicKey, String(invoice.amount_xlm), `INV-${invoiceId.substring(0, 20)}`);

    pool.query(
      `INSERT INTO stellar_transactions (id, invoice_id, transaction_hash, from_address, to_address, amount_xlm, memo, status, ledger_sequence)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [uuidv4(), invoiceId, txResult.hash, txResult.from, txResult.to, invoice.amount_xlm, `INV-${invoiceId.substring(0, 20)}`, 'success', txResult.ledger]
    );
    pool.query(`UPDATE invoices SET status = 'paid', updated_at = datetime('now') WHERE id = $1`, [invoiceId]);

    res.json({
      message: 'Payment successful',
      transaction: {
        hash: txResult.hash, ledger: txResult.ledger,
        amountXlm: invoice.amount_xlm, amountUsd: invoice.amount_usd,
        stellarExplorer: `https://stellar.expert/explorer/testnet/tx/${txResult.hash}`,
      },
    });
  } catch (err: unknown) {
    console.error('Payment error:', err);
    const stellarErr = err as { response?: { data?: { extras?: { result_codes?: unknown } } } };
    res.status(500).json({ error: 'Payment failed', detail: stellarErr.response?.data?.extras?.result_codes ?? (err as Error).message });
  }
});

/**
 * GET /api/billing/stellar-balance/:publicKey
 */
router.get('/stellar-balance/:publicKey', authenticate, async (req, res: Response) => {
  try {
    const balances = await getAccountBalances(req.params.publicKey);
    res.json({ publicKey: req.params.publicKey, balances });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

export default router;
