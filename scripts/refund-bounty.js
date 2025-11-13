/**
 * Script to refund an existing bounty
 * Usage: node scripts/refund-bounty.js [bounty_id]
 * If bounty_id is not provided, it will refund the latest bounty
 */

const algosdk = require('algosdk');
const fs = require('fs');
const path = require('path');

// Load contract info
const contractInfoPath = path.join(__dirname, '..', 'contract-info-v3.json');
let contractInfo;
try {
  contractInfo = JSON.parse(fs.readFileSync(contractInfoPath, 'utf8'));
} catch (error) {
  console.error('❌ Failed to load contract info. Make sure the contract is deployed.');
  process.exit(1);
}

const APP_ID = contractInfo.appId;
const ALGOD_URL = process.env.ALGOD_URL || 'https://testnet-api.algonode.cloud';
const ALGOD_TOKEN = '';
const INDEXER_URL = process.env.INDEXER_URL || 'https://testnet-idx.algonode.cloud';
const INDEXER_TOKEN = '';

// Get mnemonic from environment or prompt
const MNEMONIC = process.env.MNEMONIC || process.argv[2];

if (!MNEMONIC) {
  console.error('❌ Please provide your mnemonic as an environment variable (MNEMONIC) or as the first argument');
  console.error('Usage: MNEMONIC="your mnemonic" node scripts/refund-bounty.js [bounty_id]');
  process.exit(1);
}

// Get bounty_id from command line (optional)
const BOUNTY_ID = process.argv[3] ? parseInt(process.argv[3]) : null;

async function refundBounty() {
  try {
    // Initialize clients
    const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_URL, '');
    
    // Get account from mnemonic
    const account = algosdk.mnemonicToSecretKey(MNEMONIC);
    console.log('👤 Account:', account.addr);
    
    // Get account info
    const accountInfo = await algodClient.accountInformation(account.addr).do();
    const balance = accountInfo.amount / 1000000;
    console.log('💳 Balance:', balance.toFixed(6), 'ALGO');
    
    // Get contract state to find bounty_id if not provided
    let bountyId = BOUNTY_ID;
    if (!bountyId) {
      console.log('📊 Fetching contract state to find latest bounty...');
      const appInfo = await algodClient.getApplicationByID(APP_ID).do();
      const globalState = appInfo.params['global-state'] || [];
      
      // Find bounty_count
      let bountyCount = 0;
      for (const item of globalState) {
        const key = Buffer.from(item.key, 'base64').toString('utf8');
        if (key === 'bounty_count' && item.value.type === 2) {
          bountyCount = item.value.uint;
          break;
        }
      }
      
      if (bountyCount === 0) {
        console.error('❌ No bounties found. Bounty counter is 0.');
        process.exit(1);
      }
      
      // Latest bounty_id is bounty_count - 1
      bountyId = bountyCount - 1;
      console.log('📋 Found latest bounty ID:', bountyId);
    } else {
      console.log('📋 Using provided bounty ID:', bountyId);
    }
    
    // Get suggested params
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create app call transaction for refund
    // V3 contract requires: [method, bounty_id]
    const appArgs = [
      new Uint8Array(Buffer.from('refund')),
      algosdk.encodeUint64(bountyId)
    ];
    
    const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
      from: account.addr,
      appIndex: APP_ID,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      appArgs: appArgs,
      suggestedParams: suggestedParams,
      note: new Uint8Array(Buffer.from('AlgoEase: Refund Bounty'))
    });
    
    // Sign transaction
    const signedTxn = appCallTxn.signTxn(account.sk);
    
    // Submit transaction
    console.log('📤 Submitting refund transaction...');
    const txId = await algodClient.sendRawTransaction(signedTxn).do();
    console.log('✅ Transaction ID:', txId.txId);
    
    // Wait for confirmation
    console.log('⏳ Waiting for confirmation...');
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId.txId, 10);
    console.log('✅ Transaction confirmed in round:', confirmedTxn['confirmed-round']);
    
    // Check balance after
    const accountInfoAfter = await algodClient.accountInformation(account.addr).do();
    const balanceAfter = accountInfoAfter.amount / 1000000;
    const refunded = balanceAfter - balance;
    
    console.log('\n' + '='.repeat(80));
    console.log('🎉 BOUNTY REFUNDED SUCCESSFULLY!');
    console.log('='.repeat(80));
    console.log('💰 Refunded amount: ~' + refunded.toFixed(6), 'ALGO');
    console.log('💳 New balance:', balanceAfter.toFixed(6), 'ALGO');
    console.log('📋 Bounty ID:', bountyId);
    console.log('🔗 Transaction ID:', txId.txId);
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ Error refunding bounty:', error);
    if (error.response) {
      console.error('Error details:', error.response.text);
    }
    process.exit(1);
  }
}

// Run the refund
refundBounty();
