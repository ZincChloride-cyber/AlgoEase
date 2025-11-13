import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import algosdk from 'algosdk/dist/browser/algosdk.min.js';
import { PeraWalletConnect } from '@perawallet/connect';
import { Buffer } from 'buffer';
import contractUtils, { BOUNTY_STATUS, GLOBAL_STATE_KEYS } from '../utils/contractUtils';

if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer;
}

const WalletContext = createContext();

const normalizeSignedTxn = (signedTxn) => {
  if (!signedTxn) {
    throw new Error('Signed transaction payload is empty.');
  }

  if (signedTxn instanceof Uint8Array) {
    return signedTxn;
  }

  if (Array.isArray(signedTxn) && signedTxn.length > 0) {
    return normalizeSignedTxn(signedTxn[0]);
  }

  if (signedTxn.blob) {
    return Uint8Array.from(Buffer.from(signedTxn.blob, 'base64'));
  }

  if (typeof signedTxn === 'string') {
    return Uint8Array.from(Buffer.from(signedTxn, 'base64'));
  }

  if (signedTxn.signedTxn) {
    return Uint8Array.from(Buffer.from(signedTxn.signedTxn, 'base64'));
  }

  throw new Error('Unsupported signed transaction format returned by wallet.');
};

// Detect if user is on mobile or desktop
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Initialize Pera Wallet Connect with optimized settings
// Force web wallet for desktop users
const peraWallet = new PeraWalletConnect({
  shouldShowSignTxnToast: true,
  chainId: 416002, // TestNet
  // Enable web wallet for desktop browsers
  compactMode: false
});

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [contractState, setContractState] = useState(null);
  const [isLoadingContract, setIsLoadingContract] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState(false);

  // Algorand TestNet configuration
  const algodClient = new algosdk.Algodv2(
    '',
    'https://testnet-api.algonode.cloud',
    ''
  );

  // Check for reconnection on mount
  useEffect(() => {
    // Check if Pera Wallet was previously connected
    peraWallet
      .reconnectSession()
      .then((accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          // Clear any stuck pending state on reconnection
          setPendingTransaction(false);
          console.log('Pera Wallet reconnected:', accounts[0]);
        }
      })
      .catch((error) => {
        console.log('Pera Wallet not previously connected');
      });
  }, []);

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      console.log('Initializing Pera Wallet connection...');

      const accounts = await peraWallet.connect();
      console.log('Pera Wallet returned accounts:', accounts);
      
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        // Clear any stuck pending state on new connection
        setPendingTransaction(false);
        console.log('✅ Pera Wallet connected successfully:', accounts[0]);
        
        peraWallet.connector?.on('disconnect', () => {
          console.log('Pera Wallet disconnected');
          disconnectWallet();
        });
        
        return;
      }
      
      throw new Error('Failed to connect wallet. Please try again.');
      
    } catch (error) {
      console.error('❌ Failed to connect wallet:', error);
      
      // User-friendly error messages
      if (error.message && error.message.includes('rejected')) {
        alert('Connection was cancelled. Please try again.');
      } else {
        alert('Failed to connect wallet: ' + error.message);
      }
    } finally {
      setIsConnecting(false);
    }
  };


  const disconnectWallet = async () => {
    try {
      await peraWallet.disconnect();
      
      setAccount(null);
      setIsConnected(false);
      console.log('Wallet disconnected');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const signTransactionGroup = useCallback(
    async (txns) => {
      if (!isConnected || !account) {
        throw new Error('No wallet connected. Please connect your wallet first.');
      }

      // Check if there's already a pending transaction
      if (pendingTransaction) {
        console.warn('⚠️ Transaction already in progress, clearing state and retrying...');
        // Clear the pending state and wait a bit longer
        setPendingTransaction(false);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log('Signing transaction group with', txns.length, 'transactions');

      try {
        setPendingTransaction(true);
        
        // Add a delay to ensure any previous transaction is fully cleared
        // Increased delay to allow Pera Wallet to clear any pending state
        // Also helps prevent race conditions
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Log detailed transaction info for debugging
        console.log('🔍 Transaction Details:');
        txns.forEach((txn, idx) => {
          console.log(`  Transaction ${idx}:`, {
            type: txn.constructor.name,
            from: txn.from ? algosdk.encodeAddress(txn.from.publicKey) : 'unknown',
            hasGroup: !!txn.group,
            fee: txn.fee
          });
        });
        
        // Verify all transactions are valid before formatting
        txns.forEach((txn, idx) => {
          if (!txn) {
            throw new Error(`Transaction ${idx} is null or undefined`);
          }
          if (typeof txn.toByte !== 'function') {
            throw new Error(`Transaction ${idx} is missing toByte method. Type: ${typeof txn}, Constructor: ${txn.constructor?.name}`);
          }
          if (!txn.from) {
            throw new Error(`Transaction ${idx} is missing 'from' address`);
          }
        });

        // Pera Wallet expects transactions in a specific format
        // Each transaction needs to be properly formatted for signing
        const txnGroup = txns.map((txn, idx) => {
          try {
            // Verify the transaction has required properties
            const fromAddr = txn.from ? (typeof txn.from === 'string' ? txn.from : algosdk.encodeAddress(txn.from.publicKey)) : null;
            
            console.log(`Transaction ${idx} details:`, {
              type: txn.constructor.name,
              from: fromAddr,
              hasGroup: !!txn.group,
              groupId: txn.group ? Buffer.from(txn.group).toString('base64') : 'none',
              fee: txn.fee,
              hasToByte: typeof txn.toByte === 'function'
            });

            // Return transaction in Pera Wallet format
            // The txn should be the raw Transaction object
            return {
              txn: txn,
              // Optional: specify signers if different from txn.from
              // signers: [account]
            };
          } catch (err) {
            console.error(`Error formatting transaction ${idx}:`, err);
            throw new Error(`Failed to format transaction ${idx}: ${err.message}`);
          }
        });

        console.log('📤 Prepared transaction group for signing:', {
          count: txnGroup.length,
          groupSize: txns[0]?.group ? 'Grouped' : 'Individual',
          hasValidTransactions: txnGroup.every(t => t.txn && typeof t.txn.toByte === 'function')
        });

        console.log('🔗 Opening Pera Wallet for signing...');
        console.log('💡 If Pera Wallet doesn\'t open:');
        console.log('   - On Desktop: Use Pera Wallet web (web.perawallet.app)');
        console.log('   - On Mobile: Make sure Pera Wallet app is installed');
        console.log('   - Check browser console for errors');

        // Verify transactions can be serialized before sending
        console.log('🔍 Verifying transaction serialization...');
        console.log('🔍 DEBUG: About to serialize transactions, count:', txns.length);
        try {
          txns.forEach((txn, idx) => {
            const bytes = txn.toByte();
            console.log(`Transaction ${idx} serialized successfully:`, bytes.length, 'bytes');
          });
        } catch (err) {
          console.error('❌ Transaction serialization failed:', err);
          throw new Error(`Transaction cannot be serialized: ${err.message}`);
        }

        // Sign the transaction group using Pera Wallet
        // IMPORTANT: Pera Wallet expects an array of transaction groups
        // Pass the transactions wrapped in an array
        console.log('Calling peraWallet.signTransaction with:', {
          groupCount: 1,
          txnCount: txnGroup.length,
          firstTxnType: txnGroup[0]?.txn?.constructor?.name,
          peraWalletType: typeof peraWallet,
          hasSignTransaction: typeof peraWallet.signTransaction === 'function'
        });
        
        // Verify peraWallet is properly initialized
        if (!peraWallet || typeof peraWallet.signTransaction !== 'function') {
          throw new Error('Pera Wallet is not properly initialized. Please refresh the page and reconnect your wallet.');
        }

        // Check if wallet is actually connected - use account state instead of peraWallet.isConnected
        const isDesktop = !isMobile();
        
        console.log('Pera Wallet connection status:', {
          isConnected: isConnected,
          isDesktop,
          hasConnector: !!peraWallet.connector,
          account: account,
          connectorType: peraWallet.connector?.constructor?.name
        });

        if (!isConnected || !account) {
          throw new Error('Wallet is not connected. Please reconnect your wallet.');
        }

        // On desktop, Pera Wallet might need web wallet
        if (isDesktop) {
          console.log('🖥️ Desktop detected - Pera Wallet may need web wallet (web.perawallet.app)');
          console.log('💡 If transaction doesn\'t appear, open https://web.perawallet.app in another tab');
        }

        // Log the exact format being sent to Pera Wallet
        console.log('📋 Transaction group format for Pera Wallet:', {
          outerArrayLength: 1,
          innerArrayLength: txnGroup.length,
          firstTxnHasTxn: !!txnGroup[0]?.txn,
          firstTxnType: txnGroup[0]?.txn?.constructor?.name
        });

        // Add timeout wrapper to detect if signTransaction hangs
        console.log('⏳ Calling peraWallet.signTransaction...');
        console.log('⏳ DEBUG: signTransaction call starting now...');
        
        // Wrap in try-catch to catch any immediate errors
        let signPromise;
        try {
          signPromise = peraWallet.signTransaction([txnGroup]);
          console.log('⏳ DEBUG: signTransaction promise created, type:', typeof signPromise);
        } catch (syncError) {
          console.error('❌ DEBUG: signTransaction threw synchronous error:', syncError);
          throw new Error(`Failed to initiate transaction signing: ${syncError.message}`);
        }
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            console.error('❌ DEBUG: Timeout reached - Pera Wallet did not respond');
            reject(new Error('Pera Wallet signTransaction timed out after 30 seconds. The wallet may not be responding. Please check if Pera Wallet is open and try again.'));
          }, 30000);
        });

        console.log('⏳ Waiting for Pera Wallet to respond...');
        console.log('⏳ DEBUG: About to await Promise.race...');
        const signedTxns = await Promise.race([signPromise, timeoutPromise]);
        console.log('✅ DEBUG: Promise.race completed, got result:', signedTxns);

        console.log('✅ Received signed transactions:', {
          count: signedTxns?.length,
          isArray: Array.isArray(signedTxns),
          type: typeof signedTxns
        });

        if (!signedTxns || signedTxns.length === 0) {
          throw new Error('Failed to sign transaction group with Pera Wallet.');
        }

        // Flatten and normalize the signed transactions
        return signedTxns.flat().map(normalizeSignedTxn);
      } catch (error) {
        console.error('Failed to sign transaction group:', error);

        // Handle specific error codes - pending transaction errors
        if (error.code === 4100 || 
            (error.message && (
              error.message.includes('4100') || 
              error.message.includes('pending') || 
              error.message.includes('Pending') ||
              error.message.includes('another transaction') ||
              error.message.includes('Another transaction')
            ))) {
          // Force clear the pending state immediately since this is a wallet-side issue
          console.error('⚠️ Pending transaction error detected (code 4100). Clearing state...');
          setPendingTransaction(false);
          
          // Wait a moment to ensure state is cleared
          await new Promise(resolve => setTimeout(resolve, 200));
          
          throw new Error('Another transaction is pending in Pera Wallet. Please complete or reject it in your wallet app, then try again.');
        }
        if (error.message && error.message.includes('User Rejected Request')) {
          throw new Error('Transaction signing was cancelled by user.');
        }
        if (error.message && error.message.includes('rejected')) {
          throw new Error('Transaction signing was cancelled by user.');
        }
        if (error.message && error.message.includes('cancelled')) {
          throw new Error('Transaction signing was cancelled by user.');
        }
        if (error.message && error.message.includes('SignTxnsError')) {
          throw new Error('Failed to sign transaction. Please check your wallet connection.');
        }

        throw error;
      } finally {
        // Always clear pending state after a shorter delay
        setTimeout(() => {
          setPendingTransaction(false);
        }, 500);
      }
    },
    [account, isConnected, pendingTransaction]
  );

  const signTransaction = useCallback(
    async (txn) => {
      if (!isConnected || !account) {
        throw new Error('No wallet connected. Please connect your wallet first.');
      }

      // Check if there's already a pending transaction
      if (pendingTransaction) {
        console.warn('⚠️ Transaction already in progress, clearing state and retrying...');
        // Clear the pending state and wait a bit longer
        setPendingTransaction(false);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      try {
        setPendingTransaction(true);
        
        // Add a delay to ensure any previous transaction is fully cleared
        // Increased delay to allow Pera Wallet to clear any pending state
        // Also helps prevent race conditions
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Verify the transaction has the required methods
        if (!txn || typeof txn.toByte !== 'function') {
          console.error('Invalid transaction object:', txn);
          throw new Error('Invalid transaction format - missing toByte method');
        }

        // Format for Pera Wallet
        const txnToSign = [{
          txn: txn,  // Pass the raw Transaction object
          signers: [account]  // Specify which account should sign
        }];

        // Sign single transaction using Pera Wallet
        const signedTxns = await peraWallet.signTransaction([txnToSign]);

        if (!signedTxns || signedTxns.length === 0 || signedTxns[0].length === 0) {
          throw new Error('Wallet did not return a signed transaction.');
        }

        return normalizeSignedTxn(signedTxns[0][0]);
      } catch (error) {
        console.error('Failed to sign transaction:', error);

        // Handle specific error codes - pending transaction errors
        if (error.code === 4100 || 
            (error.message && (
              error.message.includes('4100') || 
              error.message.includes('pending') || 
              error.message.includes('Pending') ||
              error.message.includes('another transaction') ||
              error.message.includes('Another transaction')
            ))) {
          // Force clear the pending state immediately since this is a wallet-side issue
          console.error('⚠️ Pending transaction error detected (code 4100). Clearing state...');
          setPendingTransaction(false);
          
          // Wait a moment to ensure state is cleared
          await new Promise(resolve => setTimeout(resolve, 200));
          
          throw new Error('Another transaction is pending in Pera Wallet. Please complete or reject it in your wallet app, then try again.');
        }
        if (error.message && error.message.includes('User Rejected Request')) {
          throw new Error('Transaction signing was cancelled by user.');
        }
        if (error.message && error.message.includes('rejected')) {
          throw new Error('Transaction signing was cancelled by user.');
        }
        if (error.message && error.message.includes('cancelled')) {
          throw new Error('Transaction signing was cancelled by user.');
        }
        if (error.message && error.message.includes('SignTxnsError')) {
          throw new Error('Failed to sign transaction. Please check your wallet connection.');
        }

        throw error;
      } finally {
        // Always clear pending state after a shorter delay
        setTimeout(() => {
          setPendingTransaction(false);
        }, 500);
      }
    },
    [account, isConnected, pendingTransaction]
  );

  const getAccountInfo = async () => {
    if (!account) return null;
    
    try {
      const accountInfo = await algodClient.accountInformation(account).do();
      return accountInfo;
    } catch (error) {
      console.error('Failed to get account info:', error);
      return null;
    }
  };

  // Smart contract functions
  const loadContractState = useCallback(async () => {
    if (!contractUtils.getAppId()) {
      console.warn('Contract app ID not set');
      return null;
    }

    try {
      setIsLoadingContract(true);
      const state = await contractUtils.getCurrentBounty();
      setContractState(state);
      return state;
    } catch (error) {
      console.error('Failed to load contract state:', error);
      setContractState(null);
      return null;
    } finally {
      setIsLoadingContract(false);
    }
  }, []);

  useEffect(() => {
    loadContractState();
  }, [loadContractState]);

  useEffect(() => {
    if (isConnected) {
      loadContractState();
    }
  }, [isConnected, loadContractState]);

  const createBounty = async (amount, deadline, taskDescription, verifierAddress) => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    try {
      // Refresh contract state before attempting to create a new bounty
      // Removed: No longer checking for active bounties
      // Contract now supports creating multiple bounties simultaneously
      // The contract will track the latest bounty's state on-chain
      // Previous bounties' state may be overwritten, but funds remain locked until refunded
      
      // Still load state for reference, but don't block creation
      try {
        const latestState = await contractUtils.getCurrentBounty();
        setContractState(latestState);
      } catch (stateError) {
        console.warn('Unable to refresh contract state before creating bounty:', stateError);
      }

      // Build transactions
      const txns = await contractUtils.createBounty(
        account,
        amount,
        deadline,
        taskDescription,
        verifierAddress
      );

      // Sign transaction group (user will see wallet prompt here)
      const signedTxns = await signTransactionGroup(txns);

      // Submit transaction group to blockchain
      const txId = await contractUtils.submitTransactionGroup(signedTxns);
      
      // Wait for confirmation on blockchain
      await contractUtils.waitForConfirmation(txId);
      
      // Reload contract state
      await loadContractState();
      
      return txId;
    } catch (error) {
      console.error('Failed to create bounty:', error);

      if (error.message && error.message.includes('User Rejected Request')) {
        throw new Error('Transaction was cancelled. Please try again and approve the transaction in your wallet.');
      } else if (error.message && error.message.includes('SignTxnsError')) {
        throw new Error('Failed to sign transaction. Please check your wallet connection and try again.');
      }

      // Removed: No longer checking for existing bounties as blocking condition
      // Contract now supports multiple bounties, so this error handling is not needed
      // Still refresh state for reference
      try {
        const stateAfterFailure = await contractUtils.getCurrentBounty();
        setContractState(stateAfterFailure);
      } catch (stateRefreshError) {
        console.warn('Unable to inspect contract state after failed bounty creation:', stateRefreshError);
      }

      throw error;
    }
  };

  const acceptBounty = async (bountyId) => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    if (!bountyId) {
      throw new Error('Bounty ID is required');
    }

    try {
      const txn = await contractUtils.acceptBounty(account, bountyId);
      const signedTxn = await signTransaction(txn);
      const txId = await contractUtils.submitTransaction(signedTxn);
      
      await contractUtils.waitForConfirmation(txId);
      await loadContractState();
      
      return txId;
    } catch (error) {
      console.error('Failed to accept bounty:', error);
      throw error;
    }
  };

  const approveBounty = async (bountyId) => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    if (!bountyId) {
      throw new Error('Bounty ID is required');
    }

    try {
      const txn = await contractUtils.approveBounty(account, bountyId);
      const signedTxn = await signTransaction(txn);
      const txId = await contractUtils.submitTransaction(signedTxn);
      
      await contractUtils.waitForConfirmation(txId);
      await loadContractState();
      
      return txId;
    } catch (error) {
      console.error('Failed to approve bounty:', error);
      throw error;
    }
  };

  const rejectBounty = async (bountyId) => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    if (!bountyId) {
      throw new Error('Bounty ID is required');
    }

    try {
      const txn = await contractUtils.rejectBounty(account, bountyId);
      const signedTxn = await signTransaction(txn);
      const txId = await contractUtils.submitTransaction(signedTxn);
      
      await contractUtils.waitForConfirmation(txId);
      await loadContractState();
      
      return txId;
    } catch (error) {
      console.error('Failed to reject bounty:', error);
      throw error;
    }
  };

  const claimBounty = async (bountyId) => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    if (!bountyId) {
      throw new Error('Bounty ID is required');
    }

    try {
      const txn = await contractUtils.claimBounty(account, bountyId);
      const signedTxn = await signTransaction(txn);
      const txId = await contractUtils.submitTransaction(signedTxn);
      
      await contractUtils.waitForConfirmation(txId);
      await loadContractState();
      
      return txId;
    } catch (error) {
      console.error('Failed to claim bounty:', error);
      throw error;
    }
  };

  const refundBounty = async (bountyId) => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    if (!bountyId) {
      throw new Error('Bounty ID is required');
    }

    try {
      const txn = await contractUtils.refundBounty(account, bountyId);
      const signedTxn = await signTransaction(txn);
      const txId = await contractUtils.submitTransaction(signedTxn);
      
      await contractUtils.waitForConfirmation(txId);
      await loadContractState();
      
      return txId;
    } catch (error) {
      console.error('Failed to refund bounty:', error);
      throw error;
    }
  };

  // Auto refund - calls auto_refund method on contract (anyone can call after deadline)
  const autoRefundBounty = async (bountyId) => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    if (!bountyId) {
      throw new Error('Bounty ID is required');
    }

    try {
      const txn = await contractUtils.autoRefundBounty(account, bountyId);
      const signedTxn = await signTransaction(txn);
      const txId = await contractUtils.submitTransaction(signedTxn);
      
      await contractUtils.waitForConfirmation(txId);
      await loadContractState();
      
      return txId;
    } catch (error) {
      console.error('Failed to auto refund bounty:', error);
      throw error;
    }
  };

  const canPerformAction = (action) => {
    if (!account || !contractState) return false;
    return contractUtils.canPerformAction(account, action, contractState);
  };

  // Force clear pending transaction state
  const clearPendingTransaction = useCallback(() => {
    console.log('🧹 Manually clearing pending transaction state');
    setPendingTransaction(false);
    // Also try to reset any wallet-side state by disconnecting and reconnecting
    // But don't disconnect if wallet is connected - just clear our state
  }, []);

  // Check if Pera Wallet is ready (no pending transactions)
  const checkWalletReady = useCallback(async () => {
    if (!isConnected || !account) {
      return false;
    }

    try {
      // Clear any pending state first
      setPendingTransaction(false);
      
      // Wait a moment for Pera Wallet to sync
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return true;
    } catch (error) {
      console.error('Error checking wallet readiness:', error);
      return false;
    }
  }, [isConnected, account]);

  const value = {
    account,
    isConnected,
    isConnecting,
    connectWallet,
    disconnectWallet,
    signTransaction,
    signTransactionGroup,
    getAccountInfo,
    algodClient,
    pendingTransaction,
    clearPendingTransaction,
    checkWalletReady,
    // Smart contract functions
    contractState,
    isLoadingContract,
    loadContractState,
    createBounty,
    acceptBounty,
    approveBounty,
    rejectBounty,
    claimBounty,
    refundBounty,
    autoRefundBounty,
    canPerformAction
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
