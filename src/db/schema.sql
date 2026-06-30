-- GrantFox Hospital Management System
-- SQLite-compatible schema (local dev)
-- Swap to schema.postgres.sql for production PostgreSQL

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'nurse', 'patient')),
  stellar_public_key TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth TEXT,
  gender TEXT,
  blood_type TEXT,
  phone TEXT,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  stellar_public_key TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS doctors (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  license_number TEXT UNIQUE NOT NULL,
  phone TEXT,
  stellar_public_key TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id TEXT REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_date TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  reason TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS medical_records (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id TEXT REFERENCES doctors(id),
  appointment_id TEXT REFERENCES appointments(id),
  diagnosis TEXT,
  treatment TEXT,
  medications TEXT,
  notes TEXT,
  is_sensitive INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id TEXT REFERENCES appointments(id),
  amount_usd REAL NOT NULL,
  amount_xlm REAL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
  description TEXT,
  due_date TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stellar_transactions (
  id TEXT PRIMARY KEY,
  invoice_id TEXT REFERENCES invoices(id),
  transaction_hash TEXT UNIQUE,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount_xlm REAL NOT NULL,
  memo TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  ledger_sequence INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS record_access_tokens (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id TEXT REFERENCES doctors(id) ON DELETE CASCADE,
  stellar_asset_code TEXT,
  stellar_asset_issuer TEXT,
  granted_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT,
  revoked_at TEXT,
  is_active INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_stellar_transactions_invoice_id ON stellar_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_access_tokens_patient_id ON record_access_tokens(patient_id);
