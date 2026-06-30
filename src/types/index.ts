import { Request } from 'express';

// ─── User / Auth ──────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'doctor' | 'nurse' | 'patient';

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// ─── Database Row Types ───────────────────────────────────────────────────────

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  stellar_public_key: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PatientRow {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: Date;
  gender: string | null;
  blood_type: string | null;
  phone: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  stellar_public_key: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DoctorRow {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  specialization: string;
  license_number: string;
  phone: string | null;
  stellar_public_key: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface AppointmentRow {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: Date;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  reason: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface MedicalRecordRow {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id: string | null;
  diagnosis: string;
  treatment: string | null;
  medications: string | null;
  notes: string | null;
  is_sensitive: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface InvoiceRow {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  amount_usd: number;
  amount_xlm: number | null;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  description: string | null;
  due_date: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface StellarTransactionRow {
  id: string;
  invoice_id: string | null;
  transaction_hash: string;
  from_address: string;
  to_address: string;
  amount_xlm: number;
  memo: string | null;
  status: 'pending' | 'success' | 'failed';
  ledger_sequence: number | null;
  created_at: Date;
}

export interface RecordAccessTokenRow {
  id: string;
  patient_id: string;
  doctor_id: string;
  stellar_asset_code: string | null;
  stellar_asset_issuer: string | null;
  granted_at: Date;
  expires_at: Date | null;
  revoked_at: Date | null;
  is_active: boolean;
}

// ─── Stellar ──────────────────────────────────────────────────────────────────

export interface StellarKeypair {
  publicKey: string;
  secretKey: string;
}

export interface StellarBalance {
  asset: string;
  balance: string;
}

export interface StellarPaymentResult {
  hash: string;
  ledger: number;
  from: string;
  to: string;
  amount: string;
}

export interface StellarTokenResult {
  hash: string;
  assetCode: string;
  issuer: string;
  recipient: string;
}

export interface XlmConversionResult {
  xlmAmount: string;
  xlmPriceUsd: number;
}
