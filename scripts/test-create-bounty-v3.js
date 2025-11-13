#!/usr/bin/env node

/**
 * Test script to create a bounty on the deployed V3 contract
 */

const algosdk = require('algosdk');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  ALGOD_URL: process.env.ALGOD_URL || 'https://testnet-api.algonode.cloud',
  ALGOD_TOKEN: process.env.ALGOD_TOKEN || '',
  APP_ID: 749540140, // V3 contract App ID
};

// Load contract info
let contractInfo;
try {
  contractInfo = JSON.parse(fs.readFileSync(path.join(__dirname, '../contract-info-v3.json'), 'utf8'));
  CONFIG.APP_ID = contractInfo.appId;
} catch (e) {
  console.log('Using hardcoded App ID:', CONFIG.APP_ID);
}

// Load creator account
let creatorAccount;
const mnemonic = process.env.CREATOR_MNEMONIC;
if (!mnemonic) {
  // Try reading from contract.env
  const contractEnvPath = path.join(__dirname, '../contract.env');
  if (fs.existsSync(contractEnvPath)) {
    const envContent = fs.readFileSync(contractEnvPath, 'utf8');
    const lines = envContent.split(/\r?\n/);
    for (const line of lines) {
      if (line.startsWith('REACT_APP_CREATOR_MNEMONIC=')) {
        const mnemonicFromFile = line.substring('REACT_APP_CREATOR_MNEMONIC='.length).trim();
        creatorAccount = algosdk.mnemonicToSecretKey(mnemonicFromFile);
        break;
      }
    }
  }
} else {
  creatorAccount = algosdk.mnemonicToSecretKey(mnemonic);
}

if (!creatorAccount) {
  console.error('❌ Creator mnemonic not found. Set CREATOR_MNEMONIC environment variable or add to contract.env');
  process.exit(1);
}

const algodClient = new algosdk.Algodv2(CONFIG.ALGOD_TOKEN, CONFIG.ALGOD_URL, '');

