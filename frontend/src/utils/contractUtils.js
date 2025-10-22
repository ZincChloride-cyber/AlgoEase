// Smart Contract Utilities for AlgoEase
import algosdk from 'algosdk/dist/browser/algosdk.min.js';

// Contract configuration
const CONTRACT_CONFIG = {
  // These will be set after contract deployment
  appId: process.env.REACT_APP_CONTRACT_ID || null,
  // TestNet configuration
  algodClient: new algosdk.Algodv2(
    '',
    process.env.REACT_APP_ALGOD_URL || 'https://testnet-api.algonode.cloud',
    ''
  ),
  indexerClient: new algosdk.Indexer(
    '',
    process.env.REACT_APP_INDEXER_URL || 'https://testnet-idx.algonode.cloud',
    ''
  )
};

// Contract method constants
export const CONTRACT_METHODS = {
  CREATE_BOUNTY: 'create_bounty',
  ACCEPT_BOUNTY: 'accept_bounty',
  APPROVE_BOUNTY: 'approve_bounty',
  CLAIM_BOUNTY: 'claim',
  REFUND_BOUNTY: 'refund',
  GET_BOUNTY: 'get_bounty'
};

// Status constants matching the smart contract
export const BOUNTY_STATUS = {
  OPEN: 0,
  ACCEPTED: 1,
  APPROVED: 2,
  CLAIMED: 3,
  REFUNDED: 4
};

// Global state keys from the contract
export const GLOBAL_STATE_KEYS = {
  BOUNTY_COUNT: 'bounty_count',
  CLIENT_ADDR: 'client_addr',
  FREELANCER_ADDR: 'freelancer_addr',
  AMOUNT: 'amount',
  DEADLINE: 'deadline',
  STATUS: 'status',
  TASK_DESCRIPTION: 'task_desc',
  VERIFIER_ADDR: 'verifier_addr'
};

class ContractUtils {
  constructor() {
    this.algodClient = CONTRACT_CONFIG.algodClient;
    this.indexerClient = CONTRACT_CONFIG.indexerClient;
    this.appId = CONTRACT_CONFIG.appId;
  }

  // Set contract app ID after deployment
  setAppId(appId) {
    this.appId = appId;
  }

  // Get current contract app ID
  getAppId() {
    return this.appId;
  }

  // Get suggested transaction parameters
  async getSuggestedParams() {
    try {
      const params = await this.algodClient.getTransactionParams().do();
      return params;
    } catch (error) {
      console.error('Failed to get transaction parameters:', error);
      throw error;
    }
  }

  // Create application call transaction
  async createAppCallTransaction(sender, method, args = [], accounts = [], note = '') {
    if (!this.appId) {
      throw new Error('Contract app ID not set. Please deploy the contract first.');
    }

    const suggestedParams = await this.getSuggestedParams();
    
    const appArgs = [new Uint8Array(Buffer.from(method))];
    args.forEach(arg => {
      if (typeof arg === 'string') {
        appArgs.push(new Uint8Array(Buffer.from(arg)));
      } else if (typeof arg === 'number') {
        appArgs.push(algosdk.encodeUint64(arg));
      } else {
        appArgs.push(arg);
      }
    });

    const txn = algosdk.makeApplicationCallTxnFromObject({
      from: sender,
      appIndex: this.appId,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      suggestedParams,
      appArgs,
      accounts,
      note: note ? new Uint8Array(Buffer.from(note)) : undefined
    });

    return txn;
  }

