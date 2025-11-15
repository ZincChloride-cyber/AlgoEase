// Smart Contract Utilities for AlgoEase
import algosdk from 'algosdk/dist/browser/algosdk.min.js';
import { Buffer } from 'buffer';

if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer;
}

// Contract configuration
// V4 Contract ID - use environment variable, fallback to deployed V4 contract
const V4_APP_ID = 749653911; // Deployed V4 contract
const V4_ADDRESS = 'YGKN4WYULCTVLA6JHY6XEVKV2LQF4A5DOCEJWGUNGMUHIZQANLO4JGFFEQ';
const OLD_IDS = [749648617, 749646001, 749599170, 749540140, 749335380]; // All old contract IDs

// Get app ID from environment, prefer environment variable
let envAppId = parseInt(process.env.REACT_APP_CONTRACT_APP_ID) || V4_APP_ID;
// Reject old IDs and use V4 if old ID detected
if (OLD_IDS.includes(envAppId)) {
  console.warn(`[CONTRACT_CONFIG] Rejecting old contract ID ${envAppId}, using V4 contract ${V4_APP_ID}`);
  envAppId = V4_APP_ID;
}

// Get address from environment, prefer environment variable
let envAppAddress = process.env.REACT_APP_CONTRACT_ADDRESS || V4_ADDRESS;
// Reject old addresses
if (envAppAddress && (envAppAddress.includes('K2M726DQ') || envAppAddress.includes('W7Z5VWO4V5MNXSS4HCMHQSCIH373NLTAP5IPSNTIQZP6J3XFT6PNEE6KWA'))) {
  console.warn(`[CONTRACT_CONFIG] Rejecting old contract address, using V4 address ${V4_ADDRESS}`);
  envAppAddress = V4_ADDRESS;
}