async function createBounty() {
  try {
    // Convert address to string if it's an Address object
    const creatorAddrStr = typeof creatorAccount.addr === 'string' 
      ? creatorAccount.addr 
      : (creatorAccount.addr.toString ? creatorAccount.addr.toString() : algosdk.encodeAddress(creatorAccount.addr));
    
    console.log('🧪 Testing V3 Contract - Create Bounty');
    console.log('=' .repeat(60));
    console.log('App ID:', CONFIG.APP_ID);
    console.log('Creator:', creatorAddrStr);
    
    // Get account balance
    const accountInfo = await algodClient.accountInformation(creatorAddrStr).do();
    const balance = Number(accountInfo.amount) / 1_000_000;
    console.log('Balance:', balance, 'ALGO');
    
    if (balance < 0.1) {
      console.error('❌ Insufficient balance. Need at least 0.1 ALGO for fees.');
      return;
    }
    
    // Test bounty parameters
    const amountAlgo = 0.1; // 0.1 ALGO for testing
    const amountMicroAlgo = BigInt(Math.floor(amountAlgo * 1_000_000));
    const deadline = BigInt(Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)); // 7 days from now
    const taskDescription = 'Test bounty for V3 contract deployment verification';
    const verifierAddress = creatorAddrStr; // Using creator as verifier for testing
    
    // Ensure verifierAddress is a string
    if (typeof verifierAddress !== 'string') {
      throw new Error('Verifier address must be a string');
    }
    
    console.log('\n📋 Bounty Details:');
    console.log('Amount:', amountAlgo, 'ALGO');
    console.log('Deadline:', new Date(Number(deadline) * 1000).toISOString());
    console.log('Task:', taskDescription);
    console.log('Verifier:', verifierAddress);
    console.log('Verifier type:', typeof verifierAddress);
    
    // Get contract address
    const appAddress = algosdk.getApplicationAddress(CONFIG.APP_ID);
    let appAddressStr = typeof appAddress === 'string' 
      ? appAddress 
      : (appAddress.toString ? appAddress.toString() : algosdk.encodeAddress(appAddress));
    console.log('Contract Address:', appAddressStr);
    
    // Check current contract state
    console.log('\n📊 Checking current contract state...');
    try {
      const appInfo = await algodClient.getApplicationByID(CONFIG.APP_ID).do();
      const globalState = appInfo.params['global-state'] || [];
      
      const stateMap = {};
      globalState.forEach(item => {
        const key = Buffer.from(item.key, 'base64').toString('utf8');
        if (item.value.type === 1) { // bytes
          const bytes = Buffer.from(item.value.bytes, 'base64');
          if (key.includes('addr') && bytes.length === 32) {
            stateMap[key] = algosdk.encodeAddress(new Uint8Array(bytes));
          } else {
            stateMap[key] = bytes.toString('utf8');
          }
        } else { // uint
          stateMap[key] = item.value.uint;
        }
      });
      
      console.log('Current Status:', stateMap.status || 'N/A');
      console.log('Current Amount:', stateMap.amount ? (Number(stateMap.amount) / 1_000_000) + ' ALGO' : '0 ALGO');
      
      // Check if we can create a new bounty
      const currentStatus = Number(stateMap.status) || 4; // Default to REFUNDED if not set
      const currentAmount = Number(stateMap.amount) || 0;
      
      if (currentStatus !== 3 && currentStatus !== 4 && currentAmount > 0) {
        console.log('⚠️  Warning: There is an active bounty. Status:', currentStatus);
        console.log('   You may need to complete or refund the current bounty first.');
      }
    } catch (e) {
      console.log('Could not read contract state:', e.message);
    }
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Validate all addresses are strings and valid Algorand addresses
    console.log('\n🔍 Validating addresses...');
    console.log('creatorAddrStr type:', typeof creatorAddrStr, 'value:', creatorAddrStr);
    console.log('appAddressStr type:', typeof appAddressStr, 'value:', appAddressStr);
    console.log('verifierAddress type:', typeof verifierAddress, 'value:', verifierAddress);
    
    if (!creatorAddrStr || typeof creatorAddrStr !== 'string') {
      throw new Error('Invalid creator address');
    }
    if (!algosdk.isValidAddress(creatorAddrStr)) {
      throw new Error('Creator address is not a valid Algorand address: ' + creatorAddrStr);
    }
    if (!appAddressStr || typeof appAddressStr !== 'string') {
      throw new Error('Invalid app address');
    }
    if (!algosdk.isValidAddress(appAddressStr)) {
      throw new Error('App address is not a valid Algorand address: ' + appAddressStr);
    }
    if (!verifierAddress || typeof verifierAddress !== 'string') {
      throw new Error('Invalid verifier address');
    }
    if (!algosdk.isValidAddress(verifierAddress)) {
      throw new Error('Verifier address is not a valid Algorand address: ' + verifierAddress);
    }
    console.log('✅ All addresses are valid');
    
    // Create payment transaction (Gtxn[0])
    console.log('\n📝 Creating payment transaction...');
    // Use Address objects directly (algosdk might prefer this)
    const fromAddr = creatorAccount.addr;
    const toAddr = appAddress; // Use the Address object, not string
    console.log('Using from (type):', typeof fromAddr, fromAddr);
    console.log('Using to (type):', typeof toAddr, toAddr);
    console.log('Using amount:', Number(amountMicroAlgo));
    
    let paymentTxn;
    try {
      paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: fromAddr,
        to: toAddr,
        amount: Number(amountMicroAlgo),
        suggestedParams: suggestedParams
      });
      console.log('✅ Payment transaction created');
    } catch (e) {
      console.error('Error with Address objects, trying strings:', e.message);
      // Fallback to strings
      paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: creatorAddrStr,
        to: appAddressStr,
        amount: Number(amountMicroAlgo),
        suggestedParams: suggestedParams
      });
      console.log('✅ Payment transaction created with strings');
    }
    
    // Create app call transaction (Gtxn[1])
    console.log('📝 Creating app call transaction...');
    const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
      sender: creatorAddrStr,
      appIndex: CONFIG.APP_ID,
      onComplete: algosdk.OnComplete.NoOpOC,
      appArgs: [
        new Uint8Array(Buffer.from('create_bounty')),
        algosdk.encodeUint64(amountMicroAlgo),
        algosdk.encodeUint64(deadline),
        new Uint8Array(Buffer.from(taskDescription))
      ],
      accounts: [verifierAddress],
      suggestedParams
    });
    console.log('✅ App call transaction created');
    
    // Assign group ID
    const groupID = algosdk.computeGroupID([paymentTxn, appCallTxn]);
    paymentTxn.group = groupID;
    appCallTxn.group = groupID;
    
    // Sign transactions
    const signedPayment = paymentTxn.signTxn(creatorAccount.sk);
    const signedAppCall = appCallTxn.signTxn(creatorAccount.sk);
    
    // Submit grouped transaction
    console.log('\n📤 Submitting transaction...');
    const txResponse = await algodClient.sendRawTransaction([signedPayment, signedAppCall]).do();
    
    let txId;
    if (typeof txResponse === 'string') {
      txId = txResponse;
    } else {
      txId = txResponse.txid || Object.values(txResponse)[0];
    }
    
    console.log('Transaction ID:', txId);
    console.log('⏳ Waiting for confirmation...');
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 10);
    console.log('✅ Transaction confirmed in round:', confirmedTxn['confirmed-round']);
    
    // Verify the bounty was created
    console.log('\n🔍 Verifying bounty creation...');
    const appInfo = await algodClient.getApplicationByID(CONFIG.APP_ID).do();
    const globalState = appInfo.params['global-state'] || [];
    
    const stateMap = {};
    globalState.forEach(item => {
      const key = Buffer.from(item.key, 'base64').toString('utf8');
      if (item.value.type === 1) { // bytes
        const bytes = Buffer.from(item.value.bytes, 'base64');
        if (key.includes('addr') && bytes.length === 32) {
          stateMap[key] = algosdk.encodeAddress(new Uint8Array(bytes));
        } else {
          stateMap[key] = bytes.toString('utf8');
        }
      } else { // uint
        stateMap[key] = item.value.uint;
      }
    });
    
    console.log('\n✅ Bounty Created Successfully!');
    console.log('=' .repeat(60));
    console.log('Status:', Number(stateMap.status) === 0 ? 'OPEN' : Number(stateMap.status));
    console.log('Amount:', stateMap.amount ? (Number(stateMap.amount) / 1_000_000) + ' ALGO' : 'N/A');
    console.log('Client:', stateMap.client_addr || 'N/A');
    console.log('Verifier:', stateMap.verifier_addr || 'N/A');
    console.log('Task:', stateMap.task_desc || 'N/A');
    console.log('Bounty Count:', Number(stateMap.bounty_count) || 0);
    console.log('=' .repeat(60));
    console.log('\n🎉 Test completed successfully!');
    console.log('View on AlgoExplorer: https://testnet.algoexplorer.io/tx/' + txId);
    
  } catch (error) {
    console.error('\n❌ Error creating bounty:', error.message);
    if (error.response && error.response.body) {
      console.error('Error details:', JSON.stringify(error.response.body, null, 2));
    }
    process.exit(1);
  }
}

// Run the test
createBounty();

