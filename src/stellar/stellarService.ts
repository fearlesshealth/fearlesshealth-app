/**
 * Stellar Service
 * All Stellar network interactions typed with full TypeScript support.
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import dotenv from 'dotenv';
import {
  StellarKeypair,
  StellarBalance,
  StellarPaymentResult,
  StellarTokenResult,
  XlmConversionResult,
} from '../types';

dotenv.config();

const isTestnet = process.env.STELLAR_NETWORK === 'testnet';

const server = new StellarSdk.Horizon.Server(
  process.env.STELLAR_HORIZON_URL ?? 'https://horizon-testnet.stellar.org'
);

const networkPassphrase = isTestnet
  ? StellarSdk.Networks.TESTNET
  : StellarSdk.Networks.PUBLIC;

// ─── Account Management ───────────────────────────────────────────────────────

export function generateKeypair(): StellarKeypair {
  const keypair = StellarSdk.Keypair.random();
  return {
    publicKey: keypair.publicKey(),
    secretKey: keypair.secret(),
  };
}

export async function fundTestnetAccount(publicKey: string): Promise<unknown> {
  const response = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
  if (!response.ok) {
    throw new Error(`Friendbot funding failed: ${response.statusText}`);
  }
  return response.json();
}

export async function getAccountBalances(publicKey: string): Promise<StellarBalance[]> {
  try {
    const account = await server.loadAccount(publicKey);
    return account.balances.map((b) => ({
      asset:
        b.asset_type === 'native'
          ? 'XLM'
          : `${(b as StellarSdk.Horizon.HorizonApi.BalanceLine<'credit_alphanum4' | 'credit_alphanum12'>).asset_code}:${(b as StellarSdk.Horizon.HorizonApi.BalanceLine<'credit_alphanum4' | 'credit_alphanum12'>).asset_issuer}`,
      balance: b.balance,
    }));
  } catch (err: unknown) {
    const stellarErr = err as { response?: { status?: number } };
    if (stellarErr.response?.status === 404) return [];
    throw err;
  }
}

// ─── Payments ─────────────────────────────────────────────────────────────────

/**
 * Send XLM payment — used for billing.
 * NOTE: In production, signing should happen client-side via a wallet.
 */
export async function sendPayment(
  senderSecret: string,
  destinationPublic: string,
  amountXlm: string,
  memo: string = ''
): Promise<StellarPaymentResult> {
  const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
  const senderAccount = await server.loadAccount(senderKeypair.publicKey());

  const builder = new StellarSdk.TransactionBuilder(senderAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase,
  }).addOperation(
    StellarSdk.Operation.payment({
      destination: destinationPublic,
      asset: StellarSdk.Asset.native(),
      amount: amountXlm,
    })
  );

  if (memo) {
    builder.addMemo(StellarSdk.Memo.text(memo.substring(0, 28)));
  }

  const transaction = builder.setTimeout(30).build();
  transaction.sign(senderKeypair);

  const result = await server.submitTransaction(transaction);
  return {
    hash: result.hash,
    ledger: result.ledger,
    from: senderKeypair.publicKey(),
    to: destinationPublic,
    amount: amountXlm,
  };
}

// ─── Record Access Tokens ─────────────────────────────────────────────────────

/**
 * Issue a custom asset to a doctor as proof of patient consent.
 * The patient is the issuer; holding ≥1 token means access is granted.
 */
export async function issueAccessToken(
  patientSecret: string,
  doctorPublic: string,
  assetCode: string
): Promise<StellarTokenResult> {
  const patientKeypair = StellarSdk.Keypair.fromSecret(patientSecret);
  const patientPublic = patientKeypair.publicKey();
  const accessAsset = new StellarSdk.Asset(assetCode, patientPublic);

  const patientAccount = await server.loadAccount(patientPublic);

  const transaction = new StellarSdk.TransactionBuilder(patientAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: doctorPublic,
        asset: accessAsset,
        amount: '1',
      })
    )
    .addMemo(StellarSdk.Memo.text('RECORD_ACCESS'))
    .setTimeout(30)
    .build();

  transaction.sign(patientKeypair);
  const result = await server.submitTransaction(transaction);

  return {
    hash: result.hash,
    assetCode,
    issuer: patientPublic,
    recipient: doctorPublic,
  };
}

/**
 * Clawback the access token from the doctor to revoke consent.
 */
export async function revokeAccessToken(
  patientSecret: string,
  doctorPublic: string,
  assetCode: string
): Promise<{ hash: string; revoked: boolean }> {
  const patientKeypair = StellarSdk.Keypair.fromSecret(patientSecret);
  const patientPublic = patientKeypair.publicKey();
  const accessAsset = new StellarSdk.Asset(assetCode, patientPublic);

  const patientAccount = await server.loadAccount(patientPublic);

  const transaction = new StellarSdk.TransactionBuilder(patientAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      StellarSdk.Operation.clawback({
        asset: accessAsset,
        from: doctorPublic,
        amount: '1',
      })
    )
    .addMemo(StellarSdk.Memo.text('REVOKE_ACCESS'))
    .setTimeout(30)
    .build();

  transaction.sign(patientKeypair);
  const result = await server.submitTransaction(transaction);

  return { hash: result.hash, revoked: true };
}

/**
 * Check if a doctor holds the access token for a given patient.
 */
export async function verifyAccessToken(
  doctorPublic: string,
  patientPublic: string,
  assetCode: string
): Promise<boolean> {
  try {
    const doctorAccount = await server.loadAccount(doctorPublic);
    const targetAsset = `${assetCode}:${patientPublic}`;

    const balance = doctorAccount.balances.find((b) => {
      if (b.asset_type === 'native') return false;
      const line = b as StellarSdk.Horizon.HorizonApi.BalanceLine<
        'credit_alphanum4' | 'credit_alphanum12'
      >;
      return `${line.asset_code}:${line.asset_issuer}` === targetAsset;
    });

    return balance ? parseFloat(balance.balance) >= 1 : false;
  } catch {
    return false;
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export async function usdToXlm(usdAmount: number | string): Promise<XlmConversionResult> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd'
    );
    const data = (await response.json()) as { stellar: { usd: number } };
    const xlmPriceUsd = data.stellar.usd;
    return {
      xlmAmount: (parseFloat(String(usdAmount)) / xlmPriceUsd).toFixed(7),
      xlmPriceUsd,
    };
  } catch {
    const fallbackRate = 0.12;
    return {
      xlmAmount: (parseFloat(String(usdAmount)) / fallbackRate).toFixed(7),
      xlmPriceUsd: fallbackRate,
    };
  }
}
