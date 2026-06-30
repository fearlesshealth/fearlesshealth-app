# Dev.to / Medium Article
## "How I Built a Hospital Management System on the Stellar Blockchain"

*Post this on Dev.to, Medium, Hashnode, and LinkedIn. It drives developer attention,
GitHub stars, and positions you as a builder — all of which count as traction.*

---

**Title:** How I Built a Hospital Management System on Stellar Blockchain (with TypeScript)

**Tags:** stellar, blockchain, typescript, nodejs, healthtech

---

### Introduction

When most people think about blockchain in healthcare, they imagine complex enterprise
solutions costing millions. I wanted to prove it could be different.

Over the past few weeks I built **FearlessHealth** — a full-stack hospital management system
for small clinics in Africa, with Stellar blockchain powering two critical features:
XLM payments for billing and cryptographic patient consent tokens.

Here's what I built, why I chose Stellar, and how you can try the live demo right now.

---

### The Problem

Small clinics across Africa still manage patient records on paper.
Billing is done in cash with no digital trail. Patients have no way to control
who accesses their medical history. When a patient visits a different doctor,
their records don't follow them.

These aren't just inconveniences — they lead to misdiagnoses, duplicate tests,
and revenue loss for clinics that can't track what they're owed.

---

### Why Stellar?

I evaluated several blockchains for this project. Stellar won for three reasons:

1. **Speed and cost** — transactions confirm in 3–5 seconds, fees are fractions of a cent.
   Perfect for billing in clinics where patients pay small amounts frequently.

2. **Custom assets** — Stellar lets you issue custom tokens in minutes.
   I use this for patient consent: when a patient grants a doctor access to their records,
   a custom Stellar asset is issued to the doctor's wallet. Revoking access claws it back.
   It's cryptographic proof of consent, on-chain.

3. **Soroban smart contracts** — the system is designed to evolve toward automated
   insurance claims processing using Soroban.

---

### What I Built

**Tech stack:**
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL (production) / SQLite (local dev)
- Blockchain: `@stellar/stellar-sdk`
- Frontend: React + TypeScript + Vite + Tailwind CSS

**Modules:**
- Patient registration and records management
- Doctor directory and appointment scheduling
- Medical records (diagnosis, treatment, medications)
- Invoicing with live USD → XLM conversion
- XLM payment processing via Stellar testnet
- Patient consent tokens (custom Stellar assets)
- Analytics dashboard for impact reporting

---

### The Stellar Integration

#### 1. Billing — paying invoices in XLM

When an admin creates an invoice, the system fetches the live XLM price and
converts the USD amount:

```typescript
export async function usdToXlm(usdAmount: number): Promise<XlmConversionResult> {
  const response = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd'
  );
  const data = await response.json();
  const xlmPriceUsd = data.stellar.usd;
  return {
    xlmAmount: (usdAmount / xlmPriceUsd).toFixed(7),
    xlmPriceUsd,
  };
}
```

When a patient pays, they sign a Stellar transaction with their secret key
(in production this would be handled by the Freighter wallet):

```typescript
export async function sendPayment(
  senderSecret: string,
  destination: string,
  amountXlm: string,
  memo: string
): Promise<StellarPaymentResult> {
  const keypair = StellarSdk.Keypair.fromSecret(senderSecret);
  const account = await server.loadAccount(keypair.publicKey());

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(StellarSdk.Operation.payment({
      destination,
      asset: StellarSdk.Asset.native(),
      amount: amountXlm,
    }))
    .addMemo(StellarSdk.Memo.text(memo))
    .setTimeout(30)
    .build();

  tx.sign(keypair);
  const result = await server.submitTransaction(tx);
  return { hash: result.hash, ledger: result.ledger, from: keypair.publicKey(), to: destination, amount: amountXlm };
}
```

#### 2. Patient consent — custom Stellar assets as access tokens

The most innovative feature. When a patient grants a doctor access to their records,
the system issues a custom Stellar asset to the doctor:

```typescript
export async function issueAccessToken(
  patientSecret: string,
  doctorPublic: string,
  assetCode: string       // e.g. "PAT3F8A2B1C9"
): Promise<StellarTokenResult> {
  const patientKeypair = StellarSdk.Keypair.fromSecret(patientSecret);
  const accessAsset = new StellarSdk.Asset(assetCode, patientKeypair.publicKey());

  const account = await server.loadAccount(patientKeypair.publicKey());
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(StellarSdk.Operation.payment({
      destination: doctorPublic,
      asset: accessAsset,
      amount: '1',
    }))
    .addMemo(StellarSdk.Memo.text('RECORD_ACCESS'))
    .setTimeout(30)
    .build();

  tx.sign(patientKeypair);
  const result = await server.submitTransaction(tx);
  return { hash: result.hash, assetCode, issuer: patientKeypair.publicKey(), recipient: doctorPublic };
}
```

To verify access, the system checks if the doctor's Stellar account holds the token:

```typescript
export async function verifyAccessToken(
  doctorPublic: string,
  patientPublic: string,
  assetCode: string
): Promise<boolean> {
  const account = await server.loadAccount(doctorPublic);
  const balance = account.balances.find(b =>
    b.asset_type !== 'native' &&
    `${b.asset_code}:${b.asset_issuer}` === `${assetCode}:${patientPublic}`
  );
  return balance ? parseFloat(balance.balance) >= 1 : false;
}
```

Revoking consent uses Stellar's clawback feature — the patient reclaims the token.

---

### Live Demo

Try the full system here: **https://your-app.vercel.app/demo**

One click auto-login as admin. Browse patients, appointments, billing, analytics.
No signup required.

---

### What's Next

- **Freighter wallet integration** — client-side signing so secret keys never leave the browser
- **Soroban smart contracts** — automated insurance claim verification
- **Mobile app** — for doctors doing ward rounds
- **Multi-clinic support** — one platform for clinic networks

---

### GitHub

The full source code is open source: **https://github.com/YOUR_USERNAME/fearlesshealth**

Star the repo if you find this useful — it helps us secure grant funding to keep
building this for clinics that need it.

---

*Built with ❤️ for African healthcare. Powered by Stellar.*
