#!/usr/bin/env node

/**
 * AlgoEase Smart Contract V3 Deployment Script
 * 
 * This script deploys the new redesigned AlgoEase smart contract to Algorand TestNet
 * and updates the frontend configuration.
 */

const algosdk = require('algosdk');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // TestNet configuration
  ALGOD_URL: process.env.ALGOD_URL || 'https://testnet-api.algonode.cloud',
  ALGOD_TOKEN: process.env.ALGOD_TOKEN || '',
  INDEXER_URL: process.env.INDEXER_URL || 'https://testnet-idx.algonode.cloud',
  
  // Contract files (new V3 contracts)
  APPROVAL_PROGRAM_PATH: path.join(__dirname, '../contracts/algoease_approval_v3.teal'),
  CLEAR_PROGRAM_PATH: path.join(__dirname, '../contracts/algoease_clear_v3.teal'),
  
  // Output files
  CONTRACT_INFO_PATH: path.join(__dirname, '../contract-info-v3.json'),
  FRONTEND_ENV_PATH: path.join(__dirname, '../frontend/.env'),
  
  // Network parameters
  NETWORK: 'testnet'
};

class ContractDeployer {
  constructor() {
    this.algodClient = new algosdk.Algodv2(CONFIG.ALGOD_TOKEN, CONFIG.ALGOD_URL, '');
    this.creatorAccount = null;
  }

  // Load creator account from mnemonic or private key
  loadCreatorAccount(mnemonic, privateKey) {
    try {
      console.log('loadCreatorAccount called with mnemonic length:', mnemonic ? mnemonic.length : 0);
      if (mnemonic) {
        console.log('Mnemonic word count in function:', mnemonic.trim().split(/\s+/).length);
      }
      
      if (privateKey) {
        // Try to load from private key directly
        try {
          const privateKeyBytes = typeof privateKey === 'string' 
            ? Buffer.from(privateKey, 'base64') 
            : new Uint8Array(privateKey);
          
          if (privateKeyBytes.length === 64) {
            // Full private key (64 bytes)
            this.creatorAccount = {
              sk: privateKeyBytes,
              addr: algosdk.encodeAddress(algosdk.skToPk(privateKeyBytes))
            };
            console.log('Creator account loaded from private key:', this.creatorAccount.addr);
            return true;
          }
        } catch (pkError) {
          console.warn('Failed to load from private key, trying mnemonic...');
        }
      }
      
      if (!mnemonic) {
        throw new Error('Creator mnemonic or private key is required.');
      }
      
      // Try standard 25-word mnemonic first
      try {
        const trimmedMnemonic = mnemonic.trim();
        const wordCount = trimmedMnemonic.split(/\s+/).length;
        console.log(`Attempting to load account with ${wordCount}-word mnemonic...`);
        
        this.creatorAccount = algosdk.mnemonicToSecretKey(trimmedMnemonic);
        // Handle address encoding - account.addr is an Address object with toString method
        const addr = this.creatorAccount.addr;
        const addrStr = addr.toString ? addr.toString() : 
                       (typeof addr === 'string' ? addr : 
                       (addr instanceof Uint8Array ? algosdk.encodeAddress(addr) : String(addr)));
        console.log('Creator account loaded from mnemonic:', addrStr);
        return true;
      } catch (e) {
        // Check word count for better error message
        const trimmedMnemonic = mnemonic.trim();
        const words = trimmedMnemonic.split(/\s+/);
        const wordCount = words.length;
        console.log(`Mnemonic conversion failed. Word count: ${wordCount}, Error: ${e.message}`);
        
        if (wordCount === 24) {
          console.log('Detected 24-word mnemonic. Attempting BIP39 conversion...');
          // Note: This requires additional library for BIP39 to Algorand conversion
          // For now, we'll suggest using private key export from wallet
          throw new Error('24-word mnemonic detected. Please export the private key from your wallet instead, or use a 25-word Algorand mnemonic.');
        }
        // Re-throw the original error for 25-word mnemonics that fail
        throw e;
      }
    } catch (error) {
      console.error('Failed to load creator account:', error.message);
      console.error('\nOptions:');
      console.error('1. Export private key from your wallet and use CREATOR_PRIVATE_KEY');
      console.error('2. Use a 25-word Algorand mnemonic');
      console.error('3. Check if your wallet can export in Algorand format');
      return false;
    }
  }

