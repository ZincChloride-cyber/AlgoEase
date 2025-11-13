#!/usr/bin/env node

/**
 * AlgoEase Smart Contract Deployment Script
 * 
 * This script deploys the AlgoEase smart contract to the Algorand TestNet
 * and updates the frontend configuration with the deployed contract address.
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
  INDEXER_TOKEN: process.env.INDEXER_TOKEN || '',
  
  // Contract files
  APPROVAL_PROGRAM_PATH: path.join(__dirname, '../projects/algoease-contracts/algoease_approval.teal'),
  CLEAR_PROGRAM_PATH: path.join(__dirname, '../projects/algoease-contracts/algoease_clear.teal'),
  
  // Output files
  CONTRACT_INFO_PATH: path.join(__dirname, '../contract-info.json'),
  FRONTEND_ENV_PATH: path.join(__dirname, '../projects/algoease-frontend/.env.local'),
  
  // Network parameters
  NETWORK: 'testnet'
};

class ContractDeployer {
  constructor() {
    this.algodClient = new algosdk.Algodv2(CONFIG.ALGOD_TOKEN, CONFIG.ALGOD_URL, '');
    this.indexerClient = new algosdk.Indexer(CONFIG.INDEXER_TOKEN, CONFIG.INDEXER_URL, '');
    this.creatorAccount = null;
  }

  // Load creator account from mnemonic
  loadCreatorAccount(mnemonic) {
    try {
      this.creatorAccount = algosdk.mnemonicToSecretKey(mnemonic);
      console.log('✅ Creator account loaded:', this.creatorAccount.addr);
      return true;
    } catch (error) {
      console.error('❌ Failed to load creator account:', error.message);
      return false;
    }
  }

  // Read TEAL program from file
  async readTealProgram(filePath) {
    try {
      const program = fs.readFileSync(filePath, 'utf8');
      return program;
    } catch (error) {
      console.error(`❌ Failed to read TEAL program from ${filePath}:`, error.message);
      throw error;
    }
  }

  // Compile TEAL program
  async compileTealProgram(program) {
    try {
      const compiled = await this.algodClient.compile(program).do();
      return new Uint8Array(Buffer.from(compiled.result, 'base64'));
    } catch (error) {
      console.error('❌ Failed to compile TEAL program:', error.message);
      throw error;
    }
  }

  // Deploy the smart contract
  async deployContract() {
    try {
      console.log('🚀 Starting smart contract deployment...');

      // Read and compile TEAL programs
      console.log('📖 Reading TEAL programs...');
      const approvalProgram = await this.readTealProgram(CONFIG.APPROVAL_PROGRAM_PATH);
      const clearProgram = await this.readTealProgram(CONFIG.CLEAR_PROGRAM_PATH);

      console.log('🔨 Compiling TEAL programs...');
      const compiledApprovalProgram = await this.compileTealProgram(approvalProgram);
      const compiledClearProgram = await this.compileTealProgram(clearProgram);

      // Get suggested parameters
      console.log('📋 Getting transaction parameters...');
      const suggestedParams = await this.algodClient.getTransactionParams().do();

      // Create application creation transaction
      console.log('📝 Creating application transaction...');
      const appCreateTxn = algosdk.makeApplicationCreateTxnFromObject({
        from: this.creatorAccount.addr,
        suggestedParams,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        approvalProgram: compiledApprovalProgram,
        clearProgram: compiledClearProgram,
        numGlobalInts: 7,  // bounty_count, amount, deadline, status, client_addr, freelancer_addr, verifier_addr
        numGlobalByteSlices: 1,  // task_desc
        numLocalInts: 0,
        numLocalByteSlices: 0,
        note: new Uint8Array(Buffer.from('AlgoEase Smart Contract Deployment'))
      });

      // Sign and submit transaction
      console.log('✍️ Signing transaction...');
      const signedTxn = appCreateTxn.signTxn(this.creatorAccount.sk);

      console.log('📤 Submitting transaction...');
      const txId = await this.algodClient.sendRawTransaction(signedTxn).do();
      console.log('📋 Transaction ID:', txId);

      // Wait for confirmation
      console.log('⏳ Waiting for confirmation...');
      const confirmedTxn = await algosdk.waitForConfirmation(
        this.algodClient,
        txId,
        10 // 10 rounds timeout
      );

      const appId = confirmedTxn['application-index'];
      console.log('🎉 Smart contract deployed successfully!');
      console.log('📱 Application ID:', appId);

      // Get application address
      const appAddress = algosdk.getApplicationAddress(appId);
      console.log('🏠 Application Address:', appAddress);

      // Save contract information
      const contractInfo = {
        appId,
        appAddress,
        network: CONFIG.NETWORK,
        deployedAt: new Date().toISOString(),
        creator: this.creatorAccount.addr,
        algodUrl: CONFIG.ALGOD_URL,
        indexerUrl: CONFIG.INDEXER_URL
      };

      fs.writeFileSync(CONFIG.CONTRACT_INFO_PATH, JSON.stringify(contractInfo, null, 2));
      console.log('💾 Contract info saved to:', CONFIG.CONTRACT_INFO_PATH);

      // Update frontend environment
      await this.updateFrontendEnv(contractInfo);

      return contractInfo;

    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      throw error;
    }
  }

  // Update frontend environment file
  async updateFrontendEnv(contractInfo) {
    try {
      const envContent = `# AlgoEase Smart Contract Configuration
REACT_APP_CONTRACT_APP_ID=${contractInfo.appId}
REACT_APP_CONTRACT_ADDRESS=${contractInfo.appAddress}
REACT_APP_ALGOD_URL=${contractInfo.algodUrl}
REACT_APP_INDEXER_URL=${contractInfo.indexerUrl}
REACT_APP_NETWORK=${contractInfo.network}
`;

      fs.writeFileSync(CONFIG.FRONTEND_ENV_PATH, envContent);
      console.log('🔧 Frontend environment updated:', CONFIG.FRONTEND_ENV_PATH);

    } catch (error) {
      console.error('❌ Failed to update frontend environment:', error.message);
      throw error;
    }
  }

  // Verify deployment
  async verifyDeployment(appId) {
    try {
      console.log('🔍 Verifying deployment...');
      
      const appInfo = await this.algodClient.getApplicationByID(appId).do();
      
      if (appInfo.params.creator === this.creatorAccount.addr) {
        console.log('✅ Deployment verified successfully!');
        console.log('📊 Application details:');
        console.log('   - Creator:', appInfo.params.creator);
        console.log('   - Created at round:', appInfo.params.createdAtRound);
        console.log('   - Global state schema:', appInfo.params.globalStateSchema);
        return true;
      } else {
        console.log('❌ Deployment verification failed');
        return false;
      }

    } catch (error) {
      console.error('❌ Verification failed:', error.message);
      return false;
    }
  }
}

// Main execution
async function main() {
  console.log('🎯 AlgoEase Smart Contract Deployment');
  console.log('=====================================\n');

  const deployer = new ContractDeployer();

  // Check if mnemonic is provided
  const mnemonic = process.env.CREATOR_MNEMONIC;
  if (!mnemonic) {
    console.error('❌ CREATOR_MNEMONIC environment variable is required');
    console.log('💡 Set your mnemonic: export CREATOR_MNEMONIC="your mnemonic phrase here"');
    process.exit(1);
  }

  // Load creator account
  if (!deployer.loadCreatorAccount(mnemonic)) {
    process.exit(1);
  }

  try {
    // Deploy contract
    const contractInfo = await deployer.deployContract();

    // Verify deployment
    await deployer.verifyDeployment(contractInfo.appId);

    console.log('\n🎉 Deployment completed successfully!');
    console.log('📱 Application ID:', contractInfo.appId);
    console.log('🏠 Application Address:', contractInfo.appAddress);
    console.log('🌐 Network:', contractInfo.network);
    console.log('\n💡 Next steps:');
    console.log('1. Update your frontend with the new contract address');
    console.log('2. Test the contract functionality');
    console.log('3. Deploy to mainnet when ready');

  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = ContractDeployer;
