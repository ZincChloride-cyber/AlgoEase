// Smart Contract Utilities for AlgoEase
import algosdk from 'algosdk/dist/browser/algosdk.min.js';
import { Buffer } from 'buffer';

if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer;
}

// Bounty Escrow Contract details - Current deployed contract V2
const BOUNTY_ESCROW_APP_ID = 749707697; // Bounty Escrow Contract V2 (escrow and claim flow)
const BOUNTY_ESCROW_ADDRESS = 'ZS2EW3YGUDATK5OH4S7QUPMIJ4T6ROU6OFJEAGKFD2RSEHPSOCJ3BZBFLU'; // Bounty Escrow Contract V2 address

// Contract configuration
// Bounty Escrow Contract ID - use environment variable or default
const DEFAULT_APP_ID = parseInt(process.env.REACT_APP_CONTRACT_APP_ID) || BOUNTY_ESCROW_APP_ID;
const DEFAULT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || BOUNTY_ESCROW_ADDRESS;

// Get app ID from environment or use V6 default
let envAppId = DEFAULT_APP_ID;
// Get address from environment or use V6 default
let envAppAddress = DEFAULT_ADDRESS;

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
  'freelancer_addr'
  // Note: New contract doesn't have verifier - creator only
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

// Contract method constants (Algopy version)
export const CONTRACT_METHODS = {
  CREATE_BOUNTY: 'create_bounty',
  ACCEPT_BOUNTY: 'accept_bounty',
  SUBMIT_BOUNTY: 'submit_bounty',
  APPROVE_BOUNTY: 'approve_bounty',
  REJECT_BOUNTY: 'reject_bounty',
  CLAIM_BOUNTY: 'claim_bounty',
  REFUND_BOUNTY: 'refund_bounty',
  AUTO_REFUND: 'auto_refund',
  GET_BOUNTY_INFO: 'get_bounty_info',
  GET_BOUNTY_COUNT: 'get_bounty_count'
};

// Status constants matching the V2 Bounty Escrow contract
// Updated to match algoease_bounty_escrow_v2.py
export const BOUNTY_STATUS = {
  OPEN: 0,          // Bounty created, waiting for freelancer
  ACCEPTED: 1,      // Freelancer accepted the bounty
  SUBMITTED: 2,     // Freelancer submitted work
  APPROVED: 3,      // Creator approved, funds automatically transferred to freelancer
  REJECTED: 4       // Work rejected, funds automatically refunded to creator
  // Note: V2 contract doesn't have CLAIMED or REFUNDED statuses
  // Funds transfer automatically on approve/reject
};

// Global state keys from the contract
export const GLOBAL_STATE_KEYS = {
  BOUNTY_COUNT: 'bounty_count',
  CLIENT_ADDR: 'client_addr',
  FREELANCER_ADDR: 'freelancer_addr',
  AMOUNT: 'amount',
  STATUS: 'status',
  TASK_DESCRIPTION: 'task_desc'
  // Note: New contract doesn't have deadline or verifier
};

class ContractUtils {
  constructor() {
    // Use environment variable or default to new contract V2
    const APP_ID = parseInt(process.env.REACT_APP_CONTRACT_APP_ID) || BOUNTY_ESCROW_APP_ID;
    const APP_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || BOUNTY_ESCROW_ADDRESS;
    
    this.algodClient = CONTRACT_CONFIG.algodClient;
    this.indexerClient = CONTRACT_CONFIG.indexerClient;
    // Use contract ID and address from env or defaults
    this.appId = APP_ID;
    this.appAddress = APP_ADDRESS;
    // Initialize contract connection
    this.initializeContract();
  }

  // Initialize contract connection
  initializeContract() {
    // Use environment variable or default to new contract V2
    const APP_ID = parseInt(process.env.REACT_APP_CONTRACT_APP_ID) || BOUNTY_ESCROW_APP_ID;
    const APP_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || BOUNTY_ESCROW_ADDRESS;
    
    // Set the contract ID and address
    this.appId = APP_ID;
    this.appAddress = APP_ADDRESS;
    
    console.log('[ContractUtils] Initialized with App ID:', this.appId, '(Bounty Escrow Contract V2)');
    console.log('[ContractUtils] Contract Address:', this.appAddress);
    console.log('[ContractUtils] Contract initialized:', {
      appId: this.appId,
      appAddress: this.appAddress ? `${this.appAddress.slice(0, 8)}...${this.appAddress.slice(-8)}` : 'N/A',
      version: 'Bounty Escrow V2 (Escrow and Claim Flow)'
    });
  }

