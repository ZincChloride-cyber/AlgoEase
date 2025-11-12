import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import algosdk from 'algosdk/dist/browser/algosdk.min.js';
import { PeraWalletConnect } from '@perawallet/connect';
import { Buffer } from 'buffer';
import contractUtils, { BOUNTY_STATUS } from '../utils/contractUtils';

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
        throw new Error('A transaction is already in progress. Please complete or cancel it first.');
      }

      console.log('Signing transaction group with', txns.length, 'transactions');

      try {
        setPendingTransaction(true);
        
        // Add a small delay to ensure any previous transaction is fully cleared
        await new Promise(resolve => setTimeout(resolve, 300));
        
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
        
        // Pera Wallet expects transactions in a specific format
        // Each transaction needs to be properly formatted for signing
        const txnGroup = txns.map((txn) => {
          // Verify the transaction is valid
          if (!txn) {
            console.error('Invalid transaction: transaction is null or undefined');
            throw new Error('Invalid transaction - transaction is null');
          }

          // Return transaction in Pera Wallet format
          // The txn should be the raw Transaction object
          return {
            txn: txn,
            // Optional: specify signers if different from txn.from
            // signers: [account]
          };
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

        // Sign the transaction group using Pera Wallet
        // IMPORTANT: Pera Wallet expects an array of transaction groups
        // Pass the transactions wrapped in an array
        const signedTxns = await peraWallet.signTransaction([txnGroup]);

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

        // Handle specific error codes
        if (error.code === 4100 || (error.message && error.message.includes('4100'))) {
          // Force clear the pending state since this is a wallet-side issue
          setPendingTransaction(false);
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
        throw new Error('A transaction is already in progress. Please complete or cancel it first.');
      }

      try {
        setPendingTransaction(true);
        
        // Add a small delay to ensure any previous transaction is fully cleared
        await new Promise(resolve => setTimeout(resolve, 300));
        
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

        // Handle specific error codes
        if (error.code === 4100 || (error.message && error.message.includes('4100'))) {
          // Force clear the pending state since this is a wallet-side issue
          setPendingTransaction(false);
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
      let latestState = null;
      try {
        latestState = await contractUtils.getCurrentBounty();
        setContractState(latestState);
      } catch (stateError) {
        console.warn('Unable to refresh contract state before creating bounty:', stateError);
      }

      const bountyIsActive =
        latestState &&
        typeof latestState.status === 'number' &&
        latestState.amount > 0 &&
        latestState.status !== BOUNTY_STATUS.CLAIMED &&
        latestState.status !== BOUNTY_STATUS.REFUNDED;

      if (bountyIsActive) {
        throw new Error(
          'A bounty is already active on this contract. Complete or refund it from My Bounties before creating a new one.'
        );
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

      // Re-check contract state to surface clearer messaging on logic failures
      let stateAfterFailure = null;
      try {
        stateAfterFailure = await contractUtils.getCurrentBounty();
        setContractState(stateAfterFailure);
      } catch (stateRefreshError) {
        console.warn('Unable to inspect contract state after failed bounty creation:', stateRefreshError);
      }

      const stillActive =
        stateAfterFailure &&
        typeof stateAfterFailure.status === 'number' &&
        stateAfterFailure.amount > 0 &&
        stateAfterFailure.status !== BOUNTY_STATUS.CLAIMED &&
        stateAfterFailure.status !== BOUNTY_STATUS.REFUNDED;

      if (stillActive) {
        throw new Error(
          'The smart contract rejected this transaction because an earlier bounty is still open. Visit My Bounties to approve, claim, or refund it before trying again.'
        );
      }

      throw error;
    }
  };

  const acceptBounty = async () => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    try {
      const txn = await contractUtils.acceptBounty(account);
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

  const approveBounty = async () => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    try {
      const txn = await contractUtils.approveBounty(account);
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

  const claimBounty = async () => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    try {
      const txn = await contractUtils.claimBounty(account);
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

  const refundBounty = async () => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    try {
      const txn = await contractUtils.refundBounty(account);
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

  const canPerformAction = (action) => {
    if (!account || !contractState) return false;
    return contractUtils.canPerformAction(account, action, contractState);
  };

  // Force clear pending transaction state
  const clearPendingTransaction = () => {
    console.log('🧹 Manually clearing pending transaction state');
    setPendingTransaction(false);
  };

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
    // Smart contract functions
    contractState,
    isLoadingContract,
    loadContractState,
    createBounty,
    acceptBounty,
    approveBounty,
    claimBounty,
    refundBounty,
    canPerformAction
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
