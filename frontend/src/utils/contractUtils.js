// Smart Contract Utilities for AlgoEase
import algosdk from 'algosdk/dist/browser/algosdk.min.js';
import { Buffer } from 'buffer';

if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer;
}

// Contract configuration
const CONTRACT_CONFIG = {
  // These will be set after contract deployment
  appId: parseInt(process.env.REACT_APP_CONTRACT_APP_ID) || 749599170,
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

const textDecoder = typeof window !== 'undefined' ? new TextDecoder() : null;
const ADDRESS_KEYS = new Set([
  'client_addr',
  'freelancer_addr',
  'verifier_addr'
]);

const decodeStateKey = (key) => Buffer.from(key, 'base64').toString('utf8');

const decodeBytesValue = (key, value) => {
  if (!value) return null;
  
  try {
    const bytes = Buffer.from(value, 'base64');

    // Handle address keys
    if (ADDRESS_KEYS.has(key) && bytes.length === 32) {
      return algosdk.encodeAddress(new Uint8Array(bytes));
    }

    // Decode as UTF-8 string
    if (textDecoder) {
      const decoded = textDecoder.decode(bytes);
      // Ensure it's a string and trim whitespace
      return typeof decoded === 'string' ? decoded.trim() : String(decoded).trim();
    }

    // Fallback to Buffer toString
    const decoded = bytes.toString('utf8');
    return typeof decoded === 'string' ? decoded.trim() : String(decoded).trim();
  } catch (error) {
    console.error('Error decoding bytes value:', error);
    return null;
  }
};

const normalizeSignedPayload = (payload) => {
  if (!payload) {
    throw new Error('Signed transaction payload is empty.');
  }

  if (payload instanceof Uint8Array) {
    return payload;
  }

  if (typeof payload === 'string') {
    return Uint8Array.from(Buffer.from(payload, 'base64'));
  }

  if (payload.blob) {
    return Uint8Array.from(Buffer.from(payload.blob, 'base64'));
  }

  if (payload.signedTxn) {
    return Uint8Array.from(Buffer.from(payload.signedTxn, 'base64'));
  }

  throw new Error('Unsupported signed transaction format.');
};

// Contract method constants
export const CONTRACT_METHODS = {
  CREATE_BOUNTY: 'create_bounty',
  ACCEPT_BOUNTY: 'accept_bounty',
  APPROVE_BOUNTY: 'approve_bounty',
  REJECT_BOUNTY: 'reject_bounty',
  CLAIM_BOUNTY: 'claim',
  REFUND_BOUNTY: 'refund',
  AUTO_REFUND: 'auto_refund',
  GET_BOUNTY: 'get_bounty'
};

// Status constants matching the smart contract
export const BOUNTY_STATUS = {
  OPEN: 0,
  ACCEPTED: 1,
  APPROVED: 2,
  CLAIMED: 3,
  REFUNDED: 4,
  REJECTED: 5
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
    this.appId = parseInt(appId);
  }

  // Get current contract app ID
  getAppId() {
    return this.appId;
  }

  // Get box name for a bounty counter (matches contract's get_box_name function)
  getBoxName(bountyCounter) {
    const prefix = new Uint8Array(Buffer.from('bounty_', 'utf8'));
    const counterBytes = algosdk.encodeUint64(bountyCounter);
    const boxName = new Uint8Array(prefix.length + counterBytes.length);
    boxName.set(prefix);
    boxName.set(counterBytes, prefix.length);
    return boxName;
  }

  // Get the current bounty counter from global state
  async getBountyCounter() {
    try {
      const appInfo = await this.algodClient.getApplicationByID(this.appId).do();
      const globalState = appInfo.params['global-state'];
      
      // Find bounty_counter in global state
      const counterState = globalState.find(item => {
        const key = Buffer.from(item.key, 'base64').toString('utf8');
        return key === 'bounty_counter';
      });
      
      if (counterState) {
        return counterState.value.uint;
      }
      
      return 0; // Default if not found
    } catch (error) {
      console.error('Failed to get bounty counter:', error);
      return 0; // Return 0 as default
    }
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
  async createAppCallTransaction(sender, method, args = [], accounts = [], note = '', boxes = []) {
    if (!this.appId) {
      throw new Error('Contract app ID not set. Please deploy the contract first.');
    }
    
    console.log('Creating app call transaction:');
    console.log('  - App ID:', this.appId);
    console.log('  - Method:', method);
    console.log('  - Sender:', sender);
    console.log('  - Accounts array:', accounts);
    console.log('  - Accounts length:', accounts.length);
    console.log('  - Boxes:', boxes);

    const suggestedParams = await this.getSuggestedParams();
    
    const appArgs = [new Uint8Array(new TextEncoder().encode(method))];
    args.forEach(arg => {
      if (typeof arg === 'string') {
        appArgs.push(new Uint8Array(new TextEncoder().encode(arg)));
      } else if (typeof arg === 'number' || typeof arg === 'bigint') {
        // Use BigInt for large numbers to avoid precision issues
        // eslint-disable-next-line no-undef
        const bigIntArg = typeof arg === 'bigint' ? arg : BigInt(arg);
        appArgs.push(algosdk.encodeUint64(bigIntArg));
      } else if (arg instanceof Uint8Array) {
        appArgs.push(arg);
      } else {
        console.warn('Unexpected arg type:', typeof arg, arg);
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
      boxes: boxes.length > 0 ? boxes : undefined,
      note: note ? new Uint8Array(new TextEncoder().encode(note)) : undefined
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
      note: note ? new Uint8Array(new TextEncoder().encode(note)) : undefined
    });

    return txn;
  }

  // Create bounty on smart contract
  async createBounty(sender, amount, deadline, taskDescription, verifierAddress) {
    try {
      // Validate verifier address
      const trimmedVerifier = verifierAddress ? verifierAddress.trim() : '';
      const finalVerifier = trimmedVerifier || sender;

      if (!algosdk.isValidAddress(finalVerifier)) {
        throw new Error('Verifier address is not a valid Algorand address.');
      }

      console.log('Creating bounty with verifier:', finalVerifier, '(sender:', sender, ')');
      
      // Convert deadline to timestamp
      const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);

      if (!Number.isFinite(deadlineTimestamp)) {
        throw new Error('Invalid deadline provided');
      }
      
      // Validate deadline is in the future
      const now = Math.floor(Date.now() / 1000);
      if (deadlineTimestamp <= now) {
        throw new Error('Deadline must be in the future');
      }
      
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Escrow amount must be greater than zero');
      }

      // Convert amount to microALGO
      const amountMicroAlgo = Math.round(amount * 1000000);

      // Reuse suggested params for the group to maintain identical fee/rounds
      const suggestedParams = await this.getSuggestedParams();

      // Create payment transaction to send funds to contract (must be first)
      const contractAddress = await this.getContractAddress();
      const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: sender,
        to: contractAddress,
        amount: amountMicroAlgo,
        suggestedParams,
        note: new Uint8Array(new TextEncoder().encode('AlgoEase: Bounty Payment'))
      });

      // Create the application call transaction (must be second)
      // Contract REQUIRES at least 1 account in the accounts array (txn NumAccounts >= 1)
      // ALWAYS pass the verifier, even if it's the same as the sender
      const foreignAccounts = [finalVerifier];

      console.log('Creating bounty transaction with:', {
        sender,
        contractAddress,
        finalVerifier,
        isSenderVerifier: finalVerifier === sender,
        foreignAccounts,
        amountMicroAlgo,
        paymentAmount: paymentTxn.amount,
        deadlineTimestamp,
        taskDescriptionLength: taskDescription.length
      });

      // V3 contract uses box storage for bounties
      // We need to get the current bounty_count to calculate the box name
      // Box name format: "bounty_" + Itob(bounty_id)
      // The new bounty_id will be the current bounty_count
      let boxReferences = [];
      try {
        const contractState = await this.getContractState();
        const currentBountyCount = contractState['bounty_count'] || contractState[GLOBAL_STATE_KEYS.BOUNTY_COUNT] || 0;
        const newBountyId = currentBountyCount; // The new bounty will use this ID
        
        console.log('📦 Creating box reference for new bounty:', {
          currentBountyCount,
          newBountyId,
          appId: this.appId
        });
        
        // Create box name: "bounty_" + Itob(bounty_id)
        const prefix = new TextEncoder().encode('bounty_');
        const bountyIdBytes = algosdk.encodeUint64(newBountyId);
        const boxNameBytes = new Uint8Array(prefix.length + bountyIdBytes.length);
        boxNameBytes.set(prefix, 0);
        boxNameBytes.set(bountyIdBytes, prefix.length);
        
        // Create box reference for the transaction
        // Format: { appIndex: appId, name: boxNameBytes }
        boxReferences = [{
          appIndex: this.appId,
          name: boxNameBytes
        }];
        
        console.log('📦 Box reference created:', {
          boxName: Buffer.from(boxNameBytes).toString('hex'),
          boxNameLength: boxNameBytes.length,
          bountyId: newBountyId
        });
      } catch (stateError) {
        console.warn('⚠️ Could not get contract state to calculate box reference:', stateError);
        console.warn('⚠️ Attempting to create bounty without box reference (may fail if boxes are required)');
        // Try without box reference - the contract might handle it
        // If this fails, the user will need to ensure the contract state is accessible
      }
      
      const appCallTxn = await this.createAppCallTransaction(
        sender,
        CONTRACT_METHODS.CREATE_BOUNTY,
        [amountMicroAlgo, deadlineTimestamp, taskDescription],
        foreignAccounts,
        'AlgoEase: Create Bounty',
        boxReferences // Include box reference for box creation
      );

      console.debug('createBounty: built transactions', {
        paymentTxnAmount: paymentTxn.amount,
        paymentTxnReceiver: paymentTxn.to,
        appCallTxnAccounts: appCallTxn.appAccounts || [],
        appCallTxnArgs: appCallTxn.appArgs?.length || 0,
        appCallTxnFee: appCallTxn.fee,
      });

      // Assign group ID to transactions (mutates in place)
      algosdk.assignGroupID([paymentTxn, appCallTxn]);

      // Return the transactions - they are already proper Transaction instances
      return [paymentTxn, appCallTxn];
    } catch (error) {
      console.error('Failed to create bounty transaction:', error);
      throw error;
    }
  }

  // Helper function to create box reference
  createBoxReference(bountyId) {
    if (!this.appId) {
      throw new Error('Contract app ID not set');
    }
    
    // Box name format: "bounty_" + Itob(bounty_id)
    const prefix = new TextEncoder().encode('bounty_');
    const bountyIdBytes = algosdk.encodeUint64(bountyId);
    const boxNameBytes = new Uint8Array(prefix.length + bountyIdBytes.length);
    boxNameBytes.set(prefix, 0);
    boxNameBytes.set(bountyIdBytes, prefix.length);
    
    return [{
      appIndex: this.appId,
      name: boxNameBytes
    }];
  }

  // Accept bounty (requires bounty_id)
  async acceptBounty(sender, bountyId) {
    try {
      if (!bountyId) {
        throw new Error('Bounty ID is required for acceptance');
      }
      
      // Create box reference for the bounty box
      const boxReferences = this.createBoxReference(bountyId);
      
      const appCallTxn = await this.createAppCallTransaction(
        sender,
        CONTRACT_METHODS.ACCEPT_BOUNTY,
        [algosdk.encodeUint64(bountyId)],
        [],
        'AlgoEase: Accept Bounty',
        boxReferences
      );

      return appCallTxn;
    } catch (error) {
      console.error('Failed to create accept bounty transaction:', error);
      throw error;
    }
  }

  // Approve bounty (verifier only, requires bounty_id)
  async approveBounty(sender, bountyId) {
    try {
      if (!bountyId) {
        throw new Error('Bounty ID is required for approval');
      }
      
      // Create box reference for the bounty box
      const boxReferences = this.createBoxReference(bountyId);
      
      const appCallTxn = await this.createAppCallTransaction(
        sender,
        CONTRACT_METHODS.APPROVE_BOUNTY,
        [algosdk.encodeUint64(bountyId)],
        [],
        'AlgoEase: Approve Bounty',
        boxReferences
      );

      return appCallTxn;
    } catch (error) {
      console.error('Failed to create approve bounty transaction:', error);
      throw error;
    }
  }

  // Reject bounty (verifier only, uses refund function but tracks as rejected)
  async rejectBounty(sender, bountyId) {
    try {
      if (!bountyId) {
        throw new Error('Bounty ID is required for rejection');
      }
      
      // Create box reference for the bounty box
      const boxReferences = this.createBoxReference(bountyId);
      
      // Reject uses the reject_bounty function on the contract
      const appCallTxn = await this.createAppCallTransaction(
        sender,
        CONTRACT_METHODS.REJECT_BOUNTY,
        [algosdk.encodeUint64(bountyId)],
        [],
        'AlgoEase: Reject Bounty',
        boxReferences
      );

      return appCallTxn;
    } catch (error) {
      console.error('Failed to create reject bounty transaction:', error);
      throw error;
    }
  }

  // Claim bounty payment (requires bounty_id)
  async claimBounty(sender, bountyId) {
    try {
      if (!bountyId) {
        throw new Error('Bounty ID is required for claiming');
      }
      
      // Create box reference for the bounty box
      const boxReferences = this.createBoxReference(bountyId);
      
      const appCallTxn = await this.createAppCallTransaction(
        sender,
        CONTRACT_METHODS.CLAIM_BOUNTY,
        [algosdk.encodeUint64(bountyId)],
        [],
        'AlgoEase: Claim Bounty',
        boxReferences
      );

      return appCallTxn;
    } catch (error) {
      console.error('Failed to create claim bounty transaction:', error);
      throw error;
    }
  }

  // Refund bounty (manual refund by client or verifier, requires bounty_id)
  async refundBounty(sender, bountyId) {
    try {
      if (!bountyId) {
        throw new Error('Bounty ID is required for refund');
      }

      // Create box reference for the bounty box
      const boxReferences = this.createBoxReference(bountyId);

      // V3 contract requires bounty_id as argument: [method, bounty_id]
      const appCallTxn = await this.createAppCallTransaction(
        sender,
        CONTRACT_METHODS.REFUND_BOUNTY,
        [algosdk.encodeUint64(bountyId)], // Pass bounty_id as argument
        [],
        'AlgoEase: Refund Bounty',
        boxReferences
      );

      return appCallTxn;
    } catch (error) {
      console.error('Failed to create refund bounty transaction:', error);
      throw error;
    }
  }

  // Auto refund bounty (when deadline has passed, requires bounty_id)
  async autoRefundBounty(sender, bountyId) {
    try {
      if (!bountyId) {
        throw new Error('Bounty ID is required for auto-refund');
      }

      // Create box reference for the bounty box
      const boxReferences = this.createBoxReference(bountyId);

      // V3 contract requires bounty_id as argument: [method, bounty_id]
      const appCallTxn = await this.createAppCallTransaction(
        sender,
        CONTRACT_METHODS.AUTO_REFUND,
        [algosdk.encodeUint64(bountyId)], // Pass bounty_id as argument
        [],
        'AlgoEase: Auto Refund Bounty',
        boxReferences
      );

      return appCallTxn;
    } catch (error) {
      console.error('Failed to create auto refund bounty transaction:', error);
      throw error;
    }
  }

  // Get contract address
  async getContractAddress() {
    if (!this.appId) {
      throw new Error('Contract app ID not set');
    }

    try {
      // Calculate the application address from the app ID
      // This is the address where the smart contract funds are stored
      const appAddress = algosdk.getApplicationAddress(this.appId);
      return appAddress;
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

      const parsedState = {};
      globalState.forEach((item) => {
        const key = decodeStateKey(item.key);
        const value = item.value;

        // Algorand state: type 1 = bytes, type 2 = uint
        if (value.type === 1) {
          // Bytes value
          parsedState[key] = decodeBytesValue(key, value.bytes);
        } else if (value.type === 2) {
          // Uint value
          parsedState[key] = Number(value.uint);
        }
      });

      return parsedState;
    } catch (error) {
      console.error('Failed to get contract state:', error);
      throw error;
    }
  }

  // Get bounty_id from contract after creation (bounty_count - 1)
  async getBountyIdAfterCreation() {
    try {
      const state = await this.getContractState();
      console.log('📊 Full contract state:', state);
      // V3 contract uses 'bounty_count' as the key
      const bountyCounter = state['bounty_count'] || state[GLOBAL_STATE_KEYS.BOUNTY_COUNT] || 0;
      console.log('🔢 Bounty counter value:', bountyCounter);
      if (bountyCounter === 0) {
        console.warn('⚠️ Bounty counter is 0, returning null');
        return null;
      }
      // The new bounty_id is bounty_count - 1 (since counter was incremented after creation)
      const bountyId = bountyCounter - 1;
      console.log('✅ Calculated bounty ID:', bountyId);
      return bountyId;
    } catch (error) {
      console.error('❌ Failed to get bounty ID:', error);
      throw error;
    }
  }

  // Get bounty from box storage by bounty_id
  async getBountyFromBox(bountyId) {
    try {
      if (!this.appId) {
        throw new Error('Contract app ID not set');
      }

      // Box name format: "bounty_" + Itob(bounty_id)
      // Contract uses: Concat(Bytes("bounty_"), Itob(bounty_id))
      const prefix = new TextEncoder().encode('bounty_');
      const bountyIdBytes = algosdk.encodeUint64(bountyId);
      const boxNameBytes = new Uint8Array(prefix.length + bountyIdBytes.length);
      boxNameBytes.set(prefix, 0);
      boxNameBytes.set(bountyIdBytes, prefix.length);
      
      // Convert to base64 for API call
      const boxNameBase64 = Buffer.from(boxNameBytes).toString('base64');
      
      // Get box value using indexer or algod
      // Try using indexer first (more reliable for box reads)
      try {
        const boxValue = await this.indexerClient.lookupApplicationBoxByIDandName(
          this.appId,
          boxNameBase64
        ).do();
        
        if (!boxValue || !boxValue.value) {
          return null;
        }
        
        // boxValue.value is base64 encoded
        const boxData = Buffer.from(boxValue.value, 'base64');

        // Parse box data
        // Format: client_addr(32) + freelancer_addr(32) + verifier_addr(32) + 
        //         amount(8) + deadline(8) + status(1) + task_desc(variable)
        const data = new Uint8Array(boxData);
        
        const clientAddr = algosdk.encodeAddress(data.slice(0, 32));
        const freelancerBytes = data.slice(32, 64);
        // Check if freelancer is zero address (all zeros)
        const isZeroAddress = freelancerBytes.every(byte => byte === 0);
        const freelancerAddr = isZeroAddress ? null : algosdk.encodeAddress(freelancerBytes);
        const verifierAddr = algosdk.encodeAddress(data.slice(64, 96));
        const amountMicro = algosdk.decodeUint64(data.slice(96, 104), 'big');
        const deadlineSeconds = algosdk.decodeUint64(data.slice(104, 112), 'big');
        const status = data[112];
        const taskDesc = new TextDecoder().decode(data.slice(113));

        return {
          bountyId,
          clientAddress: clientAddr,
          freelancerAddress: freelancerAddr,
          verifierAddress: verifierAddr,
          amount: amountMicro / 1000000,
          deadline: new Date(deadlineSeconds * 1000),
          status,
          taskDescription: taskDesc
        };
      } catch (indexerError) {
        // Fallback to algod if indexer fails
        console.warn('Indexer box read failed, trying algod:', indexerError);
        const boxValue = await this.algodClient.getApplicationBoxByName(
          this.appId,
          boxNameBase64
        ).do();
        
        if (!boxValue || !boxValue.value) {
          return null;
        }
        
        const boxData = Buffer.from(boxValue.value, 'base64');
        const data = new Uint8Array(boxData);
        
        const clientAddr = algosdk.encodeAddress(data.slice(0, 32));
        const freelancerBytes = data.slice(32, 64);
        const isZeroAddress = freelancerBytes.every(byte => byte === 0);
        const freelancerAddr = isZeroAddress ? null : algosdk.encodeAddress(freelancerBytes);
        const verifierAddr = algosdk.encodeAddress(data.slice(64, 96));
        const amountMicro = algosdk.decodeUint64(data.slice(96, 104), 'big');
        const deadlineSeconds = algosdk.decodeUint64(data.slice(104, 112), 'big');
        const status = data[112];
        const taskDesc = new TextDecoder().decode(data.slice(113));

        return {
          bountyId,
          clientAddress: clientAddr,
          freelancerAddress: freelancerAddr,
          verifierAddress: verifierAddr,
          amount: amountMicro / 1000000,
          deadline: new Date(deadlineSeconds * 1000),
          status,
          taskDescription: taskDesc
        };
      }
    } catch (error) {
      console.error('Failed to get bounty from box:', error);
      // If box doesn't exist, return null
      if (error.status === 404 || error.message?.includes('box not found') || error.message?.includes('does not exist')) {
        return null;
      }
      throw error;
    }
  }

  // Get current bounty information from global state (V3 contract)
  async getCurrentBounty() {
    try {
      const state = await this.getContractState();
      
      // Check if there's an active bounty (amount > 0 and status not CLAIMED/REFUNDED)
      const amount = state[GLOBAL_STATE_KEYS.AMOUNT] || 0;
      const status = state[GLOBAL_STATE_KEYS.STATUS] !== undefined ? state[GLOBAL_STATE_KEYS.STATUS] : null;
      
      if (amount === 0 || status === BOUNTY_STATUS.CLAIMED || status === BOUNTY_STATUS.REFUNDED) {
        return null;
      }

      // Parse addresses - handle both string and address formats
      let clientAddress = state[GLOBAL_STATE_KEYS.CLIENT_ADDR];
      let freelancerAddress = state[GLOBAL_STATE_KEYS.FREELANCER_ADDR];
      let verifierAddress = state[GLOBAL_STATE_KEYS.VERIFIER_ADDR];
      
      // If addresses are zero addresses or empty, set to null
      const zeroAddr = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ';
      if (clientAddress === zeroAddr || !clientAddress) clientAddress = null;
      if (freelancerAddress === zeroAddr || !freelancerAddress) freelancerAddress = null;
      if (verifierAddress === zeroAddr || !verifierAddress) verifierAddress = null;

      return {
        bountyId: state[GLOBAL_STATE_KEYS.BOUNTY_COUNT] - 1, // Latest bounty ID
        clientAddress,
        freelancerAddress,
        verifierAddress,
        amount: amount / 1000000, // Convert from microALGO
        deadline: state[GLOBAL_STATE_KEYS.DEADLINE] ? new Date(state[GLOBAL_STATE_KEYS.DEADLINE] * 1000) : null,
        status: status,
        taskDescription: state[GLOBAL_STATE_KEYS.TASK_DESCRIPTION] || ''
      };
    } catch (error) {
      console.error('Failed to get current bounty:', error);
      throw error;
    }
  }

  // Check if user can perform action
  canPerformAction(userAddress, action, bountyInfo) {
    if (!bountyInfo) return false;
    if (!userAddress) return false;

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
                userAddress === bountyInfo.verifierAddress);
      
      case 'auto_refund':
        return (bountyInfo.status === BOUNTY_STATUS.OPEN || 
                bountyInfo.status === BOUNTY_STATUS.ACCEPTED) &&
               bountyInfo.deadline instanceof Date &&
               Date.now() / 1000 > bountyInfo.deadline.getTime() / 1000;
      
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
  async waitForConfirmation(txId, timeout = 4) {
    try {
      // Extract the transaction ID if it's an object
      const txIdString = typeof txId === 'object' && txId.txId ? txId.txId : txId;
      
      console.log('Waiting for confirmation of transaction:', txIdString);
      
      // The timeout parameter is in rounds, not milliseconds
      // Each round is ~3.7 seconds on Algorand
      const confirmedTxn = await algosdk.waitForConfirmation(
        this.algodClient,
        txIdString,
        timeout
      );
      
      console.log('Transaction confirmed in round:', confirmedTxn['confirmed-round']);
      return confirmedTxn;
    } catch (error) {
      console.error('Transaction confirmation failed:', error);
      throw error;
    }
  }

  // Submit signed transaction
  async submitTransaction(signedTxn) {
    try {
      const payload = normalizeSignedPayload(signedTxn);
      
      console.log('Submitting transaction to network...');
      const response = await this.algodClient.sendRawTransaction(payload).do();
      
      // Extract the transaction ID from the response
      const txId = response.txId || response;
      console.log('Transaction submitted successfully. TxID:', txId);
      
      return txId;
    } catch (error) {
      console.error('Failed to submit transaction:', error);
      throw error;
    }
  }

  // Submit multiple transactions as a group
  async submitTransactionGroup(signedTxns) {
    try {
      const payload = Array.isArray(signedTxns)
        ? signedTxns.map((txn) => normalizeSignedPayload(txn))
        : normalizeSignedPayload(signedTxns);

      console.log('Submitting transaction group to network...');
      const response = await this.algodClient.sendRawTransaction(payload).do();
      
      // Extract the transaction ID from the response
      const txId = response.txId || response;
      console.log('Transaction submitted successfully. TxID:', txId);
      
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
