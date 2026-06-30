# FearlessHealth

> Healthcare infrastructure for every clinic — powered by Stellar blockchain.

FearlessHealth is an open-source hospital management system built for small and
medium-sized clinics in Africa. It digitises patient records, appointments, and
billing — with XLM payments on Stellar and cryptographic patient consent tokens.

## Live Demo

🌐 **[Try the demo →](https://your-app.vercel.app/demo)**
📋 **[Join the waitlist →](https://your-app.vercel.app/landing)**

## Features

| Module | Description |
|---|---|
| **Auth** | JWT login with role-based access (admin, doctor, nurse, patient) |
| **Patients** | Digital records, full history, blood type, emergency contacts |
| **Doctors** | Directory, specializations, Stellar wallet linked |
| **Appointments** | Scheduling with conflict detection, status tracking |
| **Medical Records** | Diagnosis, treatment, medications — consent-gated |
| **Billing** | Invoices in USD, paid via Stellar XLM |
| **Consent Tokens** | Patient grants/revokes doctor access via Stellar custom assets |
| **Analytics** | Impact dashboard for grant reporting |
| **Waitlist** | Public signup page for clinic interest |

## Stellar Integration

### Payments
Invoices are created in USD, converted to XLM at live market rate, and paid via
Stellar testnet transactions. Every payment is logged with a transaction hash
verifiable on [Stellar Expert](https://stellar.expert/explorer/testnet).

### Patient Consent Tokens
When a patient grants a doctor access to their records, a custom Stellar asset
is issued to the doctor's wallet — cryptographic proof of consent. Revoking access
claws the token back. Access is verified on-chain before records are returned.

## Tech Stack

- **Backend:** Node.js + TypeScript + Express
- **Database:** SQLite (dev) / PostgreSQL (production)
- **Blockchain:** `@stellar/stellar-sdk`
- **Frontend:** React + TypeScript + Vite + Tailwind CSS

## Quick Start

```bash
# Clone and install
git clone https://github.com/YOUR_USERNAME/fearlesshealth
cd fearlesshealth
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start backend (auto-seeds demo data)
npm run dev

# In another terminal — start frontend
cd frontend && npm run dev
```

Open `http://localhost:5173`

**Demo credentials:**
- Admin: `admin@hospital.local` / `admin123`
- Doctor: `sarah.mensah@hospital.local` / `doctor123`
- Patient: `kwame.acheampong@mail.com` / `patient123`

## Deployment

See [docs/DEPLOY.md](docs/DEPLOY.md) for Railway + Vercel deployment (both free).

## Grant Application

See [docs/PITCH.md](docs/PITCH.md) for the full grant pitch document.

---

*FearlessHealth — Healthcare infrastructure for every clinic.*
*Built on Stellar · Open Source · MIT License*
