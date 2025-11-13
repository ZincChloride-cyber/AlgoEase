#!/usr/bin/env node

/**
 * Refund Bounty from Transaction
 * 
 * This script looks up a transaction by ID or Group ID, identifies the contract,
 * checks the state, and refunds the stuck bounty.
 * 
 * Usage: node scripts/refund-from-transaction.js <TX_ID_OR_GROUP_ID> [MNEMONIC]
 */

const algosdk = require('algosdk');

// Configuration
const ALGOD_URL = process.env.REACT_APP_ALGOD_URL || 'https://testnet-api.algonode.cloud';
const ALGOD_TOKEN = '';
const ALGOD_PORT = '';

// Initialize Algod client
const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_URL, ALGOD_PORT);

async function lookupTransaction(txId) {
  try {
    // Try to get transaction by ID
    const txInfo = await algodClient.transactionById(txId).do();
    return txInfo;
  } catch (error) {
    // If not found, try to search by group
    console.log(`Transaction ${txId} not found directly, trying to find by group...`);
    return null;
  }
}

async function findTransactionInGroup(groupId) {
  try {
    // Decode the group ID from base64
    const groupIdBytes = Buffer.from(groupId, 'base64');
    
    // Search for transactions in recent rounds
    // Note: This is a simplified approach - in production you might want to use an indexer
    console.log('Searching for transactions in group...');
    console.log('Note: For better results, use the transaction ID directly if available.');
    
    return null;
  } catch (error) {
    console.error('Error searching for group:', error.message);
    return null;
  }
}

async function getTransactionFromIndexer(txId) {
  // Try using AlgoNode indexer API
  try {
    const https = require('https');
    const indexerUrl = 'https://testnet-idx.algonode.cloud';
    
    return new Promise((resolve, reject) => {
      https.get(`${indexerUrl}/v2/transactions/${txId}`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json.transaction);
          } catch (e) {
            resolve(null);
          }
        });
      }).on('error', () => resolve(null));
    });
  } catch (error) {
    return null;
  }
}

async function checkContractState(appId) {
  try {
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
    
    return state;
  } catch (error) {
    throw new Error(`Failed to get contract state: ${error.message}`);
  }
}

