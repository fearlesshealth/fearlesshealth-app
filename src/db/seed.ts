/**
 * Demo seed — populates the local SQLite DB with realistic hospital data.
 * Run: npx ts-node src/db/seed.ts
 */

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import pool, { initSchema } from './pool';

initSchema();

async function seed() {
  console.log('🌱 Seeding demo data...\n');

  // ─── Doctors ──────────────────────────────────────────────────────────────
  const doctors = [
    { firstName: 'Sarah',   lastName: 'Mensah',    specialization: 'Cardiology',        license: 'LIC-CARD-001', email: 'sarah.mensah@hospital.local' },
    { firstName: 'James',   lastName: 'Okafor',    specialization: 'General Practice',  license: 'LIC-GP-002',   email: 'james.okafor@hospital.local' },
    { firstName: 'Amara',   lastName: 'Diallo',    specialization: 'Paediatrics',       license: 'LIC-PAED-003', email: 'amara.diallo@hospital.local' },
    { firstName: 'Michael', lastName: 'Asante',    specialization: 'Orthopaedics',      license: 'LIC-ORTH-004', email: 'michael.asante@hospital.local' },
    { firstName: 'Fatima',  lastName: 'Bello',     specialization: 'Obstetrics',        license: 'LIC-OBS-005',  email: 'fatima.bello@hospital.local' },
  ];

  const doctorIds: string[] = [];

  for (const d of doctors) {
    const existing = pool.query('SELECT id FROM users WHERE email = $1', [d.email]);
    if (existing.rows.length > 0) { doctorIds.push((existing.rows[0] as { id: string }).id); continue; }

    const userId = uuidv4();
    const doctorId = uuidv4();
    const hash = await bcrypt.hash('doctor123', 12);

    pool.query(`INSERT INTO users (id, email, password_hash, role) VALUES ($1,$2,$3,'doctor')`, [userId, d.email, hash]);
    pool.query(
      `INSERT INTO doctors (id, user_id, first_name, last_name, specialization, license_number, phone) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [doctorId, userId, d.firstName, d.lastName, d.specialization, d.license, `+233 20 ${Math.floor(1000000 + Math.random() * 9000000)}`]
    );
    doctorIds.push(doctorId);
    console.log(`  👨‍⚕️  Dr. ${d.firstName} ${d.lastName} (${d.specialization})`);
  }

  // ─── Patients ─────────────────────────────────────────────────────────────
  const patients = [
    { firstName: 'Kwame',   lastName: 'Acheampong', dob: '1985-03-14', gender: 'Male',   blood: 'O+', email: 'kwame.acheampong@mail.com' },
    { firstName: 'Abena',   lastName: 'Owusu',      dob: '1992-07-22', gender: 'Female', blood: 'A+', email: 'abena.owusu@mail.com' },
    { firstName: 'Kofi',    lastName: 'Boateng',    dob: '1978-11-05', gender: 'Male',   blood: 'B-', email: 'kofi.boateng@mail.com' },
    { firstName: 'Esi',     lastName: 'Tetteh',     dob: '2001-01-30', gender: 'Female', blood: 'AB+',email: 'esi.tetteh@mail.com' },
    { firstName: 'Yaw',     lastName: 'Darko',      dob: '1965-09-18', gender: 'Male',   blood: 'A-', email: 'yaw.darko@mail.com' },
    { firstName: 'Adjoa',   lastName: 'Mensah',     dob: '1999-04-11', gender: 'Female', blood: 'O-', email: 'adjoa.mensah@mail.com' },
  ];

  const patientIds: string[] = [];

  for (const p of patients) {
    const existing = pool.query('SELECT id FROM patients WHERE first_name = $1 AND last_name = $2', [p.firstName, p.lastName]);
    if (existing.rows.length > 0) { patientIds.push((existing.rows[0] as { id: string }).id); continue; }

    const userId = uuidv4();
    const patientId = uuidv4();
    const hash = await bcrypt.hash('patient123', 12);

    pool.query(`INSERT INTO users (id, email, password_hash, role) VALUES ($1,$2,$3,'patient')`, [userId, p.email, hash]);
    pool.query(
      `INSERT INTO patients (id, user_id, first_name, last_name, date_of_birth, gender, blood_type, phone) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [patientId, userId, p.firstName, p.lastName, p.dob, p.gender, p.blood, `+233 24 ${Math.floor(1000000 + Math.random() * 9000000)}`]
    );
    patientIds.push(patientId);
    console.log(`  🧑  ${p.firstName} ${p.lastName} (${p.blood})`);
  }

  // ─── Appointments ─────────────────────────────────────────────────────────
  const apptData = [
    { pi: 0, di: 0, date: '2026-07-02T09:00:00', status: 'scheduled',  reason: 'Chest pain and shortness of breath' },
    { pi: 1, di: 1, date: '2026-07-02T10:30:00', status: 'scheduled',  reason: 'Annual wellness checkup' },
    { pi: 2, di: 3, date: '2026-07-01T08:00:00', status: 'completed',  reason: 'Knee pain follow-up' },
    { pi: 3, di: 2, date: '2026-07-01T14:00:00', status: 'completed',  reason: 'Childhood vaccination review' },
    { pi: 4, di: 0, date: '2026-06-28T11:00:00', status: 'completed',  reason: 'Hypertension management' },
    { pi: 5, di: 4, date: '2026-07-03T09:30:00', status: 'scheduled',  reason: 'Prenatal checkup — 28 weeks' },
    { pi: 0, di: 1, date: '2026-06-25T15:00:00', status: 'cancelled',  reason: 'General fatigue' },
    { pi: 1, di: 2, date: '2026-07-05T10:00:00', status: 'scheduled',  reason: 'Child growth assessment' },
  ];

  const apptIds: string[] = [];

  for (const a of apptData) {
    const id = uuidv4();
    pool.query(
      `INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, status, reason) VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, patientIds[a.pi], doctorIds[a.di], a.date, a.status, a.reason]
    );
    apptIds.push(id);
  }
  console.log(`\n  📅  ${apptIds.length} appointments created`);

  // ─── Medical Records (for completed appointments) ──────────────────────────
  const records = [
    { pi: 2, di: 3, ai: 2, diagnosis: 'Osteoarthritis of the right knee', treatment: 'Physical therapy, NSAIDs', medications: 'Ibuprofen 400mg x2 daily, Glucosamine 500mg' },
    { pi: 3, di: 2, ai: 3, diagnosis: 'Up to date on all childhood vaccinations', treatment: 'MMR booster administered', medications: 'None' },
    { pi: 4, di: 0, ai: 4, diagnosis: 'Stage 1 Hypertension (BP 145/92)', treatment: 'Lifestyle changes, started on ACE inhibitor', medications: 'Lisinopril 10mg once daily' },
  ];

  for (const r of records) {
    pool.query(
      `INSERT INTO medical_records (id, patient_id, doctor_id, appointment_id, diagnosis, treatment, medications) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [uuidv4(), patientIds[r.pi], doctorIds[r.di], apptIds[r.ai], r.diagnosis, r.treatment, r.medications]
    );
  }
  console.log(`  📋  ${records.length} medical records created`);

  // ─── Invoices ─────────────────────────────────────────────────────────────
  const invoices = [
    { pi: 2, ai: 2, usd: 250.00, xlm: 2083.33, desc: 'Orthopaedic consultation + X-Ray', status: 'paid' },
    { pi: 4, ai: 4, usd: 120.00, xlm: 1000.00, desc: 'Cardiology consultation', status: 'paid' },
    { pi: 0, ai: 0, usd: 180.00, xlm: 1500.00, desc: 'Cardiology initial assessment', status: 'pending' },
    { pi: 1, ai: 1, usd: 80.00,  xlm: 666.67,  desc: 'General practice checkup', status: 'pending' },
    { pi: 5, ai: 5, usd: 150.00, xlm: 1250.00, desc: 'Prenatal consultation', status: 'pending' },
  ];

  for (const inv of invoices) {
    pool.query(
      `INSERT INTO invoices (id, patient_id, appointment_id, amount_usd, amount_xlm, description, status, due_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [uuidv4(), patientIds[inv.pi], apptIds[inv.ai], inv.usd, inv.xlm, inv.desc, inv.status, '2026-07-31']
    );
  }
  console.log(`  💰  ${invoices.length} invoices created (2 paid, 3 pending)`);

  console.log(`
✅ Seed complete!

┌─────────────────────────────────────────────────────┐
│  Login credentials                                  │
├─────────────────────────────────────────────────────┤
│  Admin    admin@hospital.local     / admin123       │
│  Doctor   sarah.mensah@...         / doctor123      │
│  Doctor   james.okafor@...         / doctor123      │
│  Patient  kwame.acheampong@...     / patient123     │
│  Patient  abena.owusu@...          / patient123     │
└─────────────────────────────────────────────────────┘
`);
}

seed().catch(console.error);
