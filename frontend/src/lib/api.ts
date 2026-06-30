const BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Request failed');
  return data as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (body: RegisterPayload) =>
    request<{ token: string; user: User; stellar: StellarInfo }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getDoctors: (params?: string) =>
    request<{ doctors: Doctor[] }>(`/doctors${params ? '?' + params : ''}`),

  getPatients: (params?: string) =>
    request<{ patients: Patient[] }>(`/patients${params ? '?' + params : ''}`),

  getPatient: (id: string) =>
    request<{ patient: Patient }>(`/patients/${id}`),

  getAppointments: (params?: string) =>
    request<{ appointments: Appointment[] }>(`/appointments${params ? '?' + params : ''}`),

  bookAppointment: (body: BookAppointmentPayload) =>
    request<{ appointment: Appointment }>('/appointments', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateAppointmentStatus: (id: string, status: string, notes?: string) =>
    request<{ appointment: Appointment }>(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    }),

  getInvoices: (params?: string) =>
    request<{ invoices: Invoice[] }>(`/billing/invoices${params ? '?' + params : ''}`),

  createInvoice: (body: CreateInvoicePayload) =>
    request<{ invoice: Invoice; payment: PaymentInfo }>('/billing/invoice', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getRecords: (patientId: string) =>
    request<{ records: MedicalRecord[] }>(`/records/patient/${patientId}`),
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'doctor' | 'nurse' | 'patient';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  stellarPublicKey?: string | null;
}

export interface StellarInfo {
  publicKey: string;
  secretKey: string;
  note: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  specialization?: string;
  dateOfBirth?: string;
  bloodType?: string;
  phone?: string;
}

export interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  specialization: string;
  phone: string | null;
  stellar_public_key: string | null;
  created_at: string;
}

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string | null;
  blood_type: string | null;
  phone: string | null;
  stellar_public_key: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  reason: string | null;
  notes: string | null;
  patient_first?: string;
  patient_last?: string;
  doctor_first?: string;
  doctor_last?: string;
  specialization?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  patient_id: string;
  amount_usd: number;
  amount_xlm: number;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  description: string | null;
  due_date: string | null;
  first_name?: string;
  last_name?: string;
  created_at: string;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  diagnosis: string;
  treatment: string | null;
  medications: string | null;
  notes: string | null;
  doctor_first?: string;
  doctor_last?: string;
  specialization?: string;
  created_at: string;
}

export interface BookAppointmentPayload {
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  reason?: string;
}

export interface CreateInvoicePayload {
  patientId: string;
  appointmentId?: string;
  amountUsd: number;
  description?: string;
  dueDate?: string;
}

export interface PaymentInfo {
  amountXlm: string;
  xlmRateUsd: number;
  network: string;
}