const CONTRACT_CONFIG = {
  // These will be set after contract deployment
  appId: envAppId,
  appAddress: envAppAddress,
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
    this.appAddress = CONTRACT_CONFIG.appAddress;
    // Initialize contract connection
    this.initializeContract();
  }

  // Initialize contract connection
  initializeContract() {
    // V4 contract ID - reject all old IDs
    const CORRECT_APP_ID = V4_APP_ID;
    const CORRECT_ADDRESS = V4_ADDRESS;
    const OLD_IDS = [749648617, 749646001, 749599170, 749540140, 749335380];
    
    // Get app ID from environment or use default
    let envAppId = process.env.REACT_APP_CONTRACT_APP_ID;
    let appId = envAppId ? parseInt(envAppId) : CORRECT_APP_ID;
    
    // REJECT old contract IDs - force correct one
    if (OLD_IDS.includes(appId)) {
      console.error(`[ContractUtils] CRITICAL: Detected old contract ID ${appId}! Forcing correct ID ${CORRECT_APP_ID}`);
      appId = CORRECT_APP_ID;
    }
    
    // Ensure we always use the correct ID
    if (appId !== CORRECT_APP_ID) {
      console.warn(`[ContractUtils] App ID ${appId} is not the correct one. Using ${CORRECT_APP_ID}`);
      appId = CORRECT_APP_ID;
    }
    
    this.appId = appId;
    console.log('[ContractUtils] Initialized with App ID:', this.appId, '(V4 Contract: 749653911)');

    // Get app address from environment or use default
    let envAppAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
    
    // REJECT old addresses
    if (envAppAddress && envAppAddress.includes('K2M726DQ')) {
      console.error(`[ContractUtils] CRITICAL: Detected old contract address! Using correct address`);
      envAppAddress = CORRECT_ADDRESS;
    }
    
    if (envAppAddress && !envAppAddress.includes('K2M726DQ')) {
      this.appAddress = envAppAddress;
      console.log('[ContractUtils] Initialized with Contract Address from environment');
    } else {
      // Calculate address from app ID
      this.appAddress = algosdk.getApplicationAddress(this.appId);
      console.log('[ContractUtils] Calculated Contract Address from App ID');
    }
    
    // Final verification
    if (!this.appAddress.includes('L5GY7SCG')) {
      console.warn('[ContractUtils] Address does not match expected. Recalculating...');
      this.appAddress = algosdk.getApplicationAddress(this.appId);
    }

    console.log('[ContractUtils] Contract initialized:', {
      appId: this.appId,
      appAddress: this.appAddress ? `${this.appAddress.slice(0, 8)}...${this.appAddress.slice(-8)}` : 'N/A',
      isCorrect: this.appId === V4_APP_ID && this.appAddress.includes('YGKN4WYULCTVLA6JHY6XEVKV2LQF4A5DOCEJWGUNGMUHIZQANLO4JGFFEQ')
    });
  }

  // Set contract app ID after deployment
  setAppId(appId) {
    this.appId = parseInt(appId);
    // Recalculate address
    if (this.appId) {
      this.appAddress = algosdk.getApplicationAddress(this.appId);
    }
    console.log('[ContractUtils] App ID updated:', this.appId);
  }

  // Get current contract app ID
  getAppId() {
    return this.appId;
  }

  // Get current contract address
  getAppAddress() {
    return this.appAddress || (this.appId ? algosdk.getApplicationAddress(this.appId) : null);
  }

  // Verify contract connection
  async verifyConnection() {
    if (!this.appId) {
      throw new Error('Contract App ID not set');
    }

    try {
      const appInfo = await this.algodClient.getApplicationByID(this.appId).do();
      console.log('[ContractUtils] Contract connection verified:', {
        appId: this.appId,
        creator: appInfo.params.creator,
        createdAt: appInfo.params['created-at-round']
      });
      return {
        connected: true,
        appId: this.appId,
        appAddress: this.getAppAddress(),
        creator: appInfo.params.creator,
        createdAt: appInfo.params['created-at-round']
      };
    } catch (error) {
      console.error('[ContractUtils] Contract connection failed:', error);
      throw new Error(`Failed to connect to contract: ${error.message}`);
    }
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
    // FORCE correct contract ID - reject all old IDs
    const CORRECT_APP_ID = V4_APP_ID;
    const OLD_IDS = [749646001, 749599170, 749540140, 749335380];
    
    // Force re-initialization to ensure we have the latest contract ID
    this.initializeContract();
    
    // FORCE correct ID - reject old IDs
    if (!this.appId || OLD_IDS.includes(this.appId) || this.appId !== CORRECT_APP_ID) {
      console.error(`[createAppCallTransaction] CRITICAL: Wrong contract ID ${this.appId}! Forcing ${CORRECT_APP_ID}`);
      this.appId = CORRECT_APP_ID;
      this.appAddress = algosdk.getApplicationAddress(this.appId);
    }
    
    // Final check - ALWAYS use correct ID
    const finalAppId = CORRECT_APP_ID; // Hardcode to ensure it's always correct
    
    console.log('Creating app call transaction:');
    console.log('  - App ID:', finalAppId, '(V4 Contract: 749653911)');
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

    // When boxes are used, we need to include the app ID in foreignApps
    // This is required because box references with appIndex need that app in foreignApps
    const foreignApps = [];
    if (boxes.length > 0) {
      // Extract unique app IDs from box references
      const boxAppIds = new Set();
      boxes.forEach(box => {
        if (box.appIndex) {
          boxAppIds.add(box.appIndex);
        }
      });
      
      // Add all box app IDs to foreignApps (including our own app ID if boxes reference it)
      boxAppIds.forEach(appId => {
        if (appId !== finalAppId) {
          foreignApps.push(appId);
        }
      });
      
      // If boxes reference our own app, we still need to include it in foreignApps
      // when the box reference has appIndex set
      const hasOwnAppBox = boxes.some(box => box.appIndex === finalAppId);
      if (hasOwnAppBox) {
        foreignApps.push(finalAppId);
      }
      
      console.log('  - Foreign Apps (for boxes):', foreignApps);
    }
    
    console.log(`[ContractUtils] Creating transaction with App ID: ${finalAppId} (FORCED)`);
    
    // ALWAYS use finalAppId (hardcoded correct ID) - never use this.appId
    const txn = algosdk.makeApplicationCallTxnFromObject({
      from: sender,
      appIndex: finalAppId, // Use hardcoded correct ID
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      suggestedParams,
      appArgs,
      accounts,
      foreignApps: foreignApps.length > 0 ? foreignApps : undefined,
      boxes: boxes.length > 0 ? boxes : undefined,
      note: note ? new Uint8Array(new TextEncoder().encode(note)) : undefined
    });

    // Verify the transaction has the correct app index
    if (txn.appIndex !== finalAppId) {
      console.error(`[ContractUtils] CRITICAL: Transaction appIndex (${txn.appIndex}) does not match expected (${finalAppId})`);
      throw new Error(`Transaction appIndex mismatch: expected ${finalAppId}, got ${txn.appIndex}`);
    }
    
    // Update this.appId to match what we used
    this.appId = finalAppId;

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
    // FORCE correct contract ID
    const CORRECT_APP_ID = V4_APP_ID;
    const OLD_IDS = [749646001, 749599170, 749540140, 749335380];
    
    // Ensure we have correct app ID
    if (!this.appId || OLD_IDS.includes(this.appId) || this.appId !== CORRECT_APP_ID) {
      console.warn(`[createBoxReference] Fixing app ID from ${this.appId} to ${CORRECT_APP_ID}`);
      this.appId = CORRECT_APP_ID;
    }
    
    // Box name format: "bounty_" + Itob(bounty_id)
    const prefix = new TextEncoder().encode('bounty_');
    const bountyIdBytes = algosdk.encodeUint64(bountyId);
    const boxNameBytes = new Uint8Array(prefix.length + bountyIdBytes.length);
    boxNameBytes.set(prefix, 0);
    boxNameBytes.set(bountyIdBytes, prefix.length);
    
    // ALWAYS use correct app ID in box reference
    return [{
      appIndex: CORRECT_APP_ID, // Force correct ID
      name: boxNameBytes
    }];
  }

  // Accept bounty (requires bounty_id)
  async acceptBounty(sender, bountyId) {
    try {
      if (!bountyId) {
        throw new Error('Bounty ID is required for acceptance');
      }
      
      // FORCE correct contract ID before proceeding
      const CORRECT_APP_ID = V4_APP_ID;
      const OLD_IDS = [749646001, 749599170, 749540140, 749335380];
      
      // Re-initialize to ensure correct ID
      this.initializeContract();
      
      // Force correct ID if it's wrong
      if (OLD_IDS.includes(this.appId) || this.appId !== CORRECT_APP_ID) {
        console.error(`[acceptBounty] CRITICAL: Wrong contract ID ${this.appId}! Forcing ${CORRECT_APP_ID}`);
        this.appId = CORRECT_APP_ID;
        this.appAddress = algosdk.getApplicationAddress(this.appId);
      }
      
      console.log(`[acceptBounty] Using contract ID: ${this.appId} (should be ${CORRECT_APP_ID})`);
      
      // Create box reference for the bounty box
      const boxReferences = this.createBoxReference(bountyId);
      
      // Verify box reference has correct app ID
      if (boxReferences[0] && boxReferences[0].appIndex !== CORRECT_APP_ID) {
        console.error(`[acceptBounty] CRITICAL: Box reference has wrong app ID ${boxReferences[0].appIndex}! Fixing...`);
        boxReferences[0].appIndex = CORRECT_APP_ID;
      }
      
      const appCallTxn = await this.createAppCallTransaction(
        sender,
        CONTRACT_METHODS.ACCEPT_BOUNTY,
        [algosdk.encodeUint64(bountyId)],
        [],
        'AlgoEase: Accept Bounty',
        boxReferences
      );
      
      // Final verification - check transaction app index
      if (appCallTxn.appIndex !== CORRECT_APP_ID) {
        console.error(`[acceptBounty] CRITICAL: Transaction has wrong appIndex ${appCallTxn.appIndex}! Expected ${CORRECT_APP_ID}`);
        throw new Error(`Transaction appIndex is ${appCallTxn.appIndex}, but must be ${CORRECT_APP_ID}`);
      }

      return appCallTxn;
    } catch (error) {
      console.error('Failed to create accept bounty transaction:', error);
      throw error;
    }
  }

  // Approve bounty (verifier only, requires bounty_id)
  async approveBounty(sender, bountyId) {
    try {
      if (!bountyId && bountyId !== 0) {
        throw new Error('Bounty ID is required for approval');
      }
      
      // Convert to number if it's a string
      const numericBountyId = typeof bountyId === 'string' ? parseInt(bountyId) : bountyId;
      if (isNaN(numericBountyId)) {
        throw new Error(`Invalid bounty ID: ${bountyId}. Must be a number.`);
      }
      
      // FORCE correct contract ID before proceeding
      const CORRECT_APP_ID = V4_APP_ID;
      const OLD_IDS = [749648617, 749646001, 749599170, 749540140, 749335380];
      
      // Re-initialize to ensure correct ID
      this.initializeContract();
      
      // Force correct ID if it's wrong
      if (OLD_IDS.includes(this.appId) || this.appId !== CORRECT_APP_ID) {
        console.error(`[approveBounty] CRITICAL: Wrong contract ID ${this.appId}! Forcing ${CORRECT_APP_ID}`);
        this.appId = CORRECT_APP_ID;
        this.appAddress = algosdk.getApplicationAddress(this.appId);
      }
      
      console.log(`[approveBounty] Using contract ID: ${this.appId} (should be ${CORRECT_APP_ID})`);
      console.log(`[approveBounty] Bounty ID: ${numericBountyId} (type: ${typeof numericBountyId})`);
      
      // CRITICAL: Get freelancer address from bounty box
      // The contract needs the freelancer address in the accounts array for the inner transaction
      let freelancerAddress = null;
      let bountyData = null;
      
      try {
        console.log(`[approveBounty] Attempting to read bounty box for ID: ${numericBountyId}`);
        bountyData = await this.getBountyFromBox(numericBountyId);
        console.log(`[approveBounty] Bounty data from box:`, JSON.stringify(bountyData, null, 2));
        
        if (bountyData) {
          if (bountyData.freelancerAddress) {
            freelancerAddress = bountyData.freelancerAddress;
            console.log(`[approveBounty] ✅ Found freelancer address: ${freelancerAddress}`);
          } else {
            console.warn(`[approveBounty] ⚠️ Bounty data exists but freelancerAddress is null/undefined`);
            console.warn(`[approveBounty] Bounty status: ${bountyData.status}`);
            console.warn(`[approveBounty] This likely means the bounty has not been accepted yet.`);
          }
        } else {
          console.error(`[approveBounty] ❌ getBountyFromBox returned null - box may not exist`);
          
          // Try to verify if the bounty exists by checking contract state
          try {
            const contractState = await this.getContractState();
            const bountyCount = contractState['bounty_count'] || contractState[GLOBAL_STATE_KEYS.BOUNTY_COUNT] || 0;
            console.log(`[approveBounty] Contract bounty count: ${bountyCount}`);
            
            if (numericBountyId >= bountyCount) {
              throw new Error(
                `Bounty ID ${numericBountyId} does not exist. The contract only has ${bountyCount} bounties (IDs 0-${bountyCount - 1}).\n\n` +
                `Please verify:\n` +
                `- The bounty ID is correct\n` +
                `- The bounty was successfully created on-chain\n` +
                `- You are using the correct contract ID: ${CORRECT_APP_ID} (V4)`
              );
            }
          } catch (stateError) {
            console.warn(`[approveBounty] Could not verify bounty count:`, stateError);
          }
        }
      } catch (boxError) {
        console.error(`[approveBounty] ❌ Error reading bounty box:`, boxError);
        console.error(`[approveBounty] Error details:`, {
          message: boxError.message,
          status: boxError.status,
          statusCode: boxError.statusCode,
          response: boxError.response
        });
        
        // Check if it's a 404 (box doesn't exist)
        if (boxError.status === 404 || boxError.statusCode === 404 || 
            boxError.message?.includes('box not found') || 
            boxError.message?.includes('does not exist') ||
            boxError.message?.includes('no boxes found')) {
          
          // Try to verify if the bounty exists by checking contract state
          let bountyCount = null;
          try {
            const contractState = await this.getContractState();
            bountyCount = contractState['bounty_count'] || contractState[GLOBAL_STATE_KEYS.BOUNTY_COUNT] || 0;
            console.log(`[approveBounty] Contract bounty count: ${bountyCount}`);
          } catch (stateError) {
            console.warn(`[approveBounty] Could not verify bounty count:`, stateError);
          }
          
          let errorMsg = `Bounty box not found for ID ${numericBountyId} on contract ${this.appId}.\n\n`;
          if (bountyCount !== null) {
            if (numericBountyId >= bountyCount) {
              errorMsg += `The bounty ID ${numericBountyId} does not exist. The contract only has ${bountyCount} bounties (IDs 0-${bountyCount - 1}).\n\n`;
            } else {
              errorMsg += `The contract has ${bountyCount} bounties, but the box for bounty ID ${numericBountyId} could not be read.\n\n`;
            }
          }
          errorMsg += `This usually means:\n` +
            `- The bounty was created with a different contract ID\n` +
            `- The bounty ID is incorrect\n` +
            `- The bounty hasn't been created on-chain yet\n` +
            `- There was an issue creating the bounty box\n\n` +
            `Please verify:\n` +
            `- The bounty was successfully created on-chain\n` +
            `- The contract ID matches: ${CORRECT_APP_ID} (V4)\n` +
            `- The bounty ID is correct: ${numericBountyId}`;
          
          throw new Error(errorMsg);
        }
        
        // Re-throw other errors
        throw boxError;
      }
      
      // If we still don't have a freelancer address, provide detailed error
      if (!freelancerAddress) {
        let errorMsg;
        if (bountyData) {
          // Bounty exists but hasn't been accepted
          errorMsg = `Bounty exists but has not been accepted yet. Status: ${bountyData.status}. A freelancer must accept the bounty before it can be approved.`;
        } else {
          // Box doesn't exist - provide helpful troubleshooting
          errorMsg = `Failed to read bounty data from blockchain.\n\n` +
            `Bounty ID: ${numericBountyId}\n` +
            `Contract ID: ${this.appId}\n\n` +
            `Possible reasons:\n` +
            `1. The bounty may not exist on the smart contract\n` +
            `2. The bounty ID may be incorrect\n` +
            `3. The bounty may have been created with a different contract ID\n` +
            `4. The box storage may be inaccessible\n\n` +
            `Please verify:\n` +
            `- The bounty was successfully created on-chain\n` +
            `- The contract ID matches: ${this.appId} (V4)\n` +
            `- The bounty ID is correct: ${numericBountyId}`;
        }
        console.error(`[approveBounty] ${errorMsg}`);
        throw new Error(errorMsg);
      }
      
      // CRITICAL: Validate freelancer address
      if (!freelancerAddress || !algosdk.isValidAddress(freelancerAddress)) {
        throw new Error('Invalid or missing freelancer address. The bounty must be accepted before it can be approved.');
      }
      
      // Create accounts array - MUST include freelancer address for inner transaction
      // The freelancer MUST be the first account in the array
      const accounts = [freelancerAddress];
      console.log(`[approveBounty] Accounts array for transaction:`, accounts);
      
      // Create box reference for the bounty box
      const boxReferences = this.createBoxReference(bountyId);
      
      // Verify box reference has correct app ID
      if (boxReferences[0] && boxReferences[0].appIndex !== CORRECT_APP_ID) {
        console.error(`[approveBounty] CRITICAL: Box reference has wrong app ID ${boxReferences[0].appIndex}! Fixing...`);
        boxReferences[0].appIndex = CORRECT_APP_ID;
      }
      
      console.log(`[approveBounty] Creating transaction with:`);
      console.log(`  - Sender: ${sender}`);
      console.log(`  - Bounty ID: ${numericBountyId}`);
      console.log(`  - Freelancer (in accounts): ${freelancerAddress}`);
      console.log(`  - App ID: ${CORRECT_APP_ID}`);
      
      const appCallTxn = await this.createAppCallTransaction(
        sender,
        CONTRACT_METHODS.APPROVE_BOUNTY,
        [algosdk.encodeUint64(numericBountyId)],
        accounts, // Include freelancer address for inner transaction
        'AlgoEase: Approve Bounty',
        boxReferences
      );
      
      // Final verification - check transaction app index
      if (appCallTxn.appIndex !== CORRECT_APP_ID) {
        console.error(`[approveBounty] CRITICAL: Transaction has wrong appIndex ${appCallTxn.appIndex}! Expected ${CORRECT_APP_ID}`);
        throw new Error(`Transaction appIndex is ${appCallTxn.appIndex}, but must be ${CORRECT_APP_ID}`);
      }
      
      // Verify accounts array is included
      if (!appCallTxn.appAccounts || appCallTxn.appAccounts.length === 0) {
        console.error(`[approveBounty] CRITICAL: Transaction does not have accounts array!`);
        throw new Error('Transaction missing accounts array with freelancer address');
      }
      
      console.log(`[approveBounty] Transaction created successfully with accounts:`, appCallTxn.appAccounts);

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
      
      // FORCE correct contract ID before proceeding
      const CORRECT_APP_ID = V4_APP_ID;
      const OLD_IDS = [749646001, 749599170, 749540140, 749335380];
      
      // Re-initialize to ensure correct ID
      this.initializeContract();
      
      // Force correct ID if it's wrong
      if (OLD_IDS.includes(this.appId) || this.appId !== CORRECT_APP_ID) {
        console.error(`[rejectBounty] CRITICAL: Wrong contract ID ${this.appId}! Forcing ${CORRECT_APP_ID}`);
        this.appId = CORRECT_APP_ID;
        this.appAddress = algosdk.getApplicationAddress(this.appId);
      }
      
      // Get client address from bounty box for refund
      // The contract needs the client address in accounts array for inner transaction
      let clientAddress = null;
      try {
        const bountyData = await this.getBountyFromBox(bountyId);
        console.log(`[rejectBounty] Bounty data from box:`, bountyData);
        if (bountyData && bountyData.clientAddress) {
          clientAddress = bountyData.clientAddress;
          console.log(`[rejectBounty] Found client address: ${clientAddress}`);
        } else {
          console.warn(`[rejectBounty] Could not get client address from box.`);
          throw new Error('Failed to retrieve client address from bounty data.');
        }
      } catch (boxError) {
        console.error(`[rejectBounty] Error reading bounty box:`, boxError);
        throw new Error(`Failed to read bounty data: ${boxError.message}`);
      }
      
      // CRITICAL: Validate client address
      if (!clientAddress || !algosdk.isValidAddress(clientAddress)) {
        throw new Error('Invalid or missing client address.');
      }
      
      // Create accounts array - MUST include client address for inner transaction (refund)
      // The client MUST be the first account in the array
      const accounts = [clientAddress];
      console.log(`[rejectBounty] Accounts array for transaction:`, accounts);
      
      // Create box reference for the bounty box
      const boxReferences = this.createBoxReference(bountyId);
      
      // Verify box reference has correct app ID
      if (boxReferences[0] && boxReferences[0].appIndex !== CORRECT_APP_ID) {
        console.error(`[rejectBounty] CRITICAL: Box reference has wrong app ID ${boxReferences[0].appIndex}! Fixing...`);
        boxReferences[0].appIndex = CORRECT_APP_ID;
      }
      
      console.log(`[rejectBounty] Creating transaction with:`);
      console.log(`  - Sender: ${sender}`);
      console.log(`  - Bounty ID: ${bountyId}`);
      console.log(`  - Client (in accounts): ${clientAddress}`);
      console.log(`  - App ID: ${CORRECT_APP_ID}`);
      
      // Reject uses the reject_bounty function on the contract
      const appCallTxn = await this.createAppCallTransaction(
        sender,
        CONTRACT_METHODS.REJECT_BOUNTY,
        [algosdk.encodeUint64(bountyId)],
        accounts, // Include client address for inner transaction
        'AlgoEase: Reject Bounty',
        boxReferences
      );
      
      // Final verification - check transaction app index
      if (appCallTxn.appIndex !== CORRECT_APP_ID) {
        console.error(`[rejectBounty] CRITICAL: Transaction has wrong appIndex ${appCallTxn.appIndex}! Expected ${CORRECT_APP_ID}`);
        throw new Error(`Transaction appIndex is ${appCallTxn.appIndex}, but must be ${CORRECT_APP_ID}`);
      }
      
      // Verify accounts array is included
      if (!appCallTxn.appAccounts || appCallTxn.appAccounts.length === 0) {
        console.error(`[rejectBounty] CRITICAL: Transaction does not have accounts array!`);
        throw new Error('Transaction missing accounts array with client address');
      }
      
      console.log(`[rejectBounty] Transaction created successfully with accounts:`, appCallTxn.appAccounts);

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
      
      // FORCE correct contract ID before proceeding
      const CORRECT_APP_ID = V4_APP_ID;
      const OLD_IDS = [749646001, 749599170, 749540140, 749335380];
      
      // Re-initialize to ensure correct ID
      this.initializeContract();
      
      // Force correct ID if it's wrong
      if (OLD_IDS.includes(this.appId) || this.appId !== CORRECT_APP_ID) {
        console.error(`[claimBounty] CRITICAL: Wrong contract ID ${this.appId}! Forcing ${CORRECT_APP_ID}`);
        this.appId = CORRECT_APP_ID;
        this.appAddress = algosdk.getApplicationAddress(this.appId);
      }
      
      // CRITICAL: Get freelancer address from bounty box
      // The contract needs the freelancer address in the accounts array for the inner transaction
      let freelancerAddress = null;
      try {
        const bountyData = await this.getBountyFromBox(bountyId);
        console.log(`[claimBounty] Bounty data from box:`, bountyData);
        if (bountyData && bountyData.freelancerAddress) {
          freelancerAddress = bountyData.freelancerAddress;
          console.log(`[claimBounty] Found freelancer address: ${freelancerAddress}`);
        } else {
          console.warn(`[claimBounty] Could not get freelancer address from box.`);
          throw new Error('Failed to retrieve freelancer address from bounty data.');
        }
      } catch (boxError) {
        console.error(`[claimBounty] Error reading bounty box:`, boxError);
        throw new Error(`Failed to read bounty data: ${boxError.message}`);
      }
      
      // CRITICAL: Validate freelancer address
      if (!freelancerAddress || !algosdk.isValidAddress(freelancerAddress)) {
        throw new Error('Invalid or missing freelancer address.');
      }
      
      // Create accounts array - MUST include freelancer address for inner transaction
      // The freelancer MUST be the first account in the array
      const accounts = [freelancerAddress];
      console.log(`[claimBounty] Accounts array for transaction:`, accounts);
      
      // Create box reference for the bounty box
      const boxReferences = this.createBoxReference(bountyId);
      
      // Verify box reference has correct app ID
      if (boxReferences[0] && boxReferences[0].appIndex !== CORRECT_APP_ID) {
        console.error(`[claimBounty] CRITICAL: Box reference has wrong app ID ${boxReferences[0].appIndex}! Fixing...`);
        boxReferences[0].appIndex = CORRECT_APP_ID;
      }
      
      console.log(`[claimBounty] Creating transaction with:`);
      console.log(`  - Sender: ${sender}`);
      console.log(`  - Bounty ID: ${bountyId}`);
      console.log(`  - Freelancer (in accounts): ${freelancerAddress}`);
      console.log(`  - App ID: ${CORRECT_APP_ID}`);
      
      const appCallTxn = await this.createAppCallTransaction(
        sender,
        CONTRACT_METHODS.CLAIM_BOUNTY,
        [algosdk.encodeUint64(bountyId)],
        accounts, // Include freelancer address for inner transaction
        'AlgoEase: Claim Bounty',
        boxReferences
      );
      
      // Final verification - check transaction app index
      if (appCallTxn.appIndex !== CORRECT_APP_ID) {
        console.error(`[claimBounty] CRITICAL: Transaction has wrong appIndex ${appCallTxn.appIndex}! Expected ${CORRECT_APP_ID}`);
        throw new Error(`Transaction appIndex is ${appCallTxn.appIndex}, but must be ${CORRECT_APP_ID}`);
      }
      
      // Verify accounts array is included
      if (!appCallTxn.appAccounts || appCallTxn.appAccounts.length === 0) {
        console.error(`[claimBounty] CRITICAL: Transaction does not have accounts array!`);
        throw new Error('Transaction missing accounts array with freelancer address');
      }
      
      console.log(`[claimBounty] Transaction created successfully with accounts:`, appCallTxn.appAccounts);

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
      
      // FORCE correct contract ID before proceeding
      const CORRECT_APP_ID = V4_APP_ID;
      const OLD_IDS = [749646001, 749599170, 749540140, 749335380];
      
      // Re-initialize to ensure correct ID
      this.initializeContract();
      
      // Force correct ID if it's wrong
      if (OLD_IDS.includes(this.appId) || this.appId !== CORRECT_APP_ID) {
        console.error(`[refundBounty] CRITICAL: Wrong contract ID ${this.appId}! Forcing ${CORRECT_APP_ID}`);
        this.appId = CORRECT_APP_ID;
        this.appAddress = algosdk.getApplicationAddress(this.appId);
      }

      // Get client address from bounty box for refund
      // The contract needs the client address in accounts array for inner transaction
      let clientAddress = null;
      try {
        const bountyData = await this.getBountyFromBox(bountyId);
        console.log(`[refundBounty] Bounty data from box:`, bountyData);
        if (bountyData && bountyData.clientAddress) {
          clientAddress = bountyData.clientAddress;
          console.log(`[refundBounty] Found client address: ${clientAddress}`);
        } else {
          console.warn(`[refundBounty] Could not get client address from box.`);
          throw new Error('Failed to retrieve client address from bounty data.');
        }
      } catch (boxError) {
        console.error(`[refundBounty] Error reading bounty box:`, boxError);
        throw new Error(`Failed to read bounty data: ${boxError.message}`);
      }
      
      // CRITICAL: Validate client address
      if (!clientAddress || !algosdk.isValidAddress(clientAddress)) {
        throw new Error('Invalid or missing client address.');
      }
      
      // Create accounts array - MUST include client address for inner transaction (refund)
      // The client MUST be the first account in the array
      const accounts = [clientAddress];
      console.log(`[refundBounty] Accounts array for transaction:`, accounts);

      // Create box reference for the bounty box
      const boxReferences = this.createBoxReference(bountyId);
      
      // Verify box reference has correct app ID
      if (boxReferences[0] && boxReferences[0].appIndex !== CORRECT_APP_ID) {
        console.error(`[refundBounty] CRITICAL: Box reference has wrong app ID ${boxReferences[0].appIndex}! Fixing...`);
        boxReferences[0].appIndex = CORRECT_APP_ID;
      }
      
      console.log(`[refundBounty] Creating transaction with:`);
      console.log(`  - Sender: ${sender}`);
      console.log(`  - Bounty ID: ${bountyId}`);
      console.log(`  - Client (in accounts): ${clientAddress}`);
      console.log(`  - App ID: ${CORRECT_APP_ID}`);

      // V3 contract requires bounty_id as argument: [method, bounty_id]
      const appCallTxn = await this.createAppCallTransaction(
        sender,
        CONTRACT_METHODS.REFUND_BOUNTY,
        [algosdk.encodeUint64(bountyId)], // Pass bounty_id as argument
        accounts, // Include client address for inner transaction
        'AlgoEase: Refund Bounty',
        boxReferences
      );
      
      // Final verification - check transaction app index
      if (appCallTxn.appIndex !== CORRECT_APP_ID) {
        console.error(`[refundBounty] CRITICAL: Transaction has wrong appIndex ${appCallTxn.appIndex}! Expected ${CORRECT_APP_ID}`);
        throw new Error(`Transaction appIndex is ${appCallTxn.appIndex}, but must be ${CORRECT_APP_ID}`);
      }
      
      // Verify accounts array is included
      if (!appCallTxn.appAccounts || appCallTxn.appAccounts.length === 0) {
        console.error(`[refundBounty] CRITICAL: Transaction does not have accounts array!`);
        throw new Error('Transaction missing accounts array with client address');
      }
      
      console.log(`[refundBounty] Transaction created successfully with accounts:`, appCallTxn.appAccounts);

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

      // Get client address from bounty box for refund
      // The contract needs the client address in accounts array for inner transaction
      let clientAddress = null;
      try {
        const bountyData = await this.getBountyFromBox(bountyId);
        if (bountyData && bountyData.clientAddress) {
          clientAddress = bountyData.clientAddress;
          console.log(`[autoRefundBounty] Found client address: ${clientAddress}`);
        }
      } catch (boxError) {
        console.error(`[autoRefundBounty] Error reading bounty box:`, boxError);
      }
      
      // Create accounts array - include client address for refund
      const accounts = [];
      if (clientAddress) {
        accounts.push(clientAddress);
        console.log(`[autoRefundBounty] Including client in accounts array: ${clientAddress}`);
      }

      // Create box reference for the bounty box
      const boxReferences = this.createBoxReference(bountyId);

      // V3 contract requires bounty_id as argument: [method, bounty_id]
      const appCallTxn = await this.createAppCallTransaction(
        sender,
        CONTRACT_METHODS.AUTO_REFUND,
        [algosdk.encodeUint64(bountyId)], // Pass bounty_id as argument
        accounts, // Include client address for inner transaction
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
      // Use stored address if available, otherwise calculate from app ID
      if (this.appAddress) {
        return this.appAddress;
      }
      // Calculate the application address from the app ID
      // This is the address where the smart contract funds are stored
      const appAddress = algosdk.getApplicationAddress(this.appId);
      this.appAddress = appAddress; // Cache it
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
    // Declare variables outside try block so they're accessible in catch
    let boxNameBytes = null;
    let boxNameBase64 = null;
    
    try {
      // Ensure contract is initialized with correct ID
      this.initializeContract();
      
      const CORRECT_APP_ID = V4_APP_ID;
      const OLD_IDS = [749648617, 749646001, 749599170, 749540140, 749335380];
      
      // Force correct contract ID
      if (OLD_IDS.includes(this.appId) || this.appId !== CORRECT_APP_ID) {
        console.warn(`[getBountyFromBox] Fixing contract ID from ${this.appId} to ${CORRECT_APP_ID}`);
        this.appId = CORRECT_APP_ID;
        this.appAddress = algosdk.getApplicationAddress(this.appId);
      }
      
      if (!this.appId) {
        throw new Error('Contract app ID not set');
      }

      console.log(`[getBountyFromBox] Reading box for bounty ID: ${bountyId}, app ID: ${this.appId}`);

      // Box name format: "bounty_" + Itob(bounty_id)
      // Contract uses: Concat(Bytes("bounty_"), Itob(bounty_id))
      const prefix = new TextEncoder().encode('bounty_');
      const bountyIdBytes = algosdk.encodeUint64(bountyId);
      boxNameBytes = new Uint8Array(prefix.length + bountyIdBytes.length);
      boxNameBytes.set(prefix, 0);
      boxNameBytes.set(bountyIdBytes, prefix.length);
      
      // Convert to base64 for API call
      boxNameBase64 = Buffer.from(boxNameBytes).toString('base64');
      
      console.log(`[getBountyFromBox] Box name (base64): ${boxNameBase64}`);
      console.log(`[getBountyFromBox] Box name (hex): ${Buffer.from(boxNameBytes).toString('hex')}`);
      
      // Get box value using indexer or algod
      // Try using indexer first (more reliable for box reads)
      try {
        console.log(`[getBountyFromBox] Attempting to read box from indexer...`);
        console.log(`[getBountyFromBox] App ID: ${this.appId}, Box name (base64): ${boxNameBase64}`);
        
        const boxValue = await this.indexerClient.lookupApplicationBoxByIDandName(
          this.appId,
          boxNameBase64
        ).do();
        
        console.log(`[getBountyFromBox] Indexer response:`, boxValue);
        
        if (!boxValue || !boxValue.value) {
          console.warn(`[getBountyFromBox] Box value is null or empty`);
          
          // Try to list all boxes to see what exists
          try {
            console.log(`[getBountyFromBox] Attempting to list all boxes for app ${this.appId}...`);
            const boxesResponse = await this.indexerClient.lookupApplicationBoxes(this.appId).do();
            console.log(`[getBountyFromBox] Total boxes found: ${boxesResponse.boxes?.length || 0}`);
            if (boxesResponse.boxes && boxesResponse.boxes.length > 0) {
              console.log(`[getBountyFromBox] First few box names:`, 
                boxesResponse.boxes.slice(0, 5).map(b => ({
                  name: b.name,
                  nameHex: Buffer.from(b.name, 'base64').toString('hex'),
                  nameStr: new TextDecoder().decode(Buffer.from(b.name, 'base64'))
                }))
              );
            }
          } catch (listError) {
            console.warn(`[getBountyFromBox] Could not list boxes:`, listError);
          }
          
          return null;
        }
        
        // boxValue.value is base64 encoded
        const boxData = Buffer.from(boxValue.value, 'base64');
        console.log(`[getBountyFromBox] Box data length: ${boxData.length} bytes`);

        // Parse box data
        // Format: client_addr(32) + freelancer_addr(32) + verifier_addr(32) + 
        //         amount(8) + deadline(8) + status(1) + task_desc(variable)
        const data = new Uint8Array(boxData);
        
        if (data.length < 113) {
          console.error(`[getBountyFromBox] Box data too short: ${data.length} bytes (expected at least 113)`);
          return null;
        }
        
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

        const result = {
          bountyId,
          clientAddress: clientAddr,
          freelancerAddress: freelancerAddr,
          verifierAddress: verifierAddr,
          amount: amountMicro / 1000000,
          deadline: new Date(deadlineSeconds * 1000),
          status,
          taskDescription: taskDesc
        };
        
        console.log(`[getBountyFromBox] Successfully parsed box data:`, {
          bountyId: result.bountyId,
          clientAddress: result.clientAddress,
          freelancerAddress: result.freelancerAddress,
          verifierAddress: result.verifierAddress,
          amount: result.amount,
          status: result.status
        });

        return result;
      } catch (indexerError) {
        // Fallback to algod if indexer fails
        console.warn(`[getBountyFromBox] Indexer box read failed, trying algod:`, indexerError);
        console.warn(`[getBountyFromBox] Indexer error details:`, {
          message: indexerError.message,
          status: indexerError.status,
          statusCode: indexerError.statusCode,
          response: indexerError.response
        });
        
        try {
          const boxValue = await this.algodClient.getApplicationBoxByName(
            this.appId,
            boxNameBase64
          ).do();
          
          console.log(`[getBountyFromBox] Algod response:`, boxValue);
          
          if (!boxValue || !boxValue.value) {
            console.warn(`[getBountyFromBox] Algod box value is null or empty`);
            return null;
          }
          
          const boxData = Buffer.from(boxValue.value, 'base64');
          const data = new Uint8Array(boxData);
          
          if (data.length < 113) {
            console.error(`[getBountyFromBox] Algod box data too short: ${data.length} bytes`);
            return null;
          }
          
          const clientAddr = algosdk.encodeAddress(data.slice(0, 32));
          const freelancerBytes = data.slice(32, 64);
          const isZeroAddress = freelancerBytes.every(byte => byte === 0);
          const freelancerAddr = isZeroAddress ? null : algosdk.encodeAddress(freelancerBytes);
          const verifierAddr = algosdk.encodeAddress(data.slice(64, 96));
          const amountMicro = algosdk.decodeUint64(data.slice(96, 104), 'big');
          const deadlineSeconds = algosdk.decodeUint64(data.slice(104, 112), 'big');
          const status = data[112];
          const taskDesc = new TextDecoder().decode(data.slice(113));

          const result = {
            bountyId,
            clientAddress: clientAddr,
            freelancerAddress: freelancerAddr,
            verifierAddress: verifierAddr,
            amount: amountMicro / 1000000,
            deadline: new Date(deadlineSeconds * 1000),
            status,
            taskDescription: taskDesc
          };
          
          console.log(`[getBountyFromBox] Successfully parsed box data from algod:`, {
            bountyId: result.bountyId,
            status: result.status
          });

          return result;
        } catch (algodError) {
          console.error(`[getBountyFromBox] Algod box read also failed:`, algodError);
          console.error(`[getBountyFromBox] Algod error details:`, {
            message: algodError.message,
            status: algodError.status,
            statusCode: algodError.statusCode,
            response: algodError.response
          });
          throw algodError;
        }
      }
    } catch (error) {
      console.error('[getBountyFromBox] Failed to get bounty from box:', error);
      console.error('[getBountyFromBox] Error details:', {
        message: error.message,
        status: error.status,
        statusCode: error.statusCode,
        response: error.response,
        stack: error.stack
      });
      
      // If box doesn't exist, return null (but log helpful info)
      if (error.status === 404 || 
          error.statusCode === 404 ||
          error.message?.includes('box not found') || 
          error.message?.includes('does not exist') ||
          error.message?.includes('no boxes found') ||
          error.message?.includes('application does not exist')) {
        console.warn(`[getBountyFromBox] Box does not exist for bounty ID: ${bountyId}`);
        if (boxNameBytes) {
          console.warn(`[getBountyFromBox] Box name was: ${Buffer.from(boxNameBytes).toString('hex')} (hex)`);
        }
        if (boxNameBase64) {
          console.warn(`[getBountyFromBox] Box name (base64): ${boxNameBase64}`);
        }
        console.warn(`[getBountyFromBox] Contract ID: ${this.appId}`);
        
        // Try to verify if the bounty should exist by checking contract state
        try {
          const contractState = await this.getContractState();
          const bountyCount = contractState['bounty_count'] || contractState[GLOBAL_STATE_KEYS.BOUNTY_COUNT] || 0;
          console.warn(`[getBountyFromBox] Contract has ${bountyCount} bounties (IDs 0-${bountyCount - 1})`);
          if (bountyId >= bountyCount) {
            console.error(`[getBountyFromBox] Bounty ID ${bountyId} is out of range!`);
          }
        } catch (stateError) {
          console.warn(`[getBountyFromBox] Could not verify bounty count:`, stateError);
        }
        
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