  // Set contract app ID after deployment
  setAppId(appId) {
    const APP_ID = parseInt(process.env.REACT_APP_CONTRACT_APP_ID) || appId || BOUNTY_ESCROW_APP_ID;
    const APP_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || BOUNTY_ESCROW_ADDRESS;
    
    // Set the contract ID and address
    this.appId = APP_ID;
    this.appAddress = APP_ADDRESS;
    console.log('[ContractUtils] App ID set:', this.appId);
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
  async createAppCallTransaction(sender, method, args = [], accounts = [], note = '', boxes = [], fee = null) {
    // Use environment variable or default to new contract V2
    const APP_ID = parseInt(process.env.REACT_APP_CONTRACT_APP_ID) || this.appId || BOUNTY_ESCROW_APP_ID;
    const APP_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || this.appAddress || BOUNTY_ESCROW_ADDRESS;
    
    // Use the contract ID and address
    let finalAppId = APP_ID;
    this.appId = APP_ID;
    this.appAddress = APP_ADDRESS;
    
    console.log('Creating app call transaction:');
    console.log('  - App ID:', finalAppId, '(Bounty Escrow Contract - FORCED)');
    console.log('  - Method:', method);
    console.log('  - Sender:', sender);
    console.log('  - Accounts array:', accounts);
    console.log('  - Accounts length:', accounts.length);
    console.log('  - Boxes:', boxes);

    const suggestedParams = await this.getSuggestedParams();
    
    // Override fee if provided (needed for inner transactions)
    if (fee !== null && fee !== undefined) {
      suggestedParams.fee = fee;
      console.log(`[createAppCallTransaction] Using custom fee: ${fee} microAlgos`);
    }
    
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
    
    // Validate and format accounts array - must be array of strings (addresses)
    let formattedAccounts = [];
    if (accounts && accounts.length > 0) {
      formattedAccounts = accounts.map(addr => {
        if (typeof addr === 'string') {
          // Validate it's a valid Algorand address
          if (!algosdk.isValidAddress(addr)) {
            throw new Error(`Invalid Algorand address in accounts array: ${addr}`);
          }
          return addr;
        } else if (addr instanceof Uint8Array) {
          // Convert Uint8Array to address string
          return algosdk.encodeAddress(addr);
        } else {
          throw new Error(`Invalid account type in accounts array: ${typeof addr}. Expected string or Uint8Array.`);
        }
      });
    }
    
    console.log(`[ContractUtils] Formatted accounts:`, formattedAccounts);
    
    // Validate and format boxes array - must be array of objects with appIndex and name
    let formattedBoxes = [];
    if (boxes && boxes.length > 0) {
      console.log(`[createAppCallTransaction] Processing ${boxes.length} box reference(s)...`);
      formattedBoxes = boxes.map((box, index) => {
        if (!box || typeof box !== 'object') {
          throw new Error(`Invalid box format at index ${index}. Expected object with appIndex and name, got: ${typeof box}`);
        }
        
        const appIndex = box.appIndex;
        const name = box.name;
        
        if (typeof appIndex !== 'number' || !Number.isInteger(appIndex) || appIndex <= 0) {
          throw new Error(`Invalid box appIndex at index ${index}: ${appIndex}. Must be a positive integer.`);
        }
        
        if (!name) {
          throw new Error(`Box name is required at index ${index}.`);
        }
        
        // Ensure name is Uint8Array
        let nameBytes;
        if (name instanceof Uint8Array) {
          nameBytes = name;
        } else if (typeof name === 'string') {
          // Try to decode as base64 first, then as hex, then as raw bytes
          try {
            nameBytes = Uint8Array.from(Buffer.from(name, 'base64'));
          } catch {
            try {
              nameBytes = Uint8Array.from(Buffer.from(name, 'hex'));
            } catch {
              nameBytes = new TextEncoder().encode(name);
            }
          }
        } else if (Buffer.isBuffer(name)) {
          nameBytes = new Uint8Array(name);
        } else {
          throw new Error(`Invalid box name type at index ${index}: ${typeof name}. Expected Uint8Array, string, or Buffer.`);
        }
        
        console.log(`[createAppCallTransaction] Box ${index} formatted:`, {
          appIndex: appIndex,
          nameLength: nameBytes.length,
          nameHex: Buffer.from(nameBytes).toString('hex').substring(0, 32) + '...'
        });
        
        return {
          appIndex: appIndex,
          name: nameBytes
        };
      });
      console.log(`[createAppCallTransaction] ✅ Successfully formatted ${formattedBoxes.length} box reference(s)`);
    } else {
      console.log(`[createAppCallTransaction] No box references provided`);
    }
    
    // ALWAYS use finalAppId (hardcoded correct ID) - never use this.appId
    console.log(`[createAppCallTransaction] Creating transaction with:`, {
      appIndex: finalAppId,
      appArgsCount: appArgs.length,
      accountsCount: formattedAccounts.length,
      foreignAppsCount: foreignApps.length,
      boxesCount: formattedBoxes.length,
      hasNote: !!note
    });
    
    const txn = algosdk.makeApplicationCallTxnFromObject({
      from: sender,
      appIndex: finalAppId, // Use hardcoded correct ID
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      suggestedParams,
      appArgs,
      accounts: formattedAccounts.length > 0 ? formattedAccounts : undefined,
      foreignApps: foreignApps.length > 0 ? foreignApps : undefined,
      boxes: formattedBoxes.length > 0 ? formattedBoxes : undefined,
      note: note ? new Uint8Array(new TextEncoder().encode(note)) : undefined
    });

    // Verify the transaction has the correct app index
    if (txn.appIndex !== finalAppId) {
      console.error(`[ContractUtils] CRITICAL: Transaction appIndex (${txn.appIndex}) does not match expected (${finalAppId})`);
      throw new Error(`Transaction appIndex mismatch: expected ${finalAppId}, got ${txn.appIndex}`);
    }
    
    // Verify boxes were included if they were provided
    // Note: The transaction object doesn't expose boxes directly, but we can verify by checking
    // if we passed boxes and the transaction was created successfully
    if (formattedBoxes.length > 0) {
      // Try to serialize the transaction to verify it's valid
      try {
        const txnBytes = txn.toByte();
        console.log(`[createAppCallTransaction] ✅ Transaction created successfully with ${formattedBoxes.length} box reference(s)`);
        console.log(`[createAppCallTransaction] Transaction size: ${txnBytes.length} bytes`);
      } catch (serializeError) {
        console.error(`[createAppCallTransaction] ❌ Failed to serialize transaction:`, serializeError);
        throw new Error(`Transaction creation failed: ${serializeError.message}`);
      }
    } else {
      console.log(`[createAppCallTransaction] ✅ Transaction created successfully (no box references)`);
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
  // New contract: Only requires amount and taskDescription (no deadline, no verifier)
  async createBounty(sender, amount, deadline, taskDescription, verifierAddress) {
    try {
      // New contract doesn't use deadline or verifier - ignore them but keep signature for compatibility
      console.log('Creating bounty (new contract - no deadline/verifier):', { sender, amount, taskDescription: taskDescription?.substring(0, 50) + '...' });
      
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Escrow amount must be greater than zero');
      }

      // Convert amount to microALGO
      const amountMicroAlgo = Math.round(amount * 1000000);

      // Reuse suggested params for the group to maintain identical fee/rounds
      const suggestedParams = await this.getSuggestedParams();

      // Use environment variable or default to new contract V2 address
      const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || this.appAddress || BOUNTY_ESCROW_ADDRESS;
      this.appAddress = contractAddress;
      
      console.log(`[createBounty] Using contract address for payment (FORCED): ${contractAddress}`);
      
      const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: sender,
        to: contractAddress, // V6 contract address
        amount: amountMicroAlgo,
        suggestedParams,
        note: new Uint8Array(new TextEncoder().encode('AlgoEase: Bounty Payment'))
      });
      
      // Verify payment transaction receiver (handle both string and Uint8Array formats)
      let paymentReceiver = paymentTxn.to;
      if (paymentReceiver instanceof Uint8Array) {
        paymentReceiver = algosdk.encodeAddress(paymentReceiver);
      } else if (typeof paymentReceiver !== 'string') {
        paymentReceiver = String(paymentReceiver);
      }
      
      // Log the payment receiver for debugging
      console.log(`[createBounty] Payment transaction receiver: ${paymentReceiver}`);
      console.log(`[createBounty] Expected contract address: ${contractAddress}`);
      
      // Verify addresses match (normalize for comparison)
      const normalizedReceiver = paymentReceiver.toUpperCase().trim();
      const normalizedContract = contractAddress.toUpperCase().trim();
      
      if (normalizedReceiver !== normalizedContract) {
        console.warn(`[createBounty] WARNING: Payment receiver (${paymentReceiver}) doesn't match contract address (${contractAddress})`);
        console.warn(`[createBounty] This may cause the transaction to fail.`);
      } else {
        console.log(`[createBounty] ✅ Payment transaction verified - sending to contract address: ${contractAddress}`);
      }

      // New contract: No accounts array needed (no verifier)
      const foreignAccounts = [];

      console.log('Creating bounty transaction with:', {
        sender,
        contractAddress,
        amountMicroAlgo,
        paymentAmount: paymentTxn.amount,
        taskDescriptionLength: taskDescription.length,
        note: 'New contract: no deadline, no verifier'
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
        // Use environment variable or default to new contract V2 ID
        const APP_ID = parseInt(process.env.REACT_APP_CONTRACT_APP_ID) || this.appId || BOUNTY_ESCROW_APP_ID;
        boxReferences = [{
          appIndex: APP_ID,
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
      
      // New contract: create_bounty expects [method, amount, task_desc] - no deadline
      // CRITICAL: Arguments must be properly encoded!
      // - amount: must be uint64-encoded bytes (algosdk.encodeUint64)
      // - taskDescription: must be bytes (Uint8Array from TextEncoder)
      const encodedAmount = algosdk.encodeUint64(amountMicroAlgo);
      const encodedTaskDesc = new TextEncoder().encode(taskDescription);
      
      console.log('[createBounty] Encoding arguments:', {
        amountMicroAlgo,
        amountEncoded: `Uint8Array(${encodedAmount.length} bytes)`,
        taskDescLength: taskDescription.length,
        taskDescEncoded: `Uint8Array(${encodedTaskDesc.length} bytes)`
      });
      
      const appCallTxn = await this.createAppCallTransaction(
        sender,
        CONTRACT_METHODS.CREATE_BOUNTY,
        [encodedAmount, encodedTaskDesc], // Properly encoded: uint64 bytes + text bytes
        foreignAccounts, // Empty - no verifier
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
      // CRITICAL: Both transactions MUST have the same group ID
      algosdk.assignGroupID([paymentTxn, appCallTxn]);

      // Verify group IDs match after assignment
      const paymentGroupId = paymentTxn.group ? Buffer.from(paymentTxn.group).toString('base64') : null;
      const appCallGroupId = appCallTxn.group ? Buffer.from(appCallTxn.group).toString('base64') : null;
      
      if (paymentGroupId !== appCallGroupId) {
        console.error('[createBounty] ❌ CRITICAL: Group IDs do not match after assignment!');
        console.error(`  Payment group ID: ${paymentGroupId}`);
        console.error(`  App call group ID: ${appCallGroupId}`);
        throw new Error('Failed to create transaction group: Group IDs do not match. This is a critical error - please try again.');
      }
      
      if (!paymentGroupId || !appCallGroupId) {
        console.error('[createBounty] ❌ CRITICAL: Transactions missing group IDs!');
        throw new Error('Failed to create transaction group: Transactions are missing group IDs. This is a critical error - please try again.');
      }
      
      console.log('[createBounty] ✅ Group IDs verified:', {
        paymentGroupId,
        appCallGroupId,
        match: paymentGroupId === appCallGroupId
      });

      // Return the transactions - they are already proper Transaction instances with matching group IDs
      return [paymentTxn, appCallTxn];
    } catch (error) {
      console.error('Failed to create bounty transaction:', error);
      throw error;
    }
  }

  // Helper function to create box reference
  createBoxReference(bountyId) {
    // Use environment variable or default to new contract V2 ID
    const APP_ID = parseInt(process.env.REACT_APP_CONTRACT_APP_ID) || this.appId || BOUNTY_ESCROW_APP_ID;
    
    // Box name format: "bounty_" + Itob(bounty_id)
    const prefix = new TextEncoder().encode('bounty_');
    const bountyIdBytes = algosdk.encodeUint64(bountyId);
    const boxNameBytes = new Uint8Array(prefix.length + bountyIdBytes.length);
    boxNameBytes.set(prefix, 0);
    boxNameBytes.set(bountyIdBytes, prefix.length);
    
    // Use contract ID
    return [{
      appIndex: APP_ID,
      name: boxNameBytes
    }];
  }

  // Accept bounty (requires bounty_id)
  async submitBounty(sender, bountyId) {
    try {
      // Use environment variable or default to new contract V2 ID
      const APP_ID = parseInt(process.env.REACT_APP_CONTRACT_APP_ID) || this.appId || BOUNTY_ESCROW_APP_ID;
      
      // Initialize contract
      this.initializeContract();
      // Set the contract ID
      this.appId = APP_ID;
      
      console.log(`[submitBounty] Using contract ID: ${APP_ID}`);
      
      // Convert bountyId to number if it's a string
      const numericBountyId = typeof bountyId === 'string' ? parseInt(bountyId, 10) : bountyId;
      if (isNaN(numericBountyId)) {
        throw new Error(`Invalid bounty ID: ${bountyId}`);
      }
      
      console.log(`[submitBounty] Submitting bounty ID: ${numericBountyId}`);
      
      // CRITICAL: Verify the bounty box exists before creating transaction
      // This prevents "invalid Box reference" errors
      // However, we'll allow the transaction to be created even if verification fails
      // (the contract will reject it if truly invalid, but at least the wallet will open)
      let bountyData = null;
      let boxVerificationWarning = null;
      
      try {
        console.log(`[submitBounty] Verifying bounty box exists for ID: ${numericBountyId}`);
        bountyData = await this.getBountyFromBox(numericBountyId);
        
        if (!bountyData) {
          // Try to get bounty count to see if ID is out of range
          const contractState = await this.getContractState();
          const bountyCount = contractState['bounty_count'] || contractState[GLOBAL_STATE_KEYS.BOUNTY_COUNT] || 0;
          
          if (numericBountyId >= bountyCount) {
            throw new Error(
              `Bounty ID ${numericBountyId} does not exist on-chain. The contract only has ${bountyCount} bounties (IDs 0-${bountyCount - 1}).\n\n` +
              `Please verify:\n` +
              `- The bounty ID is correct\n` +
              `- The bounty was successfully created on-chain\n` +
              `- You are using the correct contract ID: ${APP_ID}\n\n` +
              `The bounty may not have been deployed to the smart contract yet.`
            );
          } else {
            // Box exists but is empty or can't be read - this is likely due to broken code before fix
            const isOldBounty = numericBountyId < 10; // Bounties 0-9 were likely created before fix
            boxVerificationWarning = isOldBounty
              ? `⚠️ WARNING: This bounty (ID ${numericBountyId}) was created with broken code before the argument encoding fix.\n\n` +
                `The bounty box is empty and cannot be used. The transaction will likely fail on-chain.\n\n` +
                `SOLUTION: Create a NEW bounty - new bounties work correctly with the fixed code.`
              : `⚠️ WARNING: Bounty box not found or empty for ID ${numericBountyId}.\n\n` +
                `The transaction may fail on-chain. If this is a recently created bounty, wait a few seconds and try again.`;
            
            // Don't throw - allow transaction creation but log warning
            console.warn(`[submitBounty] ${boxVerificationWarning}`);
          }
        }
        
        // Verify the bounty status and freelancer if we have bounty data
        if (bountyData) {
          // Verify the bounty status is ACCEPTED (required for submission)
          if (bountyData.status !== BOUNTY_STATUS.ACCEPTED) {
            const statusNames = {
              0: 'OPEN',
              1: 'ACCEPTED',
              2: 'SUBMITTED',
              3: 'APPROVED',
              4: 'REJECTED'
            };
            const currentStatusName = statusNames[bountyData.status] || `UNKNOWN (${bountyData.status})`;
            
            throw new Error(
              `Cannot submit work: Bounty status must be ACCEPTED (1), but current status is ${currentStatusName} (${bountyData.status}).\n\n` +
              `Bounty workflow:\n` +
              `1. OPEN (0) - Bounty is created\n` +
              `2. ACCEPTED (1) - Freelancer accepts the bounty (REQUIRED before submission)\n` +
              `3. SUBMITTED (2) - Freelancer submits work\n` +
              `4. APPROVED (3) - Creator approves the work\n` +
              `5. REJECTED (4) - Creator rejects the work\n\n` +
              `Current status: ${currentStatusName} (${bountyData.status})\n` +
              `Required status: ACCEPTED (1)`
            );
          }
          
          // Verify the sender is the freelancer
          const freelancerAddress = bountyData.freelancerAddress;
          if (!freelancerAddress) {
            throw new Error(
              `Cannot submit work: Bounty has not been accepted yet.\n\n` +
              `The freelancer must accept the bounty before submitting work.`
            );
          }
          
          if (freelancerAddress.toUpperCase() !== sender.toUpperCase()) {
            throw new Error(
              `Only the freelancer who accepted this bounty can submit work.\n\n` +
              `Your address: ${sender}\n` +
              `Freelancer address: ${freelancerAddress}`
            );
          }
          
          console.log(`[submitBounty] ✅ Bounty box verified:`);
          console.log(`  - Bounty ID: ${numericBountyId}`);
          console.log(`  - Status: ACCEPTED (1)`);
          console.log(`  - Freelancer: ${freelancerAddress}`);
          console.log(`  - Sender: ${sender}`);
        } else {
          // No bounty data - log warning but allow transaction creation
          console.warn(`[submitBounty] ⚠️ Could not verify bounty box - proceeding with transaction creation`);
          console.warn(`[submitBounty] ⚠️ The contract will validate the transaction on-chain`);
          if (boxVerificationWarning) {
            console.warn(`[submitBounty] ${boxVerificationWarning}`);
          }
        }
      } catch (boxError) {
        // If it's our custom error (empty/incomplete box), log warning but allow transaction
        if (boxError.isEmptyBox || boxError.isIncompleteBox) {
          boxVerificationWarning = `⚠️ WARNING: Bounty box is empty or incomplete for ID ${numericBountyId}.\n\n` +
            `This bounty was created with broken code before the argument encoding fix.\n\n` +
            `The transaction will likely fail on-chain. SOLUTION: Create a NEW bounty - new bounties work correctly.`;
          console.warn(`[submitBounty] ${boxVerificationWarning}`);
          // Don't throw - allow transaction creation so wallet can open
        }
        // If it's a validation error (status, freelancer mismatch), we should still throw
        else if (boxError.message && (
          boxError.message.includes('Cannot submit work') ||
          boxError.message.includes('Only the freelancer') ||
          boxError.message.includes('does not exist') ||
          boxError.message.includes('Bounty ID') && boxError.message.includes('does not exist')
        )) {
          throw boxError;
        }
        // Other errors - log warning but allow transaction creation
        else {
          console.warn(`[submitBounty] ⚠️ Error verifying bounty box:`, boxError.message);
          boxVerificationWarning = `⚠️ WARNING: Could not verify bounty box: ${boxError.message}\n\n` +
            `The transaction will be created, but it may fail on-chain if the bounty is invalid.\n\n` +
            `Please ensure:\n` +
            `1. The bounty was successfully created on-chain\n` +
            `2. The bounty ID is correct\n` +
            `3. The bounty has been accepted\n` +
            `4. Try refreshing the page and waiting a few seconds before trying again`;
          console.warn(`[submitBounty] ${boxVerificationWarning}`);
          // Don't throw - allow transaction creation
        }
      }
      
      // Get box name for this bounty
      const boxName = this.getBoxName(numericBountyId);
      const boxReferences = [{
        appIndex: APP_ID,
        name: boxName
      }];
      
      console.log(`[submitBounty] Creating transaction with box reference:`, {
        appIndex: APP_ID,
        boxNameLength: boxName.length,
        boxNameHex: Buffer.from(boxName).toString('hex').substring(0, 32) + '...',
        boxNameBase64: Buffer.from(boxName).toString('base64')
      });
      
      // Verify box references are valid before creating transaction
      if (!boxReferences || boxReferences.length === 0) {
        throw new Error('Box references are required for submit_bounty transaction');
      }
      
      if (!boxReferences[0].appIndex || !boxReferences[0].name) {
        throw new Error('Box reference must have appIndex and name');
      }
      
      console.log(`[submitBounty] Box reference validated:`, {
        appIndex: boxReferences[0].appIndex,
        nameLength: boxReferences[0].name.length,
        nameType: typeof boxReferences[0].name
      });
      
      // Create app call transaction
      const appCallTxn = await this.createAppCallTransaction(
        sender,
        'submit_bounty',
        [algosdk.encodeUint64(numericBountyId)],
        [], // No accounts needed for submit
        'AlgoEase: Submit Bounty',
        boxReferences
      );
      
      // Verify transaction has correct app index
      if (appCallTxn.appIndex !== APP_ID) {
        console.error(`[submitBounty] CRITICAL: Transaction has wrong appIndex ${appCallTxn.appIndex}! Expected ${APP_ID}`);
        throw new Error(`Transaction appIndex mismatch: expected ${APP_ID}, got ${appCallTxn.appIndex}`);
      }
      
      // Note: The transaction object doesn't expose appBoxes property directly
      // We verify boxes were passed to createAppCallTransaction above
      // The transaction will be validated on-chain
      console.log(`[submitBounty] Transaction created successfully`);
      console.log(`[submitBounty] Box references passed: ${boxReferences.length} box(es)`);
      
      // Attach warning to transaction object if we have one
      if (boxVerificationWarning) {
        appCallTxn._warning = boxVerificationWarning;
      }
      
      return appCallTxn;
    } catch (error) {
      console.error(`[submitBounty] Error:`, error);
      throw error;
    }
  }

  async acceptBounty(sender, bountyId) {
    try {
      if (!bountyId) {
        throw new Error('Bounty ID is required for acceptance');
      }
      
      // Ensure contract is initialized
      this.initializeContract();
      
      console.log(`[acceptBounty] Using contract ID: ${this.appId}`);
      
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
      
      // Final verification - check transaction app index
      if (appCallTxn.appIndex !== this.appId) {
        console.error(`[acceptBounty] CRITICAL: Transaction has wrong appIndex ${appCallTxn.appIndex}! Expected ${this.appId}`);
        throw new Error(`Transaction appIndex is ${appCallTxn.appIndex}, but must be ${this.appId}`);
      }

      return appCallTxn;
    } catch (error) {
      console.error('Failed to create accept bounty transaction:', error);
      throw error;
    }
  }

  // Approve bounty (creator only, requires bounty_id)
  // Note: Contract automatically transfers funds to freelancer on approval
  async approveBounty(sender, bountyId, freelancerAddressFromDB = null) {
    try {
      // Use environment variable or default to new contract V2 ID
      const APP_ID = parseInt(process.env.REACT_APP_CONTRACT_APP_ID) || this.appId || BOUNTY_ESCROW_APP_ID;
      
      if (!bountyId && bountyId !== 0) {
        throw new Error('Bounty ID is required for approval');
      }
      
      // Initialize contract
      this.initializeContract();
      // Set the contract ID
      this.appId = APP_ID;
      
      // Convert to number if it's a string
      const numericBountyId = typeof bountyId === 'string' ? parseInt(bountyId) : bountyId;
      if (isNaN(numericBountyId)) {
        throw new Error(`Invalid bounty ID: ${bountyId}. Must be a number.`);
      }
      
      console.log(`[approveBounty] Using contract ID: ${APP_ID}`);
      console.log(`[approveBounty] Bounty ID: ${numericBountyId} (type: ${typeof numericBountyId})`);
      
      // CRITICAL: Verify the bounty box exists and status is SUBMITTED before creating transaction
      // This prevents "assert failed" errors on-chain
      let freelancerAddress = null;
      let bountyData = null;
      let boxReadFailed = false;
      const zeroAddress = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ';
      
      try {
        console.log(`[approveBounty] Attempting to read bounty box for ID: ${numericBountyId}`);
        bountyData = await this.getBountyFromBox(numericBountyId);
        console.log(`[approveBounty] Bounty data from box:`, JSON.stringify(bountyData, null, 2));
        
        if (bountyData) {
          // Check if freelancer address exists and is not zero
          if (bountyData.freelancerAddress && bountyData.freelancerAddress !== zeroAddress) {
            freelancerAddress = bountyData.freelancerAddress;
            console.log(`[approveBounty] ✅ Found freelancer address from box: ${freelancerAddress}`);
          } else {
            // Freelancer is zero or missing - bounty not accepted on-chain
            const statusText = bountyData.status === 0 ? 'OPEN' : 
                              bountyData.status === 1 ? 'ACCEPTED' : 
                              `STATUS_${bountyData.status}`;
            throw new Error(
              `Bounty has not been accepted on-chain yet.\n\n` +
              `The bounty box shows:\n` +
              `- Status: ${statusText} (${bountyData.status})\n` +
              `- Freelancer address: ${bountyData.freelancerAddress || 'ZERO (not set)'}\n\n` +
              `The freelancer must accept the bounty on-chain before it can be approved.\n\n` +
              `Please ensure:\n` +
              `1. The freelancer has called the accept_bounty function on the smart contract\n` +
              `2. The accept transaction was successfully submitted and confirmed\n` +
              `3. Wait a few seconds for the indexer to update, then try again`
            );
          }
        } else {
          boxReadFailed = true;
          console.warn(`[approveBounty] ⚠️ getBountyFromBox returned null - box may not exist or be accessible`);
          
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
                `- You are using the correct contract ID: ${this.appId}`
              );
            } else {
              // Box exists but can't be read - use database fallback if available
              console.warn(`[approveBounty] Box exists but can't be read - will use database fallback if available`);
              if (freelancerAddressFromDB && freelancerAddressFromDB !== zeroAddress) {
                freelancerAddress = freelancerAddressFromDB;
                console.log(`[approveBounty] ✅ Using freelancer address from database: ${freelancerAddress}`);
              } else {
                // No database fallback - this is a problem
                throw new Error(
                  `Bounty box exists but cannot be read from blockchain.\n\n` +
                  `Bounty ID: ${numericBountyId}\n` +
                  `Contract ID: ${this.appId}\n\n` +
                  `This may be due to:\n` +
                  `- Indexer delay (wait a few seconds and try again)\n` +
                  `- Network connectivity issues\n` +
                  `- The box may be corrupted\n\n` +
                  `Please try refreshing the page and trying again.`
                );
              }
            }
          } catch (stateError) {
            console.error(`[approveBounty] Could not verify bounty count:`, stateError);
            // If we can't verify, try using database fallback
            if (freelancerAddressFromDB && freelancerAddressFromDB !== zeroAddress) {
              freelancerAddress = freelancerAddressFromDB;
              console.log(`[approveBounty] ✅ Using freelancer address from database (fallback): ${freelancerAddress}`);
            } else {
              throw new Error(
                `Cannot verify bounty state and no database fallback available.\n\n` +
                `Error: ${stateError.message}\n\n` +
                `Please ensure the bounty exists on-chain and try again.`
              );
            }
          }
        }
      } catch (boxError) {
        // If it's our custom error (empty/incomplete box), re-throw it with better message
        if (boxError.isEmptyBox || boxError.isIncompleteBox) {
          throw new Error(
            `⚠️ CRITICAL: Bounty box is empty or incomplete for ID ${numericBountyId}.\n\n` +
            `This bounty was created with broken code before the argument encoding fix.\n\n` +
            `ROOT CAUSE:\n` +
            `- The bounty box exists but is empty (0 bytes) or incomplete (< 73 bytes)\n` +
            `- This happened because arguments were not properly encoded during creation\n` +
            `- Without proper encoding, the contract couldn't parse the arguments\n\n` +
            `SOLUTION:\n` +
            `1. This bounty CANNOT be fixed or used\n` +
            `2. You MUST create a NEW bounty\n` +
            `3. New bounties created with the fixed code will work correctly\n\n` +
            `NOTE: All bounties created after the fix have properly populated boxes and will work correctly.`
          );
        }
        
        // If it's our custom error, re-throw it
        if (boxError.message?.includes('has not been accepted on-chain')) {
          throw boxError;
        }
        
        boxReadFailed = true;
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
            
            if (numericBountyId >= bountyCount) {
              throw new Error(
                `Bounty ID ${numericBountyId} does not exist. The contract only has ${bountyCount} bounties (IDs 0-${bountyCount - 1}).`
              );
            } else {
              // Box not found but bounty ID is valid - try database fallback
              if (freelancerAddressFromDB && freelancerAddressFromDB !== zeroAddress) {
                freelancerAddress = freelancerAddressFromDB;
                console.log(`[approveBounty] ✅ Using freelancer address from database (box not found): ${freelancerAddress}`);
                console.log(`[approveBounty] ⚠️ Proceeding with approval - contract will validate`);
              } else {
                throw new Error(
                  `Bounty box not found on blockchain.\n\n` +
                  `Bounty ID: ${numericBountyId} (valid, contract has ${bountyCount} bounties)\n` +
                  `Contract ID: ${this.appId}\n\n` +
                  `The bounty may not have been created on-chain, or the box was not created properly.\n\n` +
                  `Please verify the bounty was successfully created and try again.`
                );
              }
            }
          } catch (stateError) {
            console.error(`[approveBounty] Error verifying bounty count:`, stateError);
            // Try using database fallback
            if (freelancerAddressFromDB && freelancerAddressFromDB !== zeroAddress) {
              freelancerAddress = freelancerAddressFromDB;
              console.log(`[approveBounty] ✅ Using freelancer address from database (fallback after state error): ${freelancerAddress}`);
              console.log(`[approveBounty] ⚠️ Proceeding with approval - contract will validate`);
            } else {
              const stateErrorMessage = stateError.message || String(stateError);
              throw new Error(
                `Cannot verify bounty on blockchain.\n\n` +
                `Box read error: ${boxError.message}\n` +
                `State verification error: ${stateErrorMessage}\n\n` +
                `This may be due to:\n` +
                `- Network connectivity issues\n` +
                `- Algod client not accessible\n` +
                `- Indexer delay\n\n` +
                `Please check:\n` +
                `- Your internet connection\n` +
                `- Contract ID: ${this.appId}\n` +
                `- Bounty ID: ${numericBountyId}\n\n` +
                `Try refreshing the page and waiting a few seconds before trying again.`
              );
            }
          }
        } else {
          // Other errors - try database fallback before throwing
          if (freelancerAddressFromDB && freelancerAddressFromDB !== zeroAddress) {
            freelancerAddress = freelancerAddressFromDB;
            console.log(`[approveBounty] ✅ Using freelancer address from database (fallback for other error): ${freelancerAddress}`);
            console.log(`[approveBounty] ⚠️ Proceeding with approval - contract will validate`);
          } else {
            // Re-throw other errors if no fallback
            throw boxError;
          }
        }
      }
      
      // At this point, we should have a valid freelancer address (from box or database)
      // Final validation - ensure it's not zero and is a valid address
      if (!freelancerAddress || freelancerAddress === zeroAddress || !algosdk.isValidAddress(freelancerAddress)) {
        throw new Error(
          `Invalid freelancer address.\n\n` +
          `The bounty must be accepted on-chain before it can be approved.\n` +
          `Please ensure the freelancer has successfully accepted the bounty.`
        );
      }
      
      // CRITICAL: Verify bounty status is SUBMITTED (2) before approval
      // The contract will reject if status is not SUBMITTED with "assert failed" error
      // Try to read the box to check status, but if we can't read it, proceed anyway
      // The contract will validate on-chain and reject if status is incorrect
      if (!bountyData) {
        // If we still don't have bounty data, try one more time to read it
        try {
          console.log(`[approveBounty] Attempting final box read to verify status...`);
          bountyData = await this.getBountyFromBox(numericBountyId);
        } catch (finalReadError) {
          console.warn(`[approveBounty] ⚠️ Final box read failed:`, finalReadError);
          console.warn(`[approveBounty] ⚠️ Proceeding with transaction creation - contract will validate status on-chain`);
          console.warn(`[approveBounty] ⚠️ If status is not SUBMITTED (2), the contract will reject the transaction`);
          // Don't throw - allow transaction to proceed, contract will validate
          bountyData = null;
        }
      }
      
      // If we have bountyData, validate status
      if (bountyData) {
        const currentStatus = bountyData.status;
        console.log(`[approveBounty] Current bounty status from box: ${currentStatus}`);
        
        // Status values: 0=OPEN, 1=ACCEPTED, 2=SUBMITTED, 3=APPROVED, 4=CLAIMED, 5=REJECTED, 6=REFUNDED
        if (currentStatus !== BOUNTY_STATUS.SUBMITTED) {
          const statusNames = {
            0: 'OPEN',
            1: 'ACCEPTED',
            2: 'SUBMITTED',
            3: 'APPROVED',
            4: 'CLAIMED',
            5: 'REJECTED',
            6: 'REFUNDED'
          };
          const currentStatusName = statusNames[currentStatus] || `UNKNOWN (${currentStatus})`;
          
          throw new Error(
            `Cannot approve bounty: Status must be SUBMITTED (2), but current status is ${currentStatusName} (${currentStatus}).\n\n` +
            `Bounty workflow:\n` +
            `1. OPEN (0) - Bounty is created\n` +
            `2. ACCEPTED (1) - Freelancer accepts the bounty\n` +
            `3. SUBMITTED (2) - Freelancer submits work (REQUIRED before approval)\n` +
            `4. APPROVED (3) - Creator approves the work\n` +
            `5. CLAIMED (4) - Freelancer claims payment\n\n` +
            `The freelancer must submit their work before you can approve it.\n\n` +
            `Current status: ${currentStatusName} (${currentStatus})\n` +
            `Required status: SUBMITTED (2)\n\n` +
            `Please ensure the freelancer has submitted their work before attempting to approve.`
          );
        }
        
        console.log(`[approveBounty] ✅ Status verified: SUBMITTED (2)`);
      } else {
        console.warn(`[approveBounty] ⚠️ Could not verify status from box - proceeding with transaction`);
        console.warn(`[approveBounty] ⚠️ Contract will validate status on-chain`);
      }
      
      // New contract: Only creator (client) can approve (no verifier)
      // If we have bountyData, verify authorization
      if (bountyData) {
        const clientAddress = bountyData.clientAddress;
        const senderNormalized = sender.toUpperCase().trim();
        const isClient = clientAddress && clientAddress.toUpperCase().trim() === senderNormalized;
        
        if (!isClient) {
          throw new Error(
            `Only the creator (client) can approve this bounty.\n\n` +
            `Your address: ${sender}\n` +
            `Creator address: ${clientAddress || 'N/A'}\n\n` +
            `Please ensure you are using the correct wallet address.`
          );
        }
        
        console.log(`[approveBounty] ✅ Authorization verified:`);
        console.log(`  - Sender: ${sender}`);
        console.log(`  - Is creator: ${isClient}`);
        console.log(`  - Creator: ${clientAddress}`);
      } else {
        console.warn(`[approveBounty] ⚠️ Could not verify authorization from box - contract will validate on-chain`);
        console.warn(`[approveBounty] ⚠️ Sender: ${sender}`);
      }
      
      // Contract: approve_bounty changes status to APPROVED AND transfers funds to freelancer
      // The contract creates an inner transaction to the freelancer, so the freelancer address
      // MUST be in the accounts array for the inner transaction to work
      // CRITICAL: For inner transactions, the receiver must be in the accounts array
      const accounts = freelancerAddress ? [freelancerAddress] : [];
      console.log(`[approveBounty] Accounts array for transaction:`, accounts);
      console.log(`[approveBounty] Freelancer address: ${freelancerAddress}`);
      console.log(`[approveBounty] Note: approve_bounty creates inner transaction to freelancer - address must be in accounts array`);
      
      // Create box reference for the bounty box
      const boxReferences = [{
        appIndex: APP_ID,
        name: this.getBoxName(numericBountyId)
      }];
      
      // CRITICAL: If we don't have freelancer address, we can't create the transaction
      // The contract requires the freelancer address for the inner transaction
      if (!freelancerAddress || freelancerAddress === zeroAddress) {
        throw new Error(
          `Cannot approve bounty: Freelancer address is required for the inner transaction.\n\n` +
          `The contract needs to transfer funds to the freelancer, but the freelancer address could not be determined.\n\n` +
          `Please ensure:\n` +
          `1. The bounty has been accepted by a freelancer\n` +
          `2. The bounty box exists and is readable\n` +
          `3. Try refreshing the page and waiting a few seconds before trying again`
        );
      }
      
      console.log(`[approveBounty] Creating transaction with:`);
      console.log(`  - Sender: ${sender}`);
      console.log(`  - Bounty ID: ${numericBountyId}`);
      console.log(`  - Freelancer (in accounts): ${freelancerAddress}`);
      console.log(`  - App ID: ${APP_ID}`);
      
      // Get suggested params and increase fee to cover inner transaction
      const suggestedParams = await this.getSuggestedParams();
      // Inner transactions require the outer transaction to pay for both fees
      // Base fee is typically 1000 microAlgos, so we need at least 2000 for 1 inner transaction
      const baseFee = suggestedParams.fee || 1000;
      const minFeeForInnerTxn = Math.max(2000, baseFee * 2); // At least 2000, or 2x base fee
      
      console.log(`[approveBounty] Setting fee to ${minFeeForInnerTxn} microAlgos (base: ${baseFee}, covering outer + inner transaction)`);
      
      const appCallTxn = await this.createAppCallTransaction(
        sender,
        CONTRACT_METHODS.APPROVE_BOUNTY,
        [algosdk.encodeUint64(numericBountyId)],
        accounts, // MUST include freelancer address for inner transaction
        'AlgoEase: Approve Bounty',
        boxReferences,
        minFeeForInnerTxn // Explicitly set higher fee to cover inner transaction
      );
      
      // Final verification - check transaction app index
      if (appCallTxn.appIndex !== APP_ID) {
        console.error(`[approveBounty] CRITICAL: Transaction has wrong appIndex ${appCallTxn.appIndex}! Expected ${APP_ID}`);
        throw new Error(`Transaction appIndex mismatch: expected ${APP_ID}, got ${appCallTxn.appIndex}`);
      }
      
      // Verify the transaction was created successfully
      console.log(`[approveBounty] Transaction created successfully`);
      console.log(`[approveBounty] Transaction appIndex: ${appCallTxn.appIndex}`);
      console.log(`[approveBounty] Transaction appArgs length: ${appCallTxn.appArgs?.length || 0}`);
      
      // CRITICAL: Verify accounts array is included (required for inner transaction)
      if (!appCallTxn.appAccounts || appCallTxn.appAccounts.length === 0) {
        console.error(`[approveBounty] CRITICAL: Transaction does not have accounts array!`);
        throw new Error('Transaction missing accounts array with freelancer address. The contract needs the freelancer address for the inner transaction.');
      }
      
      console.log(`[approveBounty] ✅ Transaction created successfully with accounts:`, appCallTxn.appAccounts);
      console.log(`[approveBounty] Box references passed: ${boxReferences.length} box(es)`);

      return appCallTxn;
    } catch (error) {
      console.error('Failed to create approve bounty transaction:', error);
      throw error;
    }
  }

