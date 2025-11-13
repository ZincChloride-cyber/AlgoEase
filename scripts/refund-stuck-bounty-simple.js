#!/usr/bin/env node

/**
 * Simple Refund Script for Stuck Bounty
 * 
 * This script refunds a stuck bounty using the App ID and your mnemonic.
 * 
 * Usage: node scripts/refund-stuck-bounty-simple.js [APP_ID] [MNEMONIC]
 * 
 * If APP_ID is not provided, it will use the default from environment or 749335380
 * If MNEMONIC is not provided, it will prompt you to enter it
 */

const algosdk = require('algosdk');
const readline = require('readline');

// Configuration
const ALGOD_URL = process.env.REACT_APP_ALGOD_URL || 'https://testnet-api.algonode.cloud';
const ALGOD_TOKEN = '';
const ALGOD_PORT = '';

// Initialize Algod client
const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_URL, ALGOD_PORT);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function getStatusName(status) {
  const statuses = {
    0: 'Open',
    1: 'Accepted',
    2: 'Approved',
    3: 'Claimed',
    4: 'Refunded'
  };
  return statuses[status] || 'Unknown';
}

async function checkContractState(appId) {
  try {
    console.log(`\n📋 Checking contract state for App ID: ${appId}...\n`);
    
    const appInfo = await algodClient.getApplicationByID(appId).do();
    const globalState = appInfo.params['global-state'] || [];
    
    const state = {};
    globalState.forEach(item => {
      const key = Buffer.from(item.key, 'base64').toString('utf8');
      if (item.value.type === 1) { // uint
        state[key] = Number(item.value.uint);
      } else if (item.value.type === 2) { // bytes
        const bytes = Buffer.from(item.value.bytes, 'base64');
        if (bytes.length === 32) {
          state[key] = algosdk.encodeAddress(bytes);
        } else {
          try {
            state[key] = bytes.toString('utf8');
          } catch {
            state[key] = bytes.toString('hex');
          }
        }
      }
    });
    
    console.log('📊 Contract State:');
    console.log(`   Status: ${state.status || 0} (${getStatusName(state.status || 0)})`);
    console.log(`   Amount: ${state.amount ? (Number(state.amount) / 1_000_000).toFixed(6) + ' ALGO' : '0 ALGO'}`);
    console.log(`   Client: ${state.client_addr || '(none)'}`);
    console.log(`   Freelancer: ${state.freelancer_addr || '(none)'}`);
    console.log(`   Verifier: ${state.verifier_addr || '(none)'}`);
    
    if (state.deadline) {
      const deadlineDate = new Date(Number(state.deadline) * 1000);
      const now = Date.now();
      const isPastDeadline = now >= Number(state.deadline) * 1000;
      console.log(`   Deadline: ${deadlineDate.toLocaleString()} ${isPastDeadline ? '(PASSED)' : '(NOT YET)'}`);
    }
    
    return state;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new Error(`Contract with App ID ${appId} not found!`);
    }
    throw error;
  }
}

