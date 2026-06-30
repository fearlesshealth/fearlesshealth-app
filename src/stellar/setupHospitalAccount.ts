/**
 * One-time setup: generate the hospital's Stellar account and fund it on testnet.
 * Run: npx ts-node src/stellar/setupHospitalAccount.ts
 */

import { generateKeypair, fundTestnetAccount } from './stellarService';

async function setup(): Promise<void> {
  console.log('🔑 Generating hospital Stellar keypair...\n');
  const keypair = generateKeypair();

  console.log('HOSPITAL_STELLAR_PUBLIC=' + keypair.publicKey);
  console.log('HOSPITAL_STELLAR_SECRET=' + keypair.secretKey);
  console.log('\n⚠️  Save these in your .env file. The secret key will not be shown again.\n');

  console.log('💧 Funding account on Stellar testnet via Friendbot...');
  try {
    await fundTestnetAccount(keypair.publicKey);
    console.log('✅ Account funded! Starting balance: 10,000 XLM (testnet)\n');
    console.log(
      `🔍 View: https://stellar.expert/explorer/testnet/account/${keypair.publicKey}`
    );
  } catch (err) {
    console.error('❌ Funding failed:', (err as Error).message);
    console.log('Manual funding: https://laboratory.stellar.org/#account-creator?network=test');
  }
}

setup();
