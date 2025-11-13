const algosdk = require('algosdk');
const fs = require('fs');
const path = require('path');

const ALGOD_URL = 'https://testnet-api.algonode.cloud';
const algodClient = new algosdk.Algodv2('', ALGOD_URL, '');

// Get mnemonic from contract.env
const contractEnvPath = path.join(__dirname, '../contract.env');
let mnemonic = process.env.CREATOR_MNEMONIC;

if (!mnemonic && fs.existsSync(contractEnvPath)) {
  const envContent = fs.readFileSync(contractEnvPath, 'utf8');
  const lines = envContent.split(/\r?\n/);
  for (const line of lines) {
    if (line.startsWith('REACT_APP_CREATOR_MNEMONIC=')) {
      mnemonic = line.substring('REACT_APP_CREATOR_MNEMONIC='.length).trim();
      break;
    }
  }
}

if (!mnemonic) {
  console.error('No mnemonic found');
  process.exit(1);
}

const account = algosdk.mnemonicToSecretKey(mnemonic);
const address = account.addr.toString ? account.addr.toString() : 
                (typeof account.addr === 'string' ? account.addr : 
                algosdk.encodeAddress(account.addr));

async function checkBalance() {
  try {
    const accountInfo = await algodClient.accountInformation(address).do();
    const balanceMicroAlgo = Number(accountInfo.amount);
    const balance = balanceMicroAlgo / 1000000; // Convert from microALGO to ALGO
    console.log(`Account: ${address}`);
    console.log(`Balance: ${balance} ALGO`);
    console.log(`Balance (microALGO): ${balanceMicroAlgo}`);
    
    if (balance < 0.1) {
      console.log('\n⚠️  WARNING: Low balance! You need at least 0.1 ALGO for transaction fees.');
      console.log('Get testnet ALGO from: https://bank.testnet.algorand.network/');
    } else {
      console.log('\n✅ Sufficient balance for deployment');
    }
  } catch (error) {
    console.error('Error checking balance:', error.message);
  }
}

checkBalance();

