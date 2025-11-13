// Contract configuration
export const CONTRACT_CONFIG = {
  // Contract App ID (set after deployment)
  APP_ID: parseInt(process.env.REACT_APP_CONTRACT_APP_ID) || 749570296,
  
  // Algorand network configuration
  NETWORK: {
    ALGOD_URL: process.env.REACT_APP_ALGOD_URL || 'https://testnet-api.algonode.cloud',
    INDEXER_URL: process.env.REACT_APP_INDEXER_URL || 'https://testnet-idx.algonode.cloud',
    EXPLORER_URL: 'https://testnet.algoexplorer.io'
  },

  // Contract deployment configuration
  DEPLOYMENT: {
    CREATOR_MNEMONIC: process.env.REACT_APP_CREATOR_MNEMONIC || '',
    APPROVAL_PROGRAM_PATH: '../contracts/algoease_approval.teal',
    CLEAR_PROGRAM_PATH: '../contracts/algoease_clear.teal'
  },

  // Contract state keys
  STATE_KEYS: {
    BOUNTY_COUNT: 'bounty_count',
    CLIENT_ADDR: 'client_addr',
    FREELANCER_ADDR: 'freelancer_addr',
    AMOUNT: 'amount',
    DEADLINE: 'deadline',
    STATUS: 'status',
    TASK_DESCRIPTION: 'task_desc',
    VERIFIER_ADDR: 'verifier_addr'
  },

  // Status constants
  STATUS: {
    OPEN: 0,
    ACCEPTED: 1,
    APPROVED: 2,
    CLAIMED: 3,
    REFUNDED: 4,
    REJECTED: 5
  },

  // Method names
  METHODS: {
    CREATE_BOUNTY: 'create_bounty',
    ACCEPT_BOUNTY: 'accept_bounty',
    APPROVE_BOUNTY: 'approve_bounty',
    REJECT_BOUNTY: 'reject_bounty',
    CLAIM_BOUNTY: 'claim',
    REFUND_BOUNTY: 'refund',
    AUTO_REFUND: 'auto_refund',
    GET_BOUNTY: 'get_bounty'
  }
};

// Helper functions
export const getStatusName = (statusCode) => {
  switch (statusCode) {
    case CONTRACT_CONFIG.STATUS.OPEN: return 'open';
    case CONTRACT_CONFIG.STATUS.ACCEPTED: return 'accepted';
    case CONTRACT_CONFIG.STATUS.APPROVED: return 'approved';
    case CONTRACT_CONFIG.STATUS.CLAIMED: return 'claimed';
    case CONTRACT_CONFIG.STATUS.REFUNDED: return 'refunded';
    case CONTRACT_CONFIG.STATUS.REJECTED: return 'rejected';
    default: return 'unknown';
  }
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'open': return 'bg-green-100 text-green-800';
    case 'accepted': return 'bg-blue-100 text-blue-800';
    case 'approved': return 'bg-purple-100 text-purple-800';
    case 'claimed': return 'bg-gray-100 text-gray-800';
    case 'refunded': return 'bg-red-100 text-red-800';
    case 'rejected': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatAmount = (amount) => {
  return `${amount} ALGO`;
};

export default CONTRACT_CONFIG;