  // Reject bounty (verifier only, uses refund function but tracks as rejected)
  // clientAddressFromDB: Optional client address from database (fallback if box read fails)
  async rejectBounty(sender, bountyId, clientAddressFromDB = null) {
    try {
      if (!bountyId) {
        throw new Error('Bounty ID is required for rejection');
      }
      
      // Ensure contract is initialized
      this.initializeContract();
      
      if (!this.appId || this.appId === 0) {
        throw new Error('Contract App ID not set. Please set REACT_APP_CONTRACT_APP_ID in your environment.');
      }
      
      // Get client address from bounty box for refund
      // The contract needs the client address in accounts array for inner transaction
      // Try to get from box first, but allow fallback to database if box read fails
      let clientAddress = null;
      try {
        const bountyData = await this.getBountyFromBox(bountyId);
        console.log(`[rejectBounty] Bounty data from box:`, bountyData);
        if (bountyData && bountyData.clientAddress) {
          clientAddress = bountyData.clientAddress;
          console.log(`[rejectBounty] Found client address from box: ${clientAddress}`);
        } else {
          console.warn(`[rejectBounty] Could not get client address from box.`);
        }
      } catch (boxError) {
        console.warn(`[rejectBounty] Could not read bounty box (will try database fallback):`, boxError.message);
        // Don't throw - we'll try to get from database or require it as parameter
      }
      
      // If we couldn't get from box, use database address as fallback
      if (!clientAddress && clientAddressFromDB) {
        clientAddress = clientAddressFromDB;
        console.log(`[rejectBounty] Using client address from database: ${clientAddress}`);
      }
      
      // If still no client address, throw error
      if (!clientAddress) {
        console.error(`[rejectBounty] Client address not found in box or database.`);
        throw new Error('Failed to retrieve client address from bounty data. The bounty box may not exist or be readable.');
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
      
      console.log(`[rejectBounty] Creating transaction with:`);
      console.log(`  - Sender: ${sender}`);
      console.log(`  - Bounty ID: ${bountyId}`);
      console.log(`  - Client (in accounts): ${clientAddress}`);
      console.log(`  - App ID: ${this.appId}`);
      
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
      if (appCallTxn.appIndex !== this.appId) {
        console.error(`[rejectBounty] CRITICAL: Transaction has wrong appIndex ${appCallTxn.appIndex}! Expected ${this.appId}`);
        throw new Error(`Transaction appIndex is ${appCallTxn.appIndex}, but must be ${this.appId}`);
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
  // freelancerAddressFromDB: Optional freelancer address from database (fallback if box read fails)
  async claimBounty(sender, bountyId, freelancerAddressFromDB = null) {
    try {
      if (!bountyId) {
        throw new Error('Bounty ID is required for claiming');
      }
      
      // Ensure contract is initialized
      this.initializeContract();
      
      if (!this.appId || this.appId === 0) {
        throw new Error('Contract App ID not set. Please set REACT_APP_CONTRACT_APP_ID in your environment.');
      }
      
      // CRITICAL: Get freelancer address from bounty box
      // The contract needs the freelancer address in the accounts array for the inner transaction
      // Try to get from box first, but allow fallback to database if box read fails
      let freelancerAddress = null;
      const zeroAddress = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ';
      
      // Convert bountyId to number if it's a string (needed for box read)
      const numericBountyIdForBox = typeof bountyId === 'string' ? parseInt(bountyId, 10) : bountyId;
      
      try {
        const bountyData = await this.getBountyFromBox(numericBountyIdForBox);
        console.log(`[claimBounty] Bounty data from box:`, bountyData);
        if (bountyData && bountyData.freelancerAddress && bountyData.freelancerAddress !== zeroAddress) {
          freelancerAddress = bountyData.freelancerAddress;
          console.log(`[claimBounty] Found freelancer address from box: ${freelancerAddress}`);
        } else {
          console.warn(`[claimBounty] Could not get freelancer address from box.`);
        }
      } catch (boxError) {
        console.warn(`[claimBounty] Could not read bounty box (will try database fallback):`, boxError.message);
        // Don't throw - we'll try to get from database or require it as parameter
      }
      
      // If we couldn't get from box, use database fallback
      if (!freelancerAddress && freelancerAddressFromDB && freelancerAddressFromDB !== zeroAddress) {
        freelancerAddress = freelancerAddressFromDB;
        console.log(`[claimBounty] Using freelancer address from database: ${freelancerAddress}`);
      }
      
      // If still no freelancer address, throw error
      if (!freelancerAddress || freelancerAddress === zeroAddress) {
        console.error(`[claimBounty] Freelancer address not found in box or database.`);
        throw new Error('Failed to retrieve freelancer address from bounty data. The bounty box may not exist or be readable.');
      }
      
      // CRITICAL: Validate freelancer address
      if (!freelancerAddress || !algosdk.isValidAddress(freelancerAddress)) {
        throw new Error('Invalid or missing freelancer address.');
      }
      
      // V6 Contract: claim_bounty creates an inner transaction to the freelancer
      // The freelancer address is read from the box, but for inner transactions,
      // the receiver must be in the accounts array
      // However, the contract checks Txn.sender() == freelancer, so the sender must be the freelancer
      const accounts = [freelancerAddress]; // Include for inner transaction receiver
      console.log(`[claimBounty] Accounts array for transaction:`, accounts);
      console.log(`[claimBounty] Transaction sender (must match freelancer):`, sender);
      
      // Convert bountyId to number if it's a string
      const numericBountyId = typeof bountyId === 'string' ? parseInt(bountyId, 10) : bountyId;
      if (isNaN(numericBountyId)) {
        throw new Error(`Invalid bounty ID: ${bountyId}`);
      }
      
      // Create box reference for the bounty box
      const boxReferences = this.createBoxReference(numericBountyId);
      
      console.log(`[claimBounty] Creating transaction with:`);
      console.log(`  - Sender: ${sender}`);
      console.log(`  - Bounty ID: ${numericBountyId}`);
      console.log(`  - Freelancer (in accounts): ${freelancerAddress}`);
      console.log(`  - App ID: ${this.appId}`);
      
      // V6 contract uses "claim_bounty" as method name
      // Get suggested params and increase fee to cover inner transaction
      const suggestedParams = await this.getSuggestedParams();
      // Inner transactions require the outer transaction to pay for both fees
      // Base fee is typically 1000 microAlgos, so we need at least 2000 for 1 inner transaction
      // For safety, use at least 2000 microAlgos (2 * minimum fee)
      const baseFee = suggestedParams.fee || 1000;
      const minFeeForInnerTxn = Math.max(2000, baseFee * 2); // At least 2000, or 2x base fee
      
      console.log(`[claimBounty] Setting fee to ${minFeeForInnerTxn} microAlgos (base: ${baseFee}, covering outer + inner transaction)`);
      
      const appCallTxn = await this.createAppCallTransaction(
        sender,
        CONTRACT_METHODS.CLAIM_BOUNTY, // V6 contract method name: "claim_bounty"
        [algosdk.encodeUint64(numericBountyId)],
        accounts, // Include freelancer address for inner transaction (payment to freelancer)
        'AlgoEase: Claim Bounty',
        boxReferences,
        minFeeForInnerTxn // Explicitly set higher fee to cover inner transaction
      );
      
      // Final verification - check transaction app index
      if (appCallTxn.appIndex !== this.appId) {
        console.error(`[claimBounty] CRITICAL: Transaction has wrong appIndex ${appCallTxn.appIndex}! Expected ${this.appId}`);
        throw new Error(`Transaction appIndex is ${appCallTxn.appIndex}, but must be ${this.appId}`);
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
      
      // Ensure contract is initialized
      this.initializeContract();
      
      if (!this.appId || this.appId === 0) {
        throw new Error('Contract App ID not set. Please set REACT_APP_CONTRACT_APP_ID in your environment.');
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
      
      console.log(`[refundBounty] Creating transaction with:`);
      console.log(`  - Sender: ${sender}`);
      console.log(`  - Bounty ID: ${bountyId}`);
      console.log(`  - Client (in accounts): ${clientAddress}`);
      console.log(`  - App ID: ${this.appId}`);

      // V6 contract requires bounty_id as argument: [method, bounty_id]
      const appCallTxn = await this.createAppCallTransaction(
        sender,
        CONTRACT_METHODS.REFUND_BOUNTY,
        [algosdk.encodeUint64(bountyId)], // Pass bounty_id as argument
        accounts, // Include client address for inner transaction
        'AlgoEase: Refund Bounty',
        boxReferences
      );
      
      // Final verification - check transaction app index
      if (appCallTxn.appIndex !== this.appId) {
        console.error(`[refundBounty] CRITICAL: Transaction has wrong appIndex ${appCallTxn.appIndex}! Expected ${this.appId}`);
        throw new Error(`Transaction appIndex is ${appCallTxn.appIndex}, but must be ${this.appId}`);
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
    // Use environment variable or default to new contract V2
    const APP_ID = parseInt(process.env.REACT_APP_CONTRACT_APP_ID) || this.appId || BOUNTY_ESCROW_APP_ID;
    const APP_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || this.appAddress || BOUNTY_ESCROW_ADDRESS;
    
    this.initializeContract();
    // Set the contract ID and address
    this.appId = APP_ID;
    this.appAddress = APP_ADDRESS;
    
    try {
      console.log(`[getContractAddress] Returning contract address: ${APP_ADDRESS}`);
      return APP_ADDRESS;
    } catch (error) {
      console.error('Failed to calculate contract address, using default:', error);
      // Fallback to default address
      this.appAddress = APP_ADDRESS;
      this.appId = APP_ID;
      return APP_ADDRESS;
    }
  }

  // Get contract state
  async getContractState() {
    // Use environment variable or default to new contract V2 ID
    const APP_ID = parseInt(process.env.REACT_APP_CONTRACT_APP_ID) || this.appId || BOUNTY_ESCROW_APP_ID;
    
    // Initialize contract
    this.initializeContract();
    // Set the contract ID
    this.appId = APP_ID;

    if (!this.algodClient) {
      throw new Error('Algod client not initialized. Please check your network connection.');
    }

    try {
      console.log(`[getContractState] Fetching state for app ID: ${APP_ID}`);
      const appInfo = await this.algodClient.getApplicationByID(APP_ID).do();
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

      console.log(`[getContractState] Successfully retrieved state:`, parsedState);
      return parsedState;
    } catch (error) {
      console.error('[getContractState] Failed to get contract state:', error);
      const errorMessage = error.message || String(error);
      const errorStatus = error.status || error.statusCode || 'unknown';
      
      // Provide more helpful error messages
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        throw new Error(
          `Network error while fetching contract state: ${errorMessage}\n\n` +
          `Please check your internet connection and try again.`
        );
      } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        throw new Error(
          `Contract not found. App ID ${APP_ID} does not exist on the blockchain.\n\n` +
          `Please verify the contract ID is correct: ${APP_ID} (Bounty Escrow V2)`
        );
      } else {
        throw new Error(
          `Failed to get contract state: ${errorMessage}\n\n` +
          `Status: ${errorStatus}\n` +
          `App ID: ${APP_ID}\n\n` +
          `Please check your network connection and try again.`
        );
      }
    }
  }

  // Get bounty_id from contract after creation (bounty_count - 1)
  async getBountyIdAfterCreation(txId = null) {
    try {
      // If we have a transaction ID, try to get bounty ID from transaction first
      if (txId) {
        try {
          console.log(`[getBountyIdAfterCreation] Attempting to get bounty ID from transaction: ${txId}`);
          const txInfo = await this.indexerClient.lookupTransactionByID(txId).do();
          
          // Check if transaction has app call and look for state changes
          if (txInfo.transaction && txInfo.transaction['application-transaction']) {
            // Get the app call transaction
            const appCall = txInfo.transaction['application-transaction'];
            
            // Check global state changes - bounty_count should have increased
            if (txInfo['global-state-delta']) {
              for (const delta of txInfo['global-state-delta']) {
                const key = Buffer.from(delta.key, 'base64').toString('utf8');
                if (key === 'bounty_count' && delta.value) {
                  const newCount = delta.value.uint || 0;
                  if (newCount > 0) {
                    const bountyId = newCount - 1; // New bounty ID is count - 1
                    console.log(`✅ Got bounty ID ${bountyId} from transaction state delta (count: ${newCount})`);
                    return bountyId;
                  }
                }
              }
            }
          }
        } catch (txError) {
          console.warn(`[getBountyIdAfterCreation] Could not get bounty ID from transaction:`, txError.message);
          // Continue to fallback method
        }
      }
      
      // Fallback: Get from contract state
      console.log('[getBountyIdAfterCreation] Getting bounty ID from contract state...');
      const state = await this.getContractState();
      console.log('📊 Full contract state:', state);
      // V6 contract uses 'bounty_count' as the key
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
  
  // Get bounty ID with retry logic
  async getBountyIdAfterCreationWithRetry(txId = null, maxRetries = 5, retryDelay = 2000) {
    for (let retry = 0; retry < maxRetries; retry++) {
      try {
        if (retry > 0) {
          console.log(`⏳ Retry ${retry}/${maxRetries - 1}: Waiting ${retryDelay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
        
        const bountyId = await this.getBountyIdAfterCreation(txId);
        
        if (bountyId !== null && bountyId !== undefined) {
          // Verify the bounty exists in the box
          try {
            const boxBounty = await this.getBountyFromBox(bountyId);
            if (boxBounty && boxBounty.clientAddress) {
              console.log(`✅ Verified bounty ${bountyId} exists in box`);
              return bountyId;
            } else {
              console.warn(`⚠️ Bounty ${bountyId} not found in box yet, will retry...`);
              if (retry === maxRetries - 1) {
                // Last retry, return the ID anyway
                console.warn(`⚠️ Using bounty ID ${bountyId} despite box verification failure (final retry)`);
                return bountyId;
              }
            }
          } catch (boxError) {
            console.warn(`⚠️ Could not verify bounty ${bountyId} in box:`, boxError.message);
            if (retry === maxRetries - 1) {
              // Last retry, return the ID anyway
              console.warn(`⚠️ Using bounty ID ${bountyId} despite box verification failure (final retry)`);
              return bountyId;
            }
          }
        } else {
          console.warn(`⚠️ Bounty ID is null (attempt ${retry + 1}/${maxRetries})`);
        }
      } catch (error) {
        console.error(`❌ Failed to get bounty ID (attempt ${retry + 1}/${maxRetries}):`, error.message);
        if (retry === maxRetries - 1) {
          throw error;
        }
      }
    }
    
    return null;
  }

  // Get bounty from box storage by bounty_id with retry logic for indexer delays
  async getBountyFromBox(bountyId, retries = 3, delayMs = 2000) {
    // Use environment variable or default to new contract V2 ID
    const APP_ID = parseInt(process.env.REACT_APP_CONTRACT_APP_ID) || this.appId || BOUNTY_ESCROW_APP_ID;
    
    // Declare variables outside try block so they're accessible in catch
    let boxNameBytes = null;
    let boxNameBase64 = null;
    let appIdToUse = APP_ID; // Declare outside try block
    
    // Helper function to attempt box read
    const attemptBoxRead = async (attemptNumber) => {
      try {
        // Initialize contract
        this.initializeContract();
        // Set the contract ID
        this.appId = APP_ID;
        appIdToUse = APP_ID;

        console.log(`[getBountyFromBox] Reading box for bounty ID: ${bountyId}, app ID: ${appIdToUse}, attempt ${attemptNumber}/${retries}`);

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
          console.log(`[getBountyFromBox] Attempting to read box from indexer (attempt ${attemptNumber})...`);
          console.log(`[getBountyFromBox] App ID: ${appIdToUse}, Box name (base64): ${boxNameBase64}`);
          
          const boxValue = await this.indexerClient.lookupApplicationBoxByIDandName(
            appIdToUse,
            boxNameBase64
          ).do();
        
          console.log(`[getBountyFromBox] Indexer response:`, boxValue);
          
          // Check if box exists but value is null/undefined/empty
          if (!boxValue || !boxValue.value || boxValue.value === '') {
            console.warn(`[getBountyFromBox] Box value is null or empty (attempt ${attemptNumber})`);
            
            // Check if box name exists but has no value - this means the box was created but is empty
            // This happens when bounties were created with broken code before the fix
            if (boxValue && boxValue.name) {
              console.error(`[getBountyFromBox] Box exists but has empty value (0 bytes). This bounty was likely created with broken code before the argument encoding fix.`);
              console.error(`[getBountyFromBox] Bounty ID ${bountyId} cannot be used because its box is empty and cannot be fixed.`);
              console.error(`[getBountyFromBox] SOLUTION: Create a NEW bounty - new bounties will work correctly with the fixed code.`);
              // Throw a special error for empty boxes - don't retry
              const emptyBoxError = new Error(`Bounty box is empty for ID ${bountyId}. This bounty was created with broken code before the argument encoding fix. The box cannot be fixed - create a new bounty instead.`);
              emptyBoxError.isEmptyBox = true;
              throw emptyBoxError;
            }
            
            // If box doesn't exist and we have retries left, wait and retry (indexer delay)
            if (attemptNumber < retries) {
              console.log(`[getBountyFromBox] Box not found in indexer (attempt ${attemptNumber}). Waiting ${delayMs}ms before retry (indexer may be delayed)...`);
              await new Promise(resolve => setTimeout(resolve, delayMs));
              return null; // Signal retry needed
            }
            
            // Last attempt - try to list all boxes to see what exists
            try {
              console.log(`[getBountyFromBox] Final attempt: Listing all boxes for app ${appIdToUse}...`);
              const boxesResponse = await this.indexerClient.searchForApplicationBoxes(appIdToUse).do();
              const totalBoxes = boxesResponse.boxes?.length || 0;
              console.log(`[getBountyFromBox] Total boxes found: ${totalBoxes}`);
              if (boxesResponse.boxes && boxesResponse.boxes.length > 0) {
                // Check if our box exists in the list
                const ourBox = boxesResponse.boxes.find(b => {
                  const nameBytes = Buffer.from(b.name, 'base64');
                  return Buffer.from(nameBytes).equals(Buffer.from(boxNameBytes));
                });
                
                if (ourBox) {
                  const hasValue = ourBox.value && ourBox.value !== '';
                  const valueLength = hasValue ? Buffer.from(ourBox.value, 'base64').length : 0;
                  console.log(`[getBountyFromBox] Box found in list: hasValue=${hasValue}, valueLength=${valueLength} bytes`);
                  
                  if (!hasValue || valueLength === 0) {
                    console.error(`[getBountyFromBox] Box exists but is empty (${valueLength} bytes). Bounty was likely created with broken code.`);
                    return null;
                  }
                }
                
                console.log(`[getBountyFromBox] Box not found in list. Box may not be indexed yet or doesn't exist.`);
              } else {
                console.warn(`[getBountyFromBox] No boxes found for app ${appIdToUse}! This suggests the bounty was not created properly on-chain.`);
              }
            } catch (listError) {
              console.warn(`[getBountyFromBox] Could not list boxes:`, listError);
            }
            
            return null; // Box not found or empty
          }
        
          // boxValue.value is base64 encoded
          const boxData = Buffer.from(boxValue.value, 'base64');
          console.log(`[getBountyFromBox] Box data length: ${boxData.length} bytes (attempt ${attemptNumber})`);

          // Parse box data
          // New contract format: client_addr(32) + freelancer_addr(32) + 
          //                      amount(8) + status(1) + task_desc(variable)
          const data = new Uint8Array(boxData);
          
          if (data.length < 73) {
            console.error(`[getBountyFromBox] Box data too short: ${data.length} bytes (expected at least 73)`);
            console.error(`[getBountyFromBox] This bounty was likely created with broken code before the argument encoding fix.`);
            console.error(`[getBountyFromBox] Bounty ID ${bountyId} cannot be used because its box is incomplete.`);
            console.error(`[getBountyFromBox] SOLUTION: Create a NEW bounty - new bounties will work correctly with the fixed code.`);
            // Throw a special error for incomplete boxes - don't retry
            const incompleteBoxError = new Error(`Bounty box is incomplete for ID ${bountyId} (${data.length} bytes, expected at least 73). This bounty was created with broken code before the argument encoding fix. The box cannot be fixed - create a new bounty instead.`);
            incompleteBoxError.isIncompleteBox = true;
            throw incompleteBoxError;
          }
          
          const clientAddr = algosdk.encodeAddress(data.slice(0, 32));
          const freelancerBytes = data.slice(32, 64);
          // Check if freelancer is zero address (all zeros)
          const isZeroAddress = freelancerBytes.every(byte => byte === 0);
          const freelancerAddr = isZeroAddress ? null : algosdk.encodeAddress(freelancerBytes);
          const amountMicro = algosdk.decodeUint64(new Uint8Array(data.slice(64, 72)));
          const status = data[72];
          const taskDesc = new TextDecoder().decode(data.slice(73));

          const result = {
            bountyId,
            clientAddress: clientAddr,
            freelancerAddress: freelancerAddr,
            verifierAddress: null, // New contract doesn't have verifier - creator only
            amount: amountMicro / 1000000,
            deadline: null, // New contract doesn't have deadline
            status,
            taskDescription: taskDesc
          };
          
          console.log(`[getBountyFromBox] ✅ Successfully parsed box data (attempt ${attemptNumber}):`, {
            bountyId: result.bountyId,
            clientAddress: result.clientAddress,
            freelancerAddress: result.freelancerAddress,
            verifierAddress: result.verifierAddress,
            amount: result.amount,
            status: result.status
          });

          return result; // Success!
        } catch (indexerError) {
          // Check if it's a 404 (box not found) - might be indexer delay, retry if we have attempts left
          const isNotFound = indexerError.status === 404 || 
                            indexerError.statusCode === 404 || 
                            indexerError.message?.includes('404') ||
                            indexerError.message?.includes('box not found');
          
          if (isNotFound && attemptNumber < retries) {
            console.log(`[getBountyFromBox] Box not found in indexer (404) on attempt ${attemptNumber}. Waiting ${delayMs}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            return null; // Signal retry needed
          }
          
          // Fallback to algod if indexer fails (or final attempt)
          console.warn(`[getBountyFromBox] Indexer box read failed (attempt ${attemptNumber}), trying algod:`, indexerError.message);
          
          try {
            console.log(`[getBountyFromBox] Attempting to read box from algod...`);
            const boxValue = await this.algodClient.getApplicationBoxByName(
              appIdToUse,
              boxNameBase64
            ).do();
            
            console.log(`[getBountyFromBox] Algod response received`);
            
            if (!boxValue || !boxValue.value) {
              console.warn(`[getBountyFromBox] Algod box value is null or empty`);
              if (attemptNumber < retries) {
                console.log(`[getBountyFromBox] Waiting ${delayMs}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
                return null; // Signal retry needed
              }
              return null;
            }
            
            const boxData = Buffer.from(boxValue.value, 'base64');
            const data = new Uint8Array(boxData);
            
            if (data.length < 73) {
              console.error(`[getBountyFromBox] Algod box data too short: ${data.length} bytes (expected at least 73)`);
              // Throw a special error for incomplete boxes - don't retry
              const incompleteBoxError = new Error(`Bounty box is incomplete for ID ${bountyId} (${data.length} bytes, expected at least 73). This bounty was created with broken code before the argument encoding fix. The box cannot be fixed - create a new bounty instead.`);
              incompleteBoxError.isIncompleteBox = true;
              throw incompleteBoxError;
            }
            
            const clientAddr = algosdk.encodeAddress(data.slice(0, 32));
            const freelancerBytes = data.slice(32, 64);
            const isZeroAddress = freelancerBytes.every(byte => byte === 0);
            const freelancerAddr = isZeroAddress ? null : algosdk.encodeAddress(freelancerBytes);
            const amountMicro = algosdk.decodeUint64(new Uint8Array(data.slice(64, 72)));
            const status = data[72];
            const taskDesc = new TextDecoder().decode(data.slice(73));

            const result = {
              bountyId,
              clientAddress: clientAddr,
              freelancerAddress: freelancerAddr,
              verifierAddress: null, // New contract doesn't have verifier
              amount: amountMicro / 1000000,
              deadline: null, // New contract doesn't have deadline
              status,
              taskDescription: taskDesc
            };
            
            console.log(`[getBountyFromBox] ✅ Successfully parsed box data from algod:`, {
              bountyId: result.bountyId,
              status: result.status
            });

            return result;
          } catch (algodError) {
            // If algod also fails with 404 and we have retries left, retry
            const algodIsNotFound = algodError.status === 404 || 
                                   algodError.statusCode === 404 || 
                                   algodError.message?.includes('404') ||
                                   algodError.message?.includes('box not found');
            
            if (algodIsNotFound && attemptNumber < retries) {
              console.log(`[getBountyFromBox] Box not found in algod (404) on attempt ${attemptNumber}. Waiting ${delayMs}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, delayMs));
              return null; // Signal retry needed
            }
            
            console.error(`[getBountyFromBox] Algod box read also failed:`, algodError.message);
            throw algodError;
          }
        }
      } catch (error) {
        // If this is not a "not found" error, or we're out of retries, throw it
        const isNotFound = error.status === 404 || 
                          error.statusCode === 404 || 
                          error.message?.includes('404') ||
                          error.message?.includes('box not found');
        
        if (isNotFound && attemptNumber < retries) {
          // Retry will be handled in outer loop
          throw error;
        }
        
        // Other errors or final attempt - throw
        throw error;
      }
    };
    
    // Retry loop
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await attemptBoxRead(attempt);
        if (result !== null && typeof result === 'object') {
          // Success! Return the result
          return result;
        }
        // Result is null - might need retry if we have attempts left (box not found, indexer delay)
        if (attempt < retries && result === null) {
          // Wait before next attempt (indexer delay)
          console.log(`[getBountyFromBox] Box not found (attempt ${attempt}/${retries}). Waiting ${delayMs}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
        // Final attempt and result is null - box doesn't exist
        console.log(`[getBountyFromBox] Box not found after ${retries} attempts`);
        return null;
      } catch (error) {
        // Don't retry for empty/incomplete boxes (these are permanent issues)
        if (error.isEmptyBox || error.isIncompleteBox) {
          console.error(`[getBountyFromBox] Box is empty/incomplete - not retrying:`, error.message);
          throw error;
        }
        
        const isNotFound = error.status === 404 || 
                          error.statusCode === 404 || 
                          error.message?.includes('404') ||
                          error.message?.includes('box not found');
        
        if (isNotFound && attempt < retries) {
          // Wait before retry
          console.log(`[getBountyFromBox] Box not found (attempt ${attempt}/${retries}). Waiting ${delayMs}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
        
        // Last attempt or non-404 error
        if (attempt === retries) {
          console.error('[getBountyFromBox] Failed to get bounty from box after all retries:', error);
          console.error('[getBountyFromBox] Error details:', {
            message: error.message,
            status: error.status,
            statusCode: error.statusCode,
            response: error.response
          });
          
          // If box doesn't exist (404), return null instead of throwing
          if (isNotFound) {
            console.log(`[getBountyFromBox] Box does not exist for bounty ID: ${bountyId} after ${retries} attempts`);
            console.log(`[getBountyFromBox] Contract ID: ${APP_ID}`);
            
            // Try to list all boxes to see what exists
            try {
              const boxesResponse = await this.indexerClient.searchForApplicationBoxes(APP_ID).do();
              const totalBoxes = boxesResponse.boxes?.length || 0;
              console.log(`[getBountyFromBox] Contract has ${totalBoxes} boxes (bounty_count may be ${bountyId + 1})`);
            } catch (listError) {
              // Ignore list errors
            }
            
            return null;
          }
        }
        
        // Re-throw non-404 errors or if we're out of retries
        throw error;
      }
    }
    
    // Should never reach here, but return null if we do
    console.warn(`[getBountyFromBox] Exhausted all retries without success`);
    return null;
  }

  /**
   * List all bounty boxes that exist on-chain
   * @returns {Promise<Array>} Array of bounty objects from boxes
   */
  async listAllBountyBoxes() {
    try {
      // Use environment variable or default to new contract V2 ID
      const APP_ID = parseInt(process.env.REACT_APP_CONTRACT_APP_ID) || this.appId || BOUNTY_ESCROW_APP_ID;
      this.initializeContract();
      this.appId = APP_ID;
      
      console.log(`[listAllBountyBoxes] Listing all boxes for app ${APP_ID}...`);
      
      let boxes = [];
      
      // Try indexer first
      try {
        const boxesResponse = await this.indexerClient.searchForApplicationBoxes(APP_ID).do();
        boxes = boxesResponse.boxes || [];
        console.log(`[listAllBountyBoxes] Indexer found ${boxes.length} boxes`);
      } catch (indexerError) {
        console.warn(`[listAllBountyBoxes] Indexer failed, trying algod:`, indexerError);
      }
      
      // If indexer returned 0 boxes but contract has bounties, try direct box reads
      // This handles cases where boxes exist but indexer hasn't indexed them yet
      if (boxes.length === 0) {
        try {
          const contractState = await this.getContractState();
          const bountyCount = contractState['bounty_count'] || contractState[GLOBAL_STATE_KEYS.BOUNTY_COUNT] || 0;
          console.log(`[listAllBountyBoxes] Indexer found 0 boxes, but contract reports ${bountyCount} bounties. Trying direct box reads...`);
          
          if (bountyCount > 0) {
            // Try to read each box individually by ID
            for (let i = 0; i < bountyCount; i++) {
              try {
                const boxBounty = await this.getBountyFromBox(i);
                if (boxBounty) {
                  // Create a box-like object for consistency
                  // Box name format: "bounty_" + Itob(bounty_id)
                  const prefix = new TextEncoder().encode('bounty_');
                  const bountyIdBytes = algosdk.encodeUint64(i);
                  const boxNameBytes = new Uint8Array(prefix.length + bountyIdBytes.length);
                  boxNameBytes.set(prefix, 0);
                  boxNameBytes.set(bountyIdBytes, prefix.length);
                  
                  boxes.push({
                    name: Buffer.from(boxNameBytes).toString('base64'),
                    value: null, // We already have the parsed data
                    parsed: boxBounty
                  });
                  console.log(`[listAllBountyBoxes] Successfully read box ${i} directly from algod`);
                }
              } catch (boxError) {
                // Box doesn't exist - this is expected if bounty_count was incremented but box creation failed
                console.log(`[listAllBountyBoxes] Box ${i} does not exist (may indicate failed bounty creation):`, boxError.message);
                continue;
              }
            }
            console.log(`[listAllBountyBoxes] Direct box reads found ${boxes.length} boxes out of ${bountyCount} reported bounties`);
          }
        } catch (algodError) {
          console.error(`[listAllBountyBoxes] Direct box read fallback failed:`, algodError);
        }
      }
      
      const bountyBoxes = [];
      
      for (const box of boxes) {
        try {
          // If we have parsed data from algod fallback, use it directly
          if (box.parsed) {
            bountyBoxes.push(box.parsed);
            continue;
          }
          
          const nameBytes = Buffer.from(box.name, 'base64');
          
          // Check if this is a bounty box (starts with "bounty_")
          if (nameBytes.length >= 15 && nameBytes.slice(0, 7).toString() === 'bounty_') {
            // Extract bounty ID
            const bountyIdBytes = new Uint8Array(nameBytes.slice(7, 15));
            const bountyId = algosdk.decodeUint64(bountyIdBytes);
            
            // Parse box data
            const boxData = Buffer.from(box.value, 'base64');
            const data = new Uint8Array(boxData);
            
            if (data.length >= 73) {
              const clientAddr = algosdk.encodeAddress(data.slice(0, 32));
              const freelancerBytes = data.slice(32, 64);
              const isZeroAddress = freelancerBytes.every(byte => byte === 0);
              const freelancerAddr = isZeroAddress ? null : algosdk.encodeAddress(freelancerBytes);
              const amountMicro = algosdk.decodeUint64(new Uint8Array(data.slice(64, 72)));
              const status = data[72];
              const taskDesc = new TextDecoder().decode(data.slice(73));
              
              bountyBoxes.push({
                bountyId,
                clientAddress: clientAddr,
                freelancerAddress: freelancerAddr,
                verifierAddress: null, // New contract doesn't have verifier
                amount: amountMicro / 1000000,
                deadline: null, // New contract doesn't have deadline
                status,
                taskDescription: taskDesc
              });
            }
          }
        } catch (parseError) {
          console.warn(`[listAllBountyBoxes] Could not parse box:`, parseError);
          continue;
        }
      }
      
      console.log(`[listAllBountyBoxes] Successfully parsed ${bountyBoxes.length} bounty boxes`);
      return bountyBoxes;
    } catch (error) {
      console.error('[listAllBountyBoxes] Failed to list boxes:', error);
      return [];
    }
  }

  // Get current bounty information from global state (V3 contract)
  async getCurrentBounty() {
    try {
      const state = await this.getContractState();
      
      // Check if there's an active bounty (amount > 0 and status not CLAIMED/REFUNDED)
      const amount = state[GLOBAL_STATE_KEYS.AMOUNT] || 0;
      const status = state[GLOBAL_STATE_KEYS.STATUS] !== undefined ? state[GLOBAL_STATE_KEYS.STATUS] : null;
      
      // V2 contract: Check if status is final (APPROVED or REJECTED)
      if (amount === 0 || status === BOUNTY_STATUS.APPROVED || status === BOUNTY_STATUS.REJECTED) {
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
      
      case 'submit':
        return bountyInfo.status === BOUNTY_STATUS.ACCEPTED && 
               userAddress === bountyInfo.freelancerAddress;
      
      case 'approve':
        return bountyInfo.status === BOUNTY_STATUS.SUBMITTED && 
               userAddress === bountyInfo.clientAddress; // Only creator can approve
      
      case 'reject':
        return (bountyInfo.status === BOUNTY_STATUS.SUBMITTED || 
                bountyInfo.status === BOUNTY_STATUS.ACCEPTED) &&
               userAddress === bountyInfo.clientAddress; // Only creator can reject
      
      case 'claim':
        // V2 contract: No claim needed - funds transfer automatically on approve
        return false;
      
      case 'refund':
        // V2 contract: No manual refund - use reject instead
        return false;
      
      case 'auto_refund':
        // New contract doesn't have deadline - auto_refund not applicable
        return false;
      
      default:
        return false;
    }
  }

  // Get status name from status code
  getStatusName(statusCode) {
    switch (statusCode) {
      case BOUNTY_STATUS.OPEN: return 'open';
      case BOUNTY_STATUS.ACCEPTED: return 'accepted';
      case BOUNTY_STATUS.SUBMITTED: return 'submitted';
      case BOUNTY_STATUS.APPROVED: return 'approved';
      case BOUNTY_STATUS.REJECTED: return 'rejected';
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
      if (!Array.isArray(signedTxns) || signedTxns.length === 0) {
        throw new Error('submitTransactionGroup requires a non-empty array of signed transactions');
      }

      console.log(`[submitTransactionGroup] Submitting group of ${signedTxns.length} transactions...`);

      // CRITICAL: Verify all transactions have the same group ID before submission
      // This prevents "incomplete group" errors
      const normalizedTxns = signedTxns.map((txn, idx) => {
        try {
          const normalized = normalizeSignedPayload(txn);
          
          // Decode the transaction to verify group ID
          let decodedTxn;
          try {
            decodedTxn = algosdk.decodeSignedTransaction(normalized);
          } catch (decodeError) {
            console.warn(`[submitTransactionGroup] Could not decode transaction ${idx} for verification:`, decodeError);
            // Continue anyway - will fail during submission if there's an issue
            return normalized;
          }

          // Check if transaction has a group ID
          if (decodedTxn && decodedTxn.txn && decodedTxn.txn.group) {
            const groupId = Buffer.from(decodedTxn.txn.group).toString('base64');
            console.log(`[submitTransactionGroup] Transaction ${idx} group ID: ${groupId}`);
          } else {
            console.warn(`[submitTransactionGroup] Transaction ${idx} has no group ID`);
          }

          return normalized;
        } catch (normError) {
          console.error(`[submitTransactionGroup] Failed to normalize transaction ${idx}:`, normError);
          throw new Error(`Failed to normalize transaction ${idx}: ${normError.message}`);
        }
      });

      // Verify all transactions have the same group ID (if they have group IDs)
      const groupIds = normalizedTxns.map((txn, idx) => {
        try {
          const decoded = algosdk.decodeSignedTransaction(txn);
          return decoded.txn.group ? Buffer.from(decoded.txn.group).toString('base64') : null;
        } catch (e) {
          console.warn(`[submitTransactionGroup] Could not decode transaction ${idx} for group ID check:`, e);
          return null;
        }
      }).filter(id => id !== null);

      if (groupIds.length > 0) {
        const uniqueGroupIds = [...new Set(groupIds)];
        if (uniqueGroupIds.length > 1) {
          const errorMsg = `CRITICAL: Transactions have mismatched group IDs!\n\n` +
            `Group IDs found: ${uniqueGroupIds.join(', ')}\n\n` +
            `All transactions in a group must have the same group ID.\n\n` +
            `This usually means:\n` +
            `1. Transactions were not properly grouped before signing\n` +
            `2. Group ID was lost during signing/normalization\n` +
            `3. Transactions from different groups are being submitted together\n\n` +
            `Please recreate the transaction group and try again.`;
          console.error(`[submitTransactionGroup] ${errorMsg}`);
          throw new Error(errorMsg);
        } else {
          console.log(`[submitTransactionGroup] ✅ All transactions have matching group ID: ${uniqueGroupIds[0]}`);
        }
      } else {
        console.warn(`[submitTransactionGroup] ⚠️ Could not verify group IDs (transactions may not be grouped)`);
      }

      // Combine all transaction bytes into a single Uint8Array for atomic submission
      // Algorand requires grouped transactions to be submitted together
      let totalLength = 0;
      for (const txn of normalizedTxns) {
        totalLength += txn.length;
      }

      const combinedPayload = new Uint8Array(totalLength);
      let offset = 0;
      for (const txn of normalizedTxns) {
        combinedPayload.set(txn, offset);
        offset += txn.length;
      }

      console.log(`[submitTransactionGroup] Submitting ${normalizedTxns.length} transactions as atomic group (${totalLength} bytes total)...`);
      const response = await this.algodClient.sendRawTransaction(combinedPayload).do();
      
      // Extract the transaction ID from the response
      const txId = response.txId || response;
      console.log(`[submitTransactionGroup] ✅ Transaction group submitted successfully. TxID: ${txId}`);
      
      return txId;
    } catch (error) {
      console.error('[submitTransactionGroup] ❌ Failed to submit transaction group:', error);
      
      // Provide more helpful error message for incomplete group errors
      if (error.message && (
        error.message.includes('incomplete group') ||
        error.message.includes('TransactionPool.Remember') ||
        error.message.includes('transactionGroup')
      )) {
        throw new Error(
          `Transaction group is incomplete or has mismatched group IDs.\n\n` +
          `Error: ${error.message}\n\n` +
          `This usually happens when:\n` +
          `1. Transactions don't have matching group IDs\n` +
          `2. Transactions are being submitted separately instead of as a group\n` +
          `3. Group ID was lost during signing\n\n` +
          `Please try creating the bounty again. If the issue persists, refresh the page and reconnect your wallet.`
        );
      }
      
      throw error;
    }
  }
}

// Create and export singleton instance
const contractUtils = new ContractUtils();
export default contractUtils;

