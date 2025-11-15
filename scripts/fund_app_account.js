/**
 * Script to fund the application account for box storage
 * Run with: node scripts/fund_app_account.js
 */

require('dotenv').config();
const algosdk = require('algosdk');
const fs = require('fs');
const path = require('path');

// Load contract info
const contractInfoPath = path.join(__dirname, '..', 'contract-info.json');
const contractEnvPath = path.join(__dirname, '..', 'contract.env');

let contractInfo = {};
if (fs.existsSync(contractInfoPath)) {
  contractInfo = JSON.parse(fs.readFileSync(contractInfoPath, 'utf8'));
}

// Load environment variables
function loadEnvFile(filepath) {
  const envVars = {};
  if (fs.existsSync(filepath)) {
    const content = fs.readFileSync(filepath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        envVars[key.trim()] = value;
      }
    });
  }
  return envVars;
}

const contractEnv = loadEnvFile(contractEnvPath);

// Configuration
const ALGOD_URL = process.env.ALGOD_URL || 'https://testnet-api.algonode.cloud';
const ALGOD_TOKEN = process.env.ALGOD_TOKEN || '';
const CREATOR_MNEMONIC = process.env.REACT_APP_CREATOR_MNEMONIC || 
                         process.env.CREATOR_MNEMONIC || 
                         contractEnv.REACT_APP_CREATOR_MNEMONIC || 
                         contractEnv.CREATOR_MNEMONIC;

const APP_ID = contractInfo.appId || 
               process.env.REACT_APP_CONTRACT_APP_ID || 
               contractEnv.REACT_APP_CONTRACT_APP_ID || 
               749646001;

const FUND_AMOUNT_ALGO = parseFloat(process.env.FUND_AMOUNT || '0.01'); // Default 0.01 ALGO
const FUND_AMOUNT_MICROALGO = Math.round(FUND_AMOUNT_ALGO * 1000000);

// Initialize Algod client
const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_URL, '');

async function fundAppAccount() {
  try {
    console.log('=== Funding Application Account for Box Storage ===\n');

    // Validate configuration
    if (!CREATOR_MNEMONIC) {
      throw new Error('Creator mnemonic not found. Please set REACT_APP_CREATOR_MNEMONIC in contract.env');
    }

    if (!APP_ID) {
      throw new Error('Application ID not found. Please deploy the contract first.');
    }

    // Get creator account
    const creatorAccount = algosdk.mnemonicToSecretKey(CREATOR_MNEMONIC);
    console.log('Creator address:', creatorAccount.addr);

    // Get application address
    const appAddress = algosdk.getApplicationAddress(APP_ID);
    console.log('Application address:', appAddress);
    console.log('Application ID:', APP_ID);
    console.log('');

    // Check creator balance
    const creatorInfo = await algodClient.accountInformation(creatorAccount.addr).do();
    const creatorBalance = creatorInfo.amount / 1000000;
    console.log('Creator balance:', creatorBalance, 'ALGO');

    if (creatorBalance < FUND_AMOUNT_ALGO + 0.001) {
      throw new Error(`Insufficient balance. Need at least ${FUND_AMOUNT_ALGO + 0.001} ALGO (have ${creatorBalance} ALGO)`);
    }

    // Check app account balance
    let appBalance = 0;
    try {
      const appInfo = await algodClient.accountInformation(appAddress).do();
      appBalance = appInfo.amount / 1000000;
      console.log('App account balance (before):', appBalance, 'ALGO');
    } catch (error) {
      if (error.status === 404) {
        console.log('App account not found (new account, balance = 0)');
      } else {
        throw error;
      }
    }
    console.log('');

    // Create payment transaction
    console.log('Creating payment transaction...');
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: creatorAccount.addr,
      to: appAddress,
      amount: FUND_AMOUNT_MICROALGO,
      suggestedParams,
      note: new Uint8Array(Buffer.from('AlgoEase: Fund app account for box storage'))
    });

    // Sign transaction
    console.log('Signing transaction...');
    const signedTxn = paymentTxn.signTxn(creatorAccount.sk);

    // Submit transaction
    console.log('Submitting transaction...');
    const txId = await algodClient.sendRawTransaction(signedTxn).do();
    console.log('Transaction ID:', txId);
    console.log('');

    // Wait for confirmation
    console.log('Waiting for confirmation...');
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 10);
    console.log('Transaction confirmed in round:', confirmedTxn['confirmed-round']);
    console.log('');

    // Check new app account balance
    const newAppInfo = await algodClient.accountInformation(appAddress).do();
    const newAppBalance = newAppInfo.amount / 1000000;
    console.log('App account balance (after):', newAppBalance, 'ALGO');
    console.log('');

    console.log('=== Funding Complete ===');
    console.log('✅ Application account funded successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Try creating a bounty in the UI');
    console.log('2. The box storage should now work correctly');
    console.log('');

  } catch (error) {
    console.error('❌ Error funding app account:', error.message);
    if (error.response) {
      console.error('Error details:', error.response.body);
    }
    process.exit(1);
  }
}

// Run the script
fundAppAccount()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