  // Read TEAL program from file
  async readTealProgram(filePath) {
    try {
      const program = fs.readFileSync(filePath, 'utf8');
      return program;
    } catch (error) {
      console.error(`Failed to read TEAL program from ${filePath}:`, error.message);
      throw error;
    }
  }

  // Compile TEAL program
  async compileTealProgram(program) {
    try {
      const compiled = await this.algodClient.compile(program).do();
      return new Uint8Array(Buffer.from(compiled.result, 'base64'));
    } catch (error) {
      console.error('Failed to compile TEAL program:', error.message);
      throw error;
    }
  }

  // Deploy the smart contract
  async deployContract() {
    try {
      console.log('Reading TEAL programs...');
      const approvalProgramSource = await this.readTealProgram(CONFIG.APPROVAL_PROGRAM_PATH);
      const clearProgramSource = await this.readTealProgram(CONFIG.CLEAR_PROGRAM_PATH);
      
      console.log('Compiling TEAL programs...');
      const approvalProgram = await this.compileTealProgram(approvalProgramSource);
      const clearProgram = await this.compileTealProgram(clearProgramSource);

      // Get suggested parameters
      const suggestedParams = await this.algodClient.getTransactionParams().do();
      
      // Ensure address is a string
      const fromAddr = this.creatorAccount.addr.toString ? this.creatorAccount.addr.toString() : 
                       (typeof this.creatorAccount.addr === 'string' ? this.creatorAccount.addr : 
                       algosdk.encodeAddress(this.creatorAccount.addr));
      
      console.log('Creating transaction...');
      console.log('From address:', fromAddr);
      console.log('Address valid:', algosdk.isValidAddress(fromAddr));
      
      // Create transaction - use 'sender' instead of 'from'
      const txn = algosdk.makeApplicationCreateTxnFromObject({
        sender: this.creatorAccount.addr,
        suggestedParams,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        approvalProgram,
        clearProgram,
        numGlobalByteSlices: 10,
        numGlobalInts: 10,
        numLocalByteSlices: 0,
        numLocalInts: 0
      });

      // Sign transaction
      const signedTxn = txn.signTxn(this.creatorAccount.sk);

      // Submit transaction
      console.log('Submitting transaction...');
      const txResponse = await this.algodClient.sendRawTransaction(signedTxn).do();
      console.log('Transaction response:', JSON.stringify(txResponse, null, 2));
      // Extract transaction ID from response - algosdk returns {txid: '...'} 
      let txIdString;
      if (typeof txResponse === 'string') {
        txIdString = txResponse;
      } else if (txResponse && typeof txResponse === 'object') {
        // Check for txid property (most common)
        txIdString = txResponse.txid || txResponse.txId;
        // If it's a PostTransactionsResponse object, the txid might be in a different format
        if (!txIdString && txResponse.toString && txResponse.toString().includes('txid')) {
          // Try to extract from string representation
          const match = txResponse.toString().match(/txid['"]?\s*[:=]\s*['"]([^'"]+)['"]/);
          if (match) txIdString = match[1];
        }
        // Last resort: try first property value if it looks like a transaction ID
        if (!txIdString) {
          const values = Object.values(txResponse);
          if (values.length > 0 && typeof values[0] === 'string' && values[0].length === 52) {
            txIdString = values[0];
          }
        }
      }
      
      if (!txIdString) {
        throw new Error('Could not extract transaction ID from response: ' + JSON.stringify(txResponse));
      }
      console.log('Transaction ID:', txIdString);

      // Wait for confirmation (increase timeout to 30 rounds for slower networks)
      console.log('Waiting for confirmation (this may take 30-60 seconds)...');
      let confirmedTxn;
      try {
        confirmedTxn = await algosdk.waitForConfirmation(
          this.algodClient,
          txIdString,
          30
        );
      } catch (waitError) {
        console.log('Wait timed out, checking transaction status via indexer...');
        // Try to get transaction status via indexer
        const indexer = new algosdk.Indexer('', CONFIG.INDEXER_URL, '');
        try {
          const txInfo = await indexer.lookupTransactionByID(txIdString).do();
          if (txInfo.transaction && txInfo.transaction['confirmed-round']) {
            confirmedTxn = {
              'application-index': txInfo.transaction['created-application-index'],
              'confirmed-round': txInfo.transaction['confirmed-round']
            };
            console.log('Transaction confirmed via indexer!');
          } else {
            throw new Error('Transaction not yet confirmed. Please check again later with: node scripts/check-tx-status.js ' + txIdString);
          }
        } catch (indexerError) {
          const txIdForError = typeof txIdString === 'string' ? txIdString : (txIdString?.txid || JSON.stringify(txIdString));
          throw new Error(`Transaction confirmation failed. TX ID: ${txIdForError}. Please check status later with: node scripts/check-tx-status.js ${txIdForError}. Error: ${waitError.message}`);
        }
      }

      // Extract app ID from confirmed transaction
      console.log('Confirmed transaction keys:', Object.keys(confirmedTxn));
      console.log('Confirmed transaction:', JSON.stringify(confirmedTxn, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value, 2));
      
      // Try multiple possible field names (both camelCase and kebab-case)
      let appId = confirmedTxn['application-index'] || 
                  confirmedTxn['created-application-index'] ||
                  confirmedTxn['applicationIndex'] ||
                  confirmedTxn['createdApplicationIndex'];
      
      if (!appId) {
        // Try to get from indexer as fallback
        console.log('App ID not in confirmation, checking indexer...');
        const indexer = new algosdk.Indexer('', CONFIG.INDEXER_URL, '');
        const txInfo = await indexer.lookupTransactionByID(txIdString).do();
        console.log('Indexer transaction keys:', txInfo.transaction ? Object.keys(txInfo.transaction) : 'No transaction');
        if (txInfo.transaction) {
          appId = txInfo.transaction['created-application-index'] || 
                  txInfo.transaction['createdApplicationIndex'];
          if (appId) {
            console.log('Found app ID in indexer:', appId);
          }
        }
      } else {
        console.log('Found app ID in confirmation:', appId);
      }
      
      if (!appId) {
        throw new Error('Could not extract application ID from confirmed transaction. Transaction may not have created an application.');
      }
      
      // Ensure appId is a number
      appId = Number(appId);
      console.log('Smart contract deployed successfully!');
      console.log('Application ID:', appId);

      // Get application address
      const appAddress = algosdk.getApplicationAddress(appId);
      console.log('Application Address:', appAddress);

      // Save contract information
      const contractInfo = {
        appId,
        appAddress,
        network: CONFIG.NETWORK,
        deployedAt: new Date().toISOString(),
        creator: this.creatorAccount.addr.toString ? this.creatorAccount.addr.toString() : 
                 (typeof this.creatorAccount.addr === 'string' ? this.creatorAccount.addr : 
                 algosdk.encodeAddress(this.creatorAccount.addr)),
        algodUrl: CONFIG.ALGOD_URL,
        indexerUrl: CONFIG.INDEXER_URL,
        version: 'v3'
      };

      fs.writeFileSync(CONFIG.CONTRACT_INFO_PATH, JSON.stringify(contractInfo, null, 2));
      console.log('Contract info saved to:', CONFIG.CONTRACT_INFO_PATH);

      // Update frontend environment
      await this.updateFrontendEnv(contractInfo);

      return contractInfo;
    } catch (error) {
      console.error('Deployment failed:', error.message);
      throw error;
    }
  }

  // Update frontend environment file
  async updateFrontendEnv(contractInfo) {
    try {
      const envPath = CONFIG.FRONTEND_ENV_PATH;
      let envContent = '';

      // Read existing .env if it exists
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }

      // Update or add contract app ID
      const appIdLine = `REACT_APP_CONTRACT_APP_ID=${contractInfo.appId}`;
      if (envContent.includes('REACT_APP_CONTRACT_APP_ID=')) {
        envContent = envContent.replace(
          /REACT_APP_CONTRACT_APP_ID=.*/,
          appIdLine
        );
      } else {
        envContent += `\n${appIdLine}\n`;
      }

      // Update or add network URLs
      const algodLine = `REACT_APP_ALGOD_URL=${contractInfo.algodUrl}`;
      if (envContent.includes('REACT_APP_ALGOD_URL=')) {
        envContent = envContent.replace(/REACT_APP_ALGOD_URL=.*/, algodLine);
      } else {
        envContent += `${algodLine}\n`;
      }

      const indexerLine = `REACT_APP_INDEXER_URL=${contractInfo.indexerUrl}`;
      if (envContent.includes('REACT_APP_INDEXER_URL=')) {
        envContent = envContent.replace(/REACT_APP_INDEXER_URL=.*/, indexerLine);
      } else {
        envContent += `${indexerLine}\n`;
      }

      // Write updated .env
      fs.writeFileSync(envPath, envContent);
      console.log('Frontend .env updated:', envPath);
    } catch (error) {
      console.warn('Failed to update frontend .env:', error.message);
    }
  }
}