async function refundBounty(appId, mnemonic) {
  try {
    console.log('\n🔄 REFUNDING BOUNTY...');
    console.log('='.repeat(80));
    
    // Convert mnemonic to account
    const account = algosdk.mnemonicToSecretKey(mnemonic.trim());
    const senderAddress = account.addr;
    
    console.log(`👤 Sender: ${senderAddress}`);
    console.log(`📋 App ID: ${appId}`);
    
    // Check contract state
    const state = await checkContractState(appId);
    
    console.log('\n📊 Contract State:');
    console.log(`   Status: ${state.status || 0} (${getStatusName(state.status || 0)})`);
    console.log(`   Amount: ${state.amount ? (Number(state.amount) / 1_000_000).toFixed(6) + ' ALGO' : '0 ALGO'}`);
    console.log(`   Client: ${state.client_addr || '(none)'}`);
    console.log(`   Verifier: ${state.verifier_addr || '(none)'}`);
    
    // Check if already refunded/claimed
    if (state.status === 3 || state.status === 4) {
      console.log('\n❌ Bounty is already claimed or refunded!');
      return false;
    }
    
    if (!state.amount || Number(state.amount) === 0) {
      console.log('\n⚠️  No active bounty found (amount is 0)!');
      return false;
    }
    
    // Check authorization
    const isAuthorized = senderAddress === state.client_addr || senderAddress === state.verifier_addr;
    if (!isAuthorized) {
      console.log('\n⚠️  Warning: You are not the client or verifier!');
      console.log(`   Client: ${state.client_addr}`);
      console.log(`   Verifier: ${state.verifier_addr}`);
      console.log(`   You: ${senderAddress}`);
      
      // Check if deadline has passed for auto-refund
      const now = Math.floor(Date.now() / 1000);
      if (state.deadline && now >= state.deadline) {
        console.log('\n💡 Deadline has passed! Using auto_refund instead...');
        return await autoRefundBounty(appId, mnemonic);
      } else {
        console.log('\n❌ Only client or verifier can refund before deadline!');
        return false;
      }
    }
    
    // Get account balance before
    const accountInfoBefore = await algodClient.accountInformation(senderAddress).do();
    const balanceBefore = Number(accountInfoBefore.amount) / 1_000_000;
    console.log(`\n💳 Balance before: ${balanceBefore.toFixed(6)} ALGO`);
    
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
    console.log('⏳ Waiting for confirmation...');
    
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
    console.log(`\n🔗 View transaction: https://testnet.explorer.perawallet.app/tx/${txId.txid}\n`);
    
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

async function autoRefundBounty(appId, mnemonic) {
  try {
    const account = algosdk.mnemonicToSecretKey(mnemonic.trim());
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
    
    await algosdk.waitForConfirmation(algodClient, txId.txid, 10);
    
    console.log('\n✅ Auto-refund completed successfully!');
    console.log(`🔗 View transaction: https://testnet.explorer.perawallet.app/tx/${txId.txid}\n`);
    
    return true;
  } catch (error) {
    console.error('\n❌ Auto-refund failed:', error.message);
    return false;
  }
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

async function main() {
  const txIdOrGroupId = process.argv[2];
  let mnemonic = process.argv[3] || process.env.REACT_APP_CREATOR_MNEMONIC || '';
  
  if (!txIdOrGroupId) {
    console.error('❌ Error: Transaction ID or Group ID required!');
    console.log('\nUsage:');
    console.log('  node scripts/refund-from-transaction.js <TX_ID_OR_GROUP_ID> [MNEMONIC]');
    console.log('\nExample:');
    console.log('  node scripts/refund-from-transaction.js OB5WS4RU6RAEYGECMTSEMFU74GU5UDEL4F42Q2DKP2ESYXOM74LA "your mnemonic"');
    console.log('\nOr with Group ID:');
    console.log('  node scripts/refund-from-transaction.js stH99MvfVKFjNi1lb89FOrLzmu8x7PcQp6LGYBoFga0= "your mnemonic"');
    process.exit(1);
  }
  
  console.log('\n🔍 Looking up transaction...');
  console.log(`   ID/Group: ${txIdOrGroupId}`);
  
  // Try to get transaction info
  let txInfo = await lookupTransaction(txIdOrGroupId);
  
  if (!txInfo) {
    // Try indexer
    if (typeof fetch !== 'undefined') {
      txInfo = await getTransactionFromIndexer(txIdOrGroupId);
    }
  }
  
  let appId = null;
  
  if (txInfo) {
    // Extract app ID from transaction
    if (txInfo['application-transaction']) {
      appId = txInfo['application-transaction']['application-id'];
    } else if (txInfo['txn'] && txInfo['txn']['apid']) {
      appId = txInfo['txn']['apid'];
    }
    
    if (appId) {
      console.log(`✅ Found App ID: ${appId}`);
    } else {
      console.log('⚠️  Could not extract App ID from transaction');
    }
  } else {
    // If we can't find the transaction, try to extract app ID from common locations
    // or ask user to provide it
    console.log('⚠️  Could not find transaction. You may need to provide the App ID manually.');
    console.log('   Please check the transaction on the explorer and find the App ID.');
  }
  
  // If no app ID found, try to use default or ask user
  if (!appId) {
    const defaultAppId = parseInt(process.env.REACT_APP_CONTRACT_APP_ID) || 749335380;
    console.log(`\n💡 Using default App ID: ${defaultAppId}`);
    console.log('   If this is incorrect, please provide the correct App ID.');
    appId = defaultAppId;
  }
  
  // Get mnemonic if not provided
  if (!mnemonic) {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    mnemonic = await new Promise(resolve => {
      rl.question('\nEnter your 25-word mnemonic phrase (the wallet that created the bounty): ', answer => {
        rl.close();
        resolve(answer);
      });
    });
  }
  
  if (!mnemonic || mnemonic.trim().split(' ').length !== 25) {
    console.error('\n❌ Error: Invalid mnemonic! Must be 25 words.');
    process.exit(1);
  }
  
  // Proceed with refund
  const success = await refundBounty(appId, mnemonic);
  process.exit(success ? 0 : 1);
}

// Run main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