  // Create payment transaction
  async createPaymentTransaction(sender, receiver, amount, note = '') {
    const suggestedParams = await this.getSuggestedParams();
    
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: sender,
      to: receiver,
      amount: Math.round(amount * 1000000), // Convert ALGO to microALGO
      suggestedParams,
      note: note ? new Uint8Array(Buffer.from(note)) : undefined
    });

    return txn;
  }

  // Create bounty on smart contract
  async createBounty(sender, amount, deadline, taskDescription, verifierAddress) {
    try {
      // Convert deadline to timestamp
      const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);
      
      // Convert amount to microALGO
      const amountMicroAlgo = Math.round(amount * 1000000);

      // Create the application call transaction
      const appCallTxn = await this.createAppCallTransaction(
        sender,
        CONTRACT_METHODS.CREATE_BOUNTY,
        [amountMicroAlgo, deadlineTimestamp, taskDescription],
        [verifierAddress],
        'AlgoEase: Create Bounty'
      );

      // Create payment transaction to send funds to contract
      const paymentTxn = await this.createPaymentTransaction(
        sender,
        await this.getContractAddress(),
        amountMicroAlgo,
        'AlgoEase: Bounty Payment'
      );

      return [appCallTxn, paymentTxn];
    } catch (error) {
      console.error('Failed to create bounty transaction:', error);
      throw error;
    }
  }

  // Accept bounty
  async acceptBounty(sender) {
    try {
      const appCallTxn = await this.createAppCallTransaction(
        sender,
        CONTRACT_METHODS.ACCEPT_BOUNTY,
        [],
        [],
        'AlgoEase: Accept Bounty'
      );

      return appCallTxn;
    } catch (error) {
      console.error('Failed to create accept bounty transaction:', error);
      throw error;
    }
  }

  // Approve bounty (verifier only)
  async approveBounty(sender) {
    try {
      const appCallTxn = await this.createAppCallTransaction(
        sender,
        CONTRACT_METHODS.APPROVE_BOUNTY,
        [],
        [],
        'AlgoEase: Approve Bounty'
      );

      return appCallTxn;
    } catch (error) {
      console.error('Failed to create approve bounty transaction:', error);
      throw error;
    }
  }

  // Claim bounty payment
  async claimBounty(sender) {
    try {
      const appCallTxn = await this.createAppCallTransaction(
        sender,
        CONTRACT_METHODS.CLAIM_BOUNTY,
        [],
        [],
        'AlgoEase: Claim Bounty'
      );

      return appCallTxn;
    } catch (error) {
      console.error('Failed to create claim bounty transaction:', error);
      throw error;
    }
  }

  // Refund bounty
  async refundBounty(sender) {
    try {
      const appCallTxn = await this.createAppCallTransaction(
        sender,
        CONTRACT_METHODS.REFUND_BOUNTY,
        [],
        [],
        'AlgoEase: Refund Bounty'
      );

      return appCallTxn;
    } catch (error) {
      console.error('Failed to create refund bounty transaction:', error);
      throw error;
    }
  }

  // Get contract address
  async getContractAddress() {
    if (!this.appId) {
      throw new Error('Contract app ID not set');
    }

    try {
      const appInfo = await this.algodClient.getApplicationByID(this.appId).do();
      return appInfo.params.creator;
    } catch (error) {
      console.error('Failed to get contract address:', error);
      throw error;
    }
  }

  // Get contract state
  async getContractState() {
    if (!this.appId) {
      throw new Error('Contract app ID not set');
    }

    try {
      const appInfo = await this.algodClient.getApplicationByID(this.appId).do();
      const globalState = appInfo.params['global-state'] || [];
      
      // Parse global state
      const parsedState = {};
      globalState.forEach(item => {
        const key = Buffer.from(item.key, 'base64').toString();
        const value = item.value;
        
        if (value.type === 1) { // uint64
          parsedState[key] = value.uint;
        } else if (value.type === 2) { // bytes
          parsedState[key] = Buffer.from(value.bytes, 'base64').toString();
        }
      });

      return parsedState;
    } catch (error) {
      console.error('Failed to get contract state:', error);
      throw error;
    }
  }

  // Get current bounty information
  async getCurrentBounty() {
    try {
      const state = await this.getContractState();
      
      if (!state[GLOBAL_STATE_KEYS.BOUNTY_COUNT] || state[GLOBAL_STATE_KEYS.BOUNTY_COUNT] === 0) {
        return null;
      }

      return {
        bountyCount: state[GLOBAL_STATE_KEYS.BOUNTY_COUNT],
        clientAddress: state[GLOBAL_STATE_KEYS.CLIENT_ADDR],
        freelancerAddress: state[GLOBAL_STATE_KEYS.FREELANCER_ADDR],
        amount: state[GLOBAL_STATE_KEYS.AMOUNT] / 1000000, // Convert from microALGO to ALGO
        deadline: new Date(state[GLOBAL_STATE_KEYS.DEADLINE] * 1000),
        status: state[GLOBAL_STATE_KEYS.STATUS],
        taskDescription: state[GLOBAL_STATE_KEYS.TASK_DESCRIPTION],
        verifierAddress: state[GLOBAL_STATE_KEYS.VERIFIER_ADDR]
      };
    } catch (error) {
      console.error('Failed to get current bounty:', error);
      throw error;
    }
  }

  // Check if user can perform action
  canPerformAction(userAddress, action, bountyInfo) {
    if (!bountyInfo) return false;

    switch (action) {
      case 'accept':
        return bountyInfo.status === BOUNTY_STATUS.OPEN && 
               userAddress !== bountyInfo.clientAddress;
      
      case 'approve':
        return bountyInfo.status === BOUNTY_STATUS.ACCEPTED && 
               userAddress === bountyInfo.verifierAddress;
      
      case 'claim':
        return bountyInfo.status === BOUNTY_STATUS.APPROVED && 
               userAddress === bountyInfo.freelancerAddress;
      
      case 'refund':
        return (bountyInfo.status === BOUNTY_STATUS.OPEN || 
                bountyInfo.status === BOUNTY_STATUS.ACCEPTED) &&
               (userAddress === bountyInfo.clientAddress || 
                userAddress === bountyInfo.verifierAddress ||
                Date.now() / 1000 > bountyInfo.deadline.getTime() / 1000);
      
      default:
        return false;
    }
  }

  // Get status name from status code
  getStatusName(statusCode) {
    switch (statusCode) {
      case BOUNTY_STATUS.OPEN: return 'open';
      case BOUNTY_STATUS.ACCEPTED: return 'accepted';
      case BOUNTY_STATUS.APPROVED: return 'approved';
      case BOUNTY_STATUS.CLAIMED: return 'claimed';
      case BOUNTY_STATUS.REFUNDED: return 'refunded';
      default: return 'unknown';
    }
  }

  // Wait for transaction confirmation
  async waitForConfirmation(txId, timeout = 10000) {
    try {
      const confirmedTxn = await algosdk.waitForConfirmation(
        this.algodClient,
        txId,
        timeout
      );
      return confirmedTxn;
    } catch (error) {
      console.error('Transaction confirmation failed:', error);
      throw error;
    }
  }

  // Submit signed transaction
  async submitTransaction(signedTxn) {
    try {
      const txId = await this.algodClient.sendRawTransaction(signedTxn).do();
      return txId;
    } catch (error) {
      console.error('Failed to submit transaction:', error);
      throw error;
    }
  }

  // Submit multiple transactions as a group
  async submitTransactionGroup(signedTxns) {
    try {
      const txId = await this.algodClient.sendRawTransaction(signedTxns).do();
      return txId;
    } catch (error) {
      console.error('Failed to submit transaction group:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const contractUtils = new ContractUtils();
export default contractUtils;