// Main execution
async function main() {
  const deployer = new ContractDeployer();
  
  // Get creator mnemonic or private key from environment or contract.env file
  let mnemonic = process.env.CREATOR_MNEMONIC;
  let privateKey = process.env.CREATOR_PRIVATE_KEY;
  
  console.log('Environment check - mnemonic:', mnemonic ? `set (${mnemonic.length} chars)` : 'not set');
  console.log('Environment check - privateKey:', privateKey ? 'set' : 'not set');
  
  // If not in environment, try reading from contract.env
  if (!mnemonic && !privateKey) {
    const contractEnvPath = path.join(__dirname, '../contract.env');
    if (fs.existsSync(contractEnvPath)) {
      const envContent = fs.readFileSync(contractEnvPath, 'utf8');
      // Parse line by line to handle long mnemonics properly
      const lines = envContent.split(/\r?\n/);
      for (const line of lines) {
        if (line.startsWith('REACT_APP_CREATOR_MNEMONIC=')) {
          mnemonic = line.substring('REACT_APP_CREATOR_MNEMONIC='.length).trim();
          const wordCount = mnemonic.split(/\s+/).length;
          console.log(`Read mnemonic from file (${wordCount} words, ${mnemonic.length} chars)`);
          break;
        }
        if (line.startsWith('REACT_APP_CREATOR_PRIVATE_KEY=') && !line.startsWith('#')) {
          privateKey = line.substring('REACT_APP_CREATOR_PRIVATE_KEY='.length).trim();
        }
      }
    }
  }
  
  if (!deployer.loadCreatorAccount(mnemonic, privateKey)) {
    console.error('\n=== Setup Required ===');
    console.error('Please provide one of the following:');
    console.error('1. CREATOR_PRIVATE_KEY (base64 encoded private key from wallet)');
    console.error('2. CREATOR_MNEMONIC (25-word Algorand mnemonic)');
    console.error('\nTo get private key from Pera Wallet:');
    console.error('1. Open Pera Wallet');
    console.error('2. Go to Settings > Security > Export Private Key');
    console.error('3. Copy the private key (base64 format)');
    console.error('4. Set CREATOR_PRIVATE_KEY environment variable or add to contract.env');
    console.error('\nSee scripts/get-private-key-instructions.md for detailed instructions.');
    process.exit(1);
  }

  try {
    const contractInfo = await deployer.deployContract();
    console.log('\n=== Deployment Summary ===');
    console.log('App ID:', contractInfo.appId);
    console.log('App Address:', contractInfo.appAddress);
    console.log('Network:', contractInfo.network);
    console.log('\nNext steps:');
    console.log('1. Update frontend to use the new contract');
    console.log('2. Test contract interactions');
    console.log('3. Update backend if needed');
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ContractDeployer;

