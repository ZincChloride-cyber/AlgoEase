#!/usr/bin/env node

/**
 * Check Contract State Utility
 * 
 * This script checks the state of a contract to see if there's an active bounty.
 * Usage: node scripts/check-contract-state.js [APP_ID]
 */

const algosdk = require('algosdk');

// Configuration
const ALGOD_URL = process.env.REACT_APP_ALGOD_URL || 'https://testnet-api.algonode.cloud';
const APP_ID = process.argv[2] 
  ? parseInt(process.argv[2]) 
  : (parseInt(process.env.REACT_APP_CONTRACT_APP_ID) || 749335380);

// Initialize Algod client
const algodClient = new algosdk.Algodv2('', ALGOD_URL, '');

async function checkContractState() {
  try {
    console.log(`\n📋 Checking Contract State for APP_ID: ${APP_ID}`);
    console.log('='.repeat(80));

    // Get contract info
    const appInfo = await algodClient.getApplicationByID(APP_ID).do();
    const globalState = appInfo.params['global-state'] || [];
    
    let state = {};
    globalState.forEach(item => {
      const key = Buffer.from(item.key, 'base64').toString('utf8');
      if (item.value.type === 1) {
        state[key] = Number(item.value.uint);
      } else if (item.value.type === 2) {
        const bytes = Buffer.from(item.value.bytes, 'base64');
        // Try to decode as string first
        try {
          state[key] = bytes.toString('utf8');
        } catch {
          state[key] = bytes.toString('hex');
        }
      }
    });

    console.log('\n📊 Contract Global State:');
    console.log('   Status:', state.status || 0, `(${getStatusName(state.status || 0)})`);
    console.log('   Amount:', state.amount ? `${(Number(state.amount) / 1_000_000).toFixed(6)} ALGO` : '0 ALGO');
    console.log('   Bounty Count:', state.bounty_count || 0);
    console.log('   Client:', state.client_addr || '(none)');
    console.log('   Freelancer:', state.freelancer_addr || '(none)');
    console.log('   Verifier:', state.verifier_addr || '(none)');
    if (state.deadline) {
      const deadlineDate = new Date(Number(state.deadline) * 1000);
      console.log('   Deadline:', deadlineDate.toLocaleString());
    } else {
      console.log('   Deadline: (none)');
    }
    if (state.task_desc) {
      const taskDesc = state.task_desc.length > 100 
        ? state.task_desc.substring(0, 100) + '...' 
        : state.task_desc;
      console.log('   Task Description:', taskDesc);
    }

    const hasActiveBounty = state.amount && Number(state.amount) > 0 && 
                           state.status !== 3 && state.status !== 4;

    console.log('\n' + '='.repeat(80));
    if (hasActiveBounty) {
      console.log('⚠️  ACTIVE BOUNTY FOUND!');
      console.log('   This contract has an active bounty that needs to be resolved.');
    } else {
      console.log('✅ NO ACTIVE BOUNTY');
      console.log('   This contract has no active bounty. You can create a new one.');
    }
    console.log('='.repeat(80) + '\n');

    return state;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error(`\n❌ Error: Contract with APP_ID ${APP_ID} not found!`);
      console.error('   The contract may not exist or the APP_ID is incorrect.\n');
    } else {
      console.error('\n❌ Error:', error.message);
      if (error.response && error.response.body) {
        console.error('Details:', JSON.stringify(error.response.body, null, 2));
      }
    }
    return null;
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

// Run the check
checkContractState()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
