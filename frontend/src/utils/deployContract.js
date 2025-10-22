// Contract deployment utilities
import algosdk from 'algosdk/dist/browser/algosdk.min.js';
import contractUtils from './contractUtils';

// Contract deployment configuration
const DEPLOYMENT_CONFIG = {
  // TestNet configuration
  algodClient: new algosdk.Algodv2(
    '',
    process.env.REACT_APP_ALGOD_URL || 'https://testnet-api.algonode.cloud',
    ''
  ),
  // You'll need to provide these for deployment
  creatorMnemonic: process.env.REACT_APP_CREATOR_MNEMONIC || '',
  // Contract files (these should be compiled from the Python contract)
  approvalProgram: '', // Will be loaded from compiled TEAL
  clearProgram: ''     // Will be loaded from compiled TEAL
};

class ContractDeployer {
  constructor() {
    this.algodClient = DEPLOYMENT_CONFIG.algodClient;
  }

  // Load compiled TEAL programs
  async loadTealPrograms() {
    try {
      // In a real deployment, you would load these from the compiled TEAL files
      // For now, we'll return empty strings as placeholders
      console.warn('TEAL programs not loaded. Please compile the contract first.');
      return {
        approvalProgram: DEPLOYMENT_CONFIG.approvalProgram,
        clearProgram: DEPLOYMENT_CONFIG.clearProgram
      };
    } catch (error) {
      console.error('Failed to load TEAL programs:', error);
      throw error;
    }
  }

  // Deploy the contract
  async deployContract() {
    try {
      const { approvalProgram, clearProgram } = await this.loadTealPrograms();
      
      if (!approvalProgram || !clearProgram) {
        throw new Error('TEAL programs not loaded. Please compile the contract first.');
      }

      // Get suggested parameters
      const suggestedParams = await this.algodClient.getTransactionParams().do();

      // Create application creation transaction
      const txn = algosdk.makeApplicationCreateTxnFromObject({
        from: algosdk.mnemonicToSecretKey(DEPLOYMENT_CONFIG.creatorMnemonic).addr,
        suggestedParams,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        approvalProgram: new Uint8Array(Buffer.from(approvalProgram, 'base64')),
        clearProgram: new Uint8Array(Buffer.from(clearProgram, 'base64')),
        numGlobalByteSlices: 10,
        numGlobalInts: 10,
        numLocalByteSlices: 0,
        numLocalInts: 0
      });

      // Sign transaction
      const signedTxn = txn.signTxn(algosdk.mnemonicToSecretKey(DEPLOYMENT_CONFIG.creatorMnemonic).sk);

      // Submit transaction
      const txId = await this.algodClient.sendRawTransaction(signedTxn).do();

      // Wait for confirmation
      const confirmedTxn = await algosdk.waitForConfirmation(
        this.algodClient,
        txId,
        4
      );

      const appId = confirmedTxn['application-index'];
      
      // Set the app ID in contract utils
      contractUtils.setAppId(appId);

      console.log(`Contract deployed successfully! App ID: ${appId}`);
      return appId;
    } catch (error) {
      console.error('Failed to deploy contract:', error);
      throw error;
    }
  }

  // Get deployment status
  async getDeploymentStatus() {
    try {
      const appId = contractUtils.getAppId();
      if (!appId) {
        return { deployed: false, appId: null };
      }

      // Check if contract exists
      const appInfo = await this.algodClient.getApplicationByID(appId).do();
      return { deployed: true, appId, appInfo };
    } catch (error) {
      console.error('Failed to get deployment status:', error);
      return { deployed: false, appId: null, error: error.message };
    }
  }

  // Initialize contract (first bounty creation)
  async initializeContract() {
    try {
      const appId = contractUtils.getAppId();
      if (!appId) {
        throw new Error('Contract not deployed. Please deploy first.');
      }

      // Get suggested parameters
      const suggestedParams = await this.algodClient.getTransactionParams().do();

      // Create application call transaction for initialization
      const txn = algosdk.makeApplicationCallTxnFromObject({
        from: algosdk.mnemonicToSecretKey(DEPLOYMENT_CONFIG.creatorMnemonic).addr,
        appIndex: appId,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        suggestedParams,
        appArgs: [new Uint8Array(Buffer.from('create_bounty'))]
      });

      // Sign transaction
      const signedTxn = txn.signTxn(algosdk.mnemonicToSecretKey(DEPLOYMENT_CONFIG.creatorMnemonic).sk);

      // Submit transaction
      const txId = await this.algodClient.sendRawTransaction(signedTxn).do();

      // Wait for confirmation
      await algosdk.waitForConfirmation(this.algodClient, txId, 4);

      console.log('Contract initialized successfully!');
      return txId;
    } catch (error) {
      console.error('Failed to initialize contract:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const contractDeployer = new ContractDeployer();
export default contractDeployer;