async function refundBounty(appId, mnemonic) {
  try {
    console.log('\n🔄 REFUNDING STUCK BOUNTY...');
    console.log('='.repeat(80));
    
    // Convert mnemonic to account
    const account = algosdk.mnemonicToSecretKey(mnemonic.trim());
    const senderAddress = account.addr;
    
    console.log(`👤 Your address: ${senderAddress}`);
    console.log(`📋 App ID: ${appId}`);
    
    // Check contract state
    const state = await checkContractState(appId);
    
    // Validate state
    if (state.status === 3 || state.status === 4) {
      console.log('\n❌ Bounty is already claimed or refunded!');
      console.log('   No action needed.');
      return false;
    }
    
    if (!state.amount || Number(state.amount) === 0) {
      console.log('\n⚠️  No active bounty found (amount is 0)!');
      console.log('   The contract has no funds to refund.');
      return false;
    }
    
    // Check authorization
    const isClient = senderAddress === state.client_addr;
    const isVerifier = senderAddress === state.verifier_addr;
    const isAuthorized = isClient || isVerifier;
    
    if (!isAuthorized) {
      console.log('\n⚠️  Warning: You are not the client or verifier!');
      console.log(`   Client: ${state.client_addr}`);
      console.log(`   Verifier: ${state.verifier_addr}`);
      console.log(`   You: ${senderAddress}`);
      
      // Check if deadline has passed for auto-refund
      const now = Math.floor(Date.now() / 1000);
      if (state.deadline && now >= state.deadline) {
        console.log('\n💡 Deadline has passed! Using auto_refund instead...');
        return await autoRefundBounty(appId, account);
      } else {
        console.log('\n❌ Only client or verifier can refund before deadline!');
        console.log('   If you are the client or verifier, make sure you are using the correct mnemonic.');
        return false;
      }
    }
    
    console.log(`\n✅ Authorization confirmed: You are the ${isClient ? 'CLIENT' : 'VERIFIER'}`);
    
    // Get account balance before
    const accountInfoBefore = await algodClient.accountInformation(senderAddress).do();
    const balanceBefore = Number(accountInfoBefore.amount) / 1_000_000;
    console.log(`💳 Balance before: ${balanceBefore.toFixed(6)} ALGO`);
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create refund transaction
    const appArgs = [new Uint8Array(Buffer.from('refund'))];
    
    const refundTxn = algosdk.makeApplicationCallTxnFromObject({
      from: senderAddress,
      appIndex: appId,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      suggestedParams,
      appArgs,
      note: new Uint8Array(Buffer.from('AlgoEase: Refund Stuck Bounty'))
    });
    
    // Sign and send
    console.log('\n📤 Signing and sending refund transaction...');
    const signedTxn = refundTxn.signTxn(account.sk);
    const txId = await algodClient.sendRawTransaction(signedTxn).do();
    
    console.log(`✅ Transaction ID: ${txId.txid}`);
    console.log('⏳ Waiting for confirmation (this takes about 4-5 seconds)...');
    
    const confirmedTxn = await algosdk.waitForConfirmation(
      algodClient,
      txId.txid,
      10
    );
    
    console.log(`✅ Transaction confirmed in round ${confirmedTxn['confirmed-round']}`);
    
    // Check balance after
    const accountInfoAfter = await algodClient.accountInformation(senderAddress).do();
    const balanceAfter = Number(accountInfoAfter.amount) / 1_000_000;
    const refunded = balanceAfter - balanceBefore;
    
    console.log('\n' + '='.repeat(80));
    console.log('🎉 BOUNTY REFUNDED SUCCESSFULLY!');
    console.log('='.repeat(80));
    console.log(`💰 Refunded: ~${refunded.toFixed(6)} ALGO`);
    console.log(`💳 New balance: ${balanceAfter.toFixed(6)} ALGO`);
    console.log('='.repeat(80));
    console.log(`\n🔗 View transaction:`);
    console.log(`   Pera Explorer: https://testnet.explorer.perawallet.app/tx/${txId.txid}`);
    console.log(`   AlgoExplorer: https://testnet.algoexplorer.io/tx/${txId.txid}`);
    console.log('');
    
    return true;
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response && error.response.body) {
      try {
        const body = typeof error.response.body === 'string' 
          ? JSON.parse(error.response.body) 
          : error.response.body;
        console.error('Details:', JSON.stringify(body, null, 2));
      } catch (e) {
        console.error('Details:', error.response.body);
      }
    }
    return false;
  }
}

async function autoRefundBounty(appId, account) {
  try {
    const senderAddress = account.addr;
    
    console.log('\n🔄 Using AUTO_REFUND (deadline has passed)...');
    
    const suggestedParams = await algodClient.getTransactionParams().do();
    const appArgs = [new Uint8Array(Buffer.from('auto_refund'))];
    
    const refundTxn = algosdk.makeApplicationCallTxnFromObject({
      from: senderAddress,
      appIndex: appId,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      suggestedParams,
      appArgs,
      note: new Uint8Array(Buffer.from('AlgoEase: Auto Refund'))
    });
    
    const signedTxn = refundTxn.signTxn(account.sk);
    const txId = await algodClient.sendRawTransaction(signedTxn).do();
    
    console.log(`✅ Transaction ID: ${txId.txid}`);
    console.log('⏳ Waiting for confirmation...');
    
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId.txid, 10);
    
    console.log(`✅ Transaction confirmed in round ${confirmedTxn['confirmed-round']}`);
    console.log('\n✅ Auto-refund completed successfully!');
    console.log(`🔗 View transaction: https://testnet.explorer.perawallet.app/tx/${txId.txid}\n`);
    
    return true;
  } catch (error) {
    console.error('\n❌ Auto-refund failed:', error.message);
    return false;
  }
}

async function main() {
  try {
    console.log('\n🔧 AlgoEase - Refund Stuck Bounty Tool\n');
    
    // Get App ID
    let appId = process.argv[2];
    if (appId) {
      appId = parseInt(appId);
    } else {
      appId = parseInt(process.env.REACT_APP_CONTRACT_APP_ID) || 749335380;
      console.log(`📋 Using App ID: ${appId} (default)`);
      console.log('   To use a different App ID, run: node scripts/refund-stuck-bounty-simple.js <APP_ID>');
    }
    
    // Get mnemonic
    let mnemonic = process.argv[3] || process.env.REACT_APP_CREATOR_MNEMONIC || '';
    
    if (!mnemonic) {
      mnemonic = await question('\nEnter your 25-word mnemonic phrase (the wallet that created the bounty): ');
    }
    
    if (!mnemonic || mnemonic.trim().split(' ').length !== 25) {
      console.error('\n❌ Error: Invalid mnemonic! Must be exactly 25 words.');
      console.log('   Make sure you copied all 25 words correctly.');
      rl.close();
      process.exit(1);
    }
    
    // Proceed with refund
    const success = await refundBounty(appId, mnemonic);
    
    rl.close();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    rl.close();
    process.exit(1);
  }
}

// Run main function
main();

