// Wallet Helper Utilities for AlgoEase

/**
 * Check if Pera Wallet has any pending transactions
 * This is a workaround for the 4100 error (transaction request pending)
 */
export const checkPendingTransactions = () => {
  // Pera Wallet stores pending requests in localStorage
  try {
    const peraWalletData = localStorage.getItem('PeraWallet.Wallet');
    if (peraWalletData) {
      const data = JSON.parse(peraWalletData);
      console.log('Pera Wallet data:', data);
      return data;
    }
  } catch (error) {
    console.log('Could not check Pera Wallet data:', error);
  }
  return null;
};

/**
 * Wait for a specified amount of time
 * Useful to ensure wallet has cleared previous transaction state
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry a function with exponential backoff
 */
export const retryWithBackoff = async (fn, maxRetries = 3, initialDelay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if user cancelled
      if (error.message && 
          (error.message.includes('cancelled') || 
           error.message.includes('rejected') ||
           error.message.includes('User Rejected'))) {
        throw error;
      }
      
      // For pending transaction errors, wait longer
      if (error.code === 4100 || (error.message && error.message.includes('4100'))) {
        const waitTime = initialDelay * Math.pow(2, i);
        console.log(`Transaction pending. Waiting ${waitTime}ms before retry ${i + 1}/${maxRetries}...`);
        await delay(waitTime);
      } else if (i < maxRetries - 1) {
        // For other errors, use standard backoff
        const waitTime = initialDelay * Math.pow(2, i);
        console.log(`Retrying in ${waitTime}ms... (${i + 1}/${maxRetries})`);
        await delay(waitTime);
      }
    }
  }
  
  throw lastError;
};

/**
 * Format error messages for better user experience
 */
export const formatWalletError = (error) => {
  if (!error) return 'An unknown error occurred';
  
  const message = error.message || String(error);
  
  // Map common error codes/messages to user-friendly text
  if (error.code === 4100 || message.includes('4100')) {
    return 'Another transaction is pending. Please complete or cancel it in your Pera Wallet app first.';
  }
  
  if (message.includes('User Rejected Request') || message.includes('cancelled')) {
    return 'Transaction was cancelled by user.';
  }
  
  if (message.includes('insufficient')) {
    return 'Insufficient balance. Please ensure you have enough ALGO for the transaction and fees.';
  }
  
  if (message.includes('network') || message.includes('timeout')) {
    return 'Network error. Please check your connection and try again.';
  }
  
  if (message.includes('Invalid address')) {
    return 'Invalid Algorand address provided.';
  }
  
  // Return original message if no match
  return message;
};

/**
 * Validate Algorand address format
 */
export const isValidAlgorandAddress = (address) => {
  if (!address || typeof address !== 'string') return false;
  
  // Algorand addresses are 58 characters long and contain only uppercase letters and numbers
  const algorandAddressRegex = /^[A-Z2-7]{58}$/;
  return algorandAddressRegex.test(address);
};

/**
 * Format address for display (truncate middle)
 */
export const formatAddress = (address, prefixLength = 6, suffixLength = 4) => {
  if (!address || address.length < prefixLength + suffixLength) {
    return address || 'Unknown';
  }
  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
};

/**
 * Convert ALGO to microALGO
 */
export const algoToMicroAlgo = (algo) => {
  return Math.round(parseFloat(algo) * 1000000);
};

/**
 * Convert microALGO to ALGO
 */
export const microAlgoToAlgo = (microAlgo) => {
  return parseFloat(microAlgo) / 1000000;
};

/**
 * Check if wallet is properly connected
 */
export const isWalletConnected = (account) => {
  return !!(account && isValidAlgorandAddress(account));
};

export default {
  checkPendingTransactions,
  delay,
  retryWithBackoff,
  formatWalletError,
  isValidAlgorandAddress,
  formatAddress,
  algoToMicroAlgo,
  microAlgoToAlgo,
  isWalletConnected,
};
