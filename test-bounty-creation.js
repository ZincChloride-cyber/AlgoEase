/**
 * Test script to diagnose bounty creation issue
 * Run with: node test-bounty-creation.js
 */

const algosdk = require('algosdk');

// Configuration
const APP_ID = 749335380;
const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = '';
const ALGOD_TOKEN = '';

// Test account (replace with your actual mnemonic for testing)
const SENDER_MNEMONIC = 'YOUR_25_WORD_MNEMONIC_HERE';

async function testBountyCreation() {
  try {
    // Initialize algod client
    const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);
    
    // Recover account from mnemonic
    const senderAccount = algosdk.mnemonicToSecretKey(SENDER_MNEMONIC);
    const sender = senderAccount.addr;
    
    console.log('Sender address:', sender);
    
    // Get suggested params
    const suggestedParams = await algodClient.getTransactionParams().do();
    console.log('Suggested params:', {
      fee: suggestedParams.fee,
      firstRound: suggestedParams.firstRound,
      lastRound: suggestedParams.lastRound
    });
    
    // Test parameters
    const amount = 1; // 1 ALGO
    const amountMicroAlgo = Math.round(amount * 1000000);
    const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
    const taskDescription = 'Test bounty task';
    const verifierAddress = sender; // Using sender as verifier for test
    
    console.log('\nBounty parameters:');
    console.log('- Amount (ALGO):', amount);
    console.log('- Amount (microALGO):', amountMicroAlgo);
    console.log('- Deadline:', new Date(deadline * 1000).toISOString());
    console.log('- Task:', taskDescription);
    console.log('- Verifier:', verifierAddress);
    
    // Get contract address
    const contractAddress = algosdk.getApplicationAddress(APP_ID);
    console.log('\nContract address:', contractAddress);
    
    // Create payment transaction
    const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: sender,
      to: contractAddress,
      amount: amountMicroAlgo,
      suggestedParams,
      note: new Uint8Array(Buffer.from('AlgoEase: Bounty Payment', 'utf-8'))
    });
    
    console.log('\nPayment transaction:');
    console.log('- From:', paymentTxn.from.toString());
    console.log('- To:', paymentTxn.to.toString());
    console.log('- Amount:', paymentTxn.amount);
    console.log('- Fee:', paymentTxn.fee);
    
    // Create app call transaction
    const appArgs = [
      new Uint8Array(Buffer.from('create_bounty', 'utf-8')),
      algosdk.encodeUint64(amountMicroAlgo),
      algosdk.encodeUint64(deadline),
      new Uint8Array(Buffer.from(taskDescription, 'utf-8'))
    ];
    
    // Only include verifier in foreignAccounts if different from sender
    const foreignAccounts = verifierAddress !== sender ? [verifierAddress] : [];
    
    const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
      from: sender,
      appIndex: APP_ID,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      suggestedParams,
      appArgs,
      accounts: foreignAccounts,
      note: new Uint8Array(Buffer.from('AlgoEase: Create Bounty', 'utf-8'))
    });
    
    console.log('\nApp call transaction:');
    console.log('- From:', appCallTxn.from.toString());
    console.log('- App ID:', appCallTxn.appIndex);
    console.log('- App args count:', appCallTxn.appArgs.length);
    console.log('- Foreign accounts:', foreignAccounts);
    console.log('- Fee:', appCallTxn.fee);
    
    // Group transactions
    const txns = [paymentTxn, appCallTxn];
    algosdk.assignGroupID(txns);
    
    console.log('\nTransaction group ID:', Buffer.from(txns[0].group).toString('base64'));
    
    // Sign transactions
    const signedPaymentTxn = paymentTxn.signTxn(senderAccount.sk);
    const signedAppCallTxn = appCallTxn.signTxn(senderAccount.sk);
    
    console.log('\nTransactions signed successfully');
    console.log('Ready to submit to network...');
    console.log('\nTo submit, uncomment the following lines in the script');
    
    // UNCOMMENT TO ACTUALLY SUBMIT:
    /*
    const { txId } = await algodClient.sendRawTransaction([signedPaymentTxn, signedAppCallTxn]).do();
    console.log('\nTransaction ID:', txId);
    console.log('Waiting for confirmation...');
    
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
    console.log('\nTransaction confirmed in round:', confirmedTxn['confirmed-round']);
    */
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.body || error.response.text);
    }
    console.error('\nFull error:', error);
  }
}

// Run the test
testBountyCreation();
