/**
 * Test script to create a real bounty on Algorand Testnet
 * This requires testnet ALGOs and a mnemonic/private key
 */

const algosdk = require('algosdk');
require('dotenv').config();

// Configuration
const ALGOD_SERVER = process.env.ALGOD_SERVER || 'https://testnet-api.algonode.cloud';
const ALGOD_TOKEN = process.env.ALGOD_TOKEN || '';
const ALGOD_PORT = process.env.ALGOD_PORT || '';
const CONTRACT_APP_ID = parseInt(process.env.CONTRACT_APP_ID) || 749648617;

// Initialize Algod client
const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

/**
 * Get account from mnemonic
 * IMPORTANT: Never commit mnemonics to git!
 * For testing, you can get testnet ALGOs from: https://bank.testnet.algorand.network/
 */
function getAccountFromMnemonic(mnemonic) {
  try {
    const account = algosdk.mnemonicToSecretKey(mnemonic);
    return account;
  } catch (error) {
    throw new Error('Invalid mnemonic: ' + error.message);
  }
}

/**
 * Get account balance
 */
async function getAccountBalance(address) {
  try {
    const accountInfo = await algodClient.accountInformation(address).do();
    return accountInfo.amount / 1_000_000; // Convert microALGO to ALGO
  } catch (error) {
    throw new Error('Failed to get account balance: ' + error.message);
  }
}

/**
 * Get application address
 */
function getApplicationAddress(appId) {
  return algosdk.getApplicationAddress(appId);
}

/**
 * Create a real bounty on testnet
 */
async function createRealBounty(mnemonic, amountAlgo, deadline, description, verifierAddress) {
  try {
    console.log('\n🎯 Creating Real Bounty on Algorand Testnet...');
    console.log('=' .repeat(60));

    // Get account from mnemonic
    const account = getAccountFromMnemonic(mnemonic);
    console.log(`👤 Account: ${account.addr}`);

    // Check balance
    const balance = await getAccountBalance(account.addr);
    console.log(`💳 Balance: ${balance} ALGO`);

    if (balance < amountAlgo + 0.1) {
      throw new Error(`Insufficient funds! Need at least ${amountAlgo + 0.1} ALGO (including fees)`);
    }

    // Get application address
    const appAddress = getApplicationAddress(CONTRACT_APP_ID);
    console.log(`🏦 Contract Address: ${appAddress}`);
    console.log(`📋 Contract App ID: ${CONTRACT_APP_ID}`);

    // Get suggested params
    const suggestedParams = await algodClient.getTransactionParams().do();

    // Convert amount to microALGO
    const amountMicroAlgo = Math.floor(amountAlgo * 1_000_000);

    // Transaction 1: Payment to contract (escrow)
    const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: account.addr,
      to: appAddress,
      amount: amountMicroAlgo,
      suggestedParams,
      note: new Uint8Array(Buffer.from('AlgoEase: Bounty Payment'))
    });

    // Transaction 2: App call to create bounty
    const appArgs = [
      new Uint8Array(Buffer.from('create_bounty')),
      algosdk.encodeUint64(amountMicroAlgo),
      algosdk.encodeUint64(deadline),
      new Uint8Array(Buffer.from(description))
    ];

    const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
      from: account.addr,
      appIndex: CONTRACT_APP_ID,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      suggestedParams,
      appArgs,
      accounts: verifierAddress ? [verifierAddress] : []
    });

    // Group transactions
    const groupedTxn = algosdk.assignGroupID([paymentTxn, appCallTxn]);

    // Sign transactions
    const signedPayment = algosdk.signTransaction(groupedTxn[0], account.sk);
    const signedAppCall = algosdk.signTransaction(groupedTxn[1], account.sk);

    console.log('\n📤 Sending transactions to testnet...');

    // Send transactions
    const { txid } = await algodClient.sendRawTransaction([
      signedPayment.blob,
      signedAppCall.blob
    ]).do();

    console.log(`✅ Transaction ID: ${txid}`);
    console.log(`🔗 View on explorer: https://testnet.algoexplorer.io/tx/${txid}`);

    // Wait for confirmation
    console.log('⏳ Waiting for confirmation...');
    const confirmedTxn = await algosdk.waitForConfirmation(
      algodClient,
      txid,
      10
    );

    console.log('\n' + '='.repeat(60));
    console.log('🎉 BOUNTY CREATED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log(`💰 ${amountAlgo} ALGO is now in ESCROW`);
    console.log(`🔒 Funds locked in contract: ${appAddress}`);
    console.log(`📝 Description: ${description}`);
    console.log(`⏰ Deadline: ${new Date(deadline * 1000).toISOString()}`);
    console.log('='.repeat(60));

    return {
      txid,
      appAddress,
      amount: amountAlgo,
      deadline: new Date(deadline * 1000).toISOString()
    };

  } catch (error) {
    console.error('\n❌ Error creating bounty:', error.message);
    throw error;
  }
}

// Main execution
async function main() {
  // Get mnemonic from environment or prompt
  const mnemonic = process.env.TESTNET_MNEMONIC;
  
  if (!mnemonic) {
    console.error('❌ Error: TESTNET_MNEMONIC not found in .env file');
    console.log('\nTo test with real testnet ALGOs:');
    console.log('1. Get testnet ALGOs from: https://bank.testnet.algorand.network/');
    console.log('2. Add your mnemonic to .env file: TESTNET_MNEMONIC="your 25 word mnemonic"');
    console.log('3. Run this script again');
    process.exit(1);
  }

  // Bounty parameters
  const amountAlgo = 0.1; // 0.1 ALGO for testing
  const deadline = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days from now
  const description = 'Test bounty created via Supabase integration';
  const verifierAddress = null; // Optional: set a verifier address

  try {
    const result = await createRealBounty(
      mnemonic,
      amountAlgo,
      deadline,
      description,
      verifierAddress
    );

    console.log('\n✅ Success! Bounty created on testnet.');
    console.log('You can now create the metadata in Supabase using the contract ID from the transaction.');

  } catch (error) {
    console.error('\n❌ Failed to create bounty:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { createRealBounty, getAccountBalance };

















