/**
 * Wallet Error Handler Utilities
 * Helps diagnose and resolve common Pera Wallet transaction errors
 */

export const WalletErrorTypes = {
  PENDING_TRANSACTION: 'PENDING_TRANSACTION',
  USER_REJECTED: 'USER_REJECTED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  UNAVAILABLE_ACCOUNT: 'UNAVAILABLE_ACCOUNT',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN: 'UNKNOWN'
};

export const identifyWalletError = (error) => {
  const errorMessage = error?.message?.toLowerCase() || error?.toString()?.toLowerCase() || '';
  
  console.log('🔍 Identifying wallet error:', {
    message: error?.message,
    type: error?.type,
    code: error?.code,
    toString: error?.toString()
  });

  // Check for pending transaction error
  if (errorMessage.includes('pending') && errorMessage.includes('pera wallet')) {
    return {
      type: WalletErrorTypes.PENDING_TRANSACTION,
      title: 'Transaction Already Pending',
      message: 'Another transaction is pending in Pera Wallet. Please complete or cancel it first.',
      canRetry: true,
      instructions: [
        'Open your Pera Wallet mobile app or browser extension',
        'Check for any pending transaction requests',
        'Either approve or cancel the pending transaction',
        'Wait a few seconds, then try again'
      ]
    };
  }

  // Check for user rejection
  if (errorMessage.includes('reject') || errorMessage.includes('cancel') || errorMessage.includes('denied')) {
    return {
      type: WalletErrorTypes.USER_REJECTED,
      title: 'Transaction Cancelled',
      message: 'You cancelled the transaction in your wallet.',
      canRetry: true,
      instructions: [
        'Click "Try Again" to create a new transaction',
        'Make sure to approve it in your Pera Wallet when prompted'
      ]
    };
  }

  // Check for unavailable account error
  if (errorMessage.includes('unavailable account')) {
    return {
      type: WalletErrorTypes.UNAVAILABLE_ACCOUNT,
      title: 'Account Not Available',
      message: 'The smart contract cannot access a required account. This is likely a configuration issue.',
      canRetry: false,
      instructions: [
        'This error has been reported to the developers',
        'Please contact support if this persists',
        'Try refreshing the page and reconnecting your wallet'
      ]
    };
  }

  // Check for insufficient funds
  if (errorMessage.includes('insufficient') || errorMessage.includes('balance') || errorMessage.includes('overspend')) {
    return {
      type: WalletErrorTypes.INSUFFICIENT_FUNDS,
      title: 'Insufficient Funds',
      message: 'Your account does not have enough ALGO to complete this transaction.',
      canRetry: false,
      instructions: [
        'Add more ALGO to your wallet',
        'Remember to keep at least 0.1 ALGO for transaction fees',
        'Try again after adding funds'
      ]
    };
  }

  // Check for network errors
  if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('fetch')) {
    return {
      type: WalletErrorTypes.NETWORK_ERROR,
      title: 'Network Error',
      message: 'Could not connect to the Algorand network.',
      canRetry: true,
      instructions: [
        'Check your internet connection',
        'Make sure Pera Wallet is connected',
        'Try again in a few moments'
      ]
    };
  }

  // Check for timeout
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return {
      type: WalletErrorTypes.TIMEOUT,
      title: 'Transaction Timeout',
      message: 'The transaction took too long to process.',
      canRetry: true,
      instructions: [
        'Make sure your Pera Wallet app is open and unlocked',
        'Check your internet connection',
        'Try creating the transaction again'
      ]
    };
  }

  // Unknown error
  return {
    type: WalletErrorTypes.UNKNOWN,
    title: 'Transaction Failed',
    message: error?.message || 'An unexpected error occurred.',
    canRetry: true,
    instructions: [
      'Try disconnecting and reconnecting your wallet',
      'Refresh the page and try again',
      'If the problem persists, contact support'
    ]
  };
};

/**
 * Creates a user-friendly error message with resolution steps
 */
export const formatWalletError = (error) => {
  const errorInfo = identifyWalletError(error);
  
  let message = `${errorInfo.title}\n\n${errorInfo.message}`;
  
  if (errorInfo.instructions && errorInfo.instructions.length > 0) {
    message += '\n\nHow to fix this:\n';
    errorInfo.instructions.forEach((instruction, index) => {
      message += `${index + 1}. ${instruction}\n`;
    });
  }
  
  return {
    ...errorInfo,
    formattedMessage: message
  };
};

/**
 * Checks if the error indicates a pending transaction that can be cleared
 */
export const canClearPendingTransaction = (error) => {
  const errorInfo = identifyWalletError(error);
  return errorInfo.type === WalletErrorTypes.PENDING_TRANSACTION;
};

/**
 * Attempts to provide recovery actions based on error type
 */
export const getRecoveryActions = (error) => {
  const errorInfo = identifyWalletError(error);
  
  const actions = [];
  
  if (errorInfo.type === WalletErrorTypes.PENDING_TRANSACTION) {
    actions.push({
      label: 'Clear Pending State & Retry',
      action: 'clear-and-retry',
      primary: true
    });
    actions.push({
      label: 'Open Pera Wallet Guide',
      action: 'open-guide',
      primary: false
    });
  }
  
  if (errorInfo.canRetry) {
    actions.push({
      label: 'Try Again',
      action: 'retry',
      primary: !actions.some(a => a.primary)
    });
  }
  
  actions.push({
    label: 'Cancel',
    action: 'cancel',
    primary: false
  });
  
  return actions;
};

export default {
  WalletErrorTypes,
  identifyWalletError,
  formatWalletError,
  canClearPendingTransaction,
  getRecoveryActions
};
