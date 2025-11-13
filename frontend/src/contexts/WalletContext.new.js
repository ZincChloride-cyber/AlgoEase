import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import algosdk from 'algosdk/dist/browser/algosdk.min.js';
import { PeraWalletConnect } from '@perawallet/connect';
import { Buffer } from 'buffer';
import contractUtils from '../utils/contractUtils';

if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer;
}

const WalletContext = createContext();

// Initialize Pera Wallet Connect
const peraWallet = new PeraWalletConnect({
  shouldShowSignTxnToast: true,
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

  // Algorand TestNet configuration
  const algodClient = new algosdk.Algodv2(
    '',
    'https://testnet-api.algonode.cloud',
    ''
  );

  // Check for reconnection on mount
  useEffect(() => {
    peraWallet
      .reconnectSession()
      .then((accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
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

      console.log('Signing transaction group with', txns.length, 'transactions');

      try {
        // Pera Wallet's signTransaction expects an array of arrays of SignerTransaction objects
        // SignerTransaction format: { txn: Uint8Array (encoded txn), signers: [address] }
        
        const txnsToSign = txns.map((txn) => {
          // Get the encoded transaction bytes
          let encodedTxn;
          if (txn instanceof Uint8Array) {
            encodedTxn = txn;
          } else if (typeof txn.toByte === 'function') {
            encodedTxn = txn.toByte();
          } else {
            console.error('Invalid transaction object:', txn);
            throw new Error('Transaction must be an algosdk.Transaction instance or Uint8Array');
          }

          return {
            txn: encodedTxn,
            signers: [account],
          };
        });

        // Pass as a single group (array of SignerTransaction objects wrapped in an array)
        const signedTxns = await peraWallet.signTransaction([txnsToSign]);

        console.log('Pera Wallet returned signed transactions:', signedTxns);

        if (!signedTxns || signedTxns.length === 0) {
          throw new Error('Failed to sign transaction group with Pera Wallet.');
        }

        // signedTxns is an array of Uint8Arrays (signed transaction bytes)
        return signedTxns;
      } catch (error) {
        console.error('Failed to sign transaction group:', error);

        if (error.message && (error.message.includes('User Rejected') || error.message.includes('rejected'))) {
          throw new Error('Transaction signing was cancelled by user.');
        }
        if (error.message && error.message.includes('SignTxnsError')) {
          throw new Error('Failed to sign transaction. Please check your wallet connection.');
        }

        throw error;
      }
    },
    [account, isConnected]
  );

  const signTransaction = useCallback(
    async (txn) => {
      if (!isConnected || !account) {
        throw new Error('No wallet connected. Please connect your wallet first.');
      }

      try {
        // Get the encoded transaction bytes
        let encodedTxn;
        if (txn instanceof Uint8Array) {
          encodedTxn = txn;
        } else if (typeof txn.toByte === 'function') {
          encodedTxn = txn.toByte();
        } else {
          throw new Error('Transaction must be an algosdk.Transaction instance or Uint8Array');
        }

        // Sign single transaction (still needs to be wrapped in arrays)
        const signedTxns = await peraWallet.signTransaction([[{
          txn: encodedTxn,
          signers: [account],
        }]]);

        if (!signedTxns || signedTxns.length === 0) {
          throw new Error('Wallet did not return a signed transaction.');
        }

        return signedTxns[0];
      } catch (error) {
        console.error('Failed to sign transaction:', error);

        if (error.message && (error.message.includes('User Rejected') || error.message.includes('rejected'))) {
          throw new Error('Transaction signing was cancelled by user.');
        }
        if (error.message && error.message.includes('SignTxnsError')) {
          throw new Error('Failed to sign transaction. Please check your wallet connection.');
        }

        throw error;
      }
    },
    [account, isConnected]
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
      // Build transactions
      const txns = await contractUtils.createBounty(
        account,
        amount,
        deadline,
        taskDescription,
        verifierAddress
      );

      console.log('Created transaction group, signing...');

      // Sign transaction group (user will see wallet prompt here)
      const signedTxns = await signTransactionGroup(txns);

      console.log('Transactions signed, submitting to blockchain...');

      // Submit transaction group to blockchain
      const txId = await contractUtils.submitTransactionGroup(signedTxns);
      
      console.log('Transaction submitted:', txId);

      // Wait for confirmation on blockchain
      await contractUtils.waitForConfirmation(txId);
      
      console.log('Transaction confirmed!');

      // Reload contract state
      await loadContractState();
      
      return txId;
    } catch (error) {
      console.error('Failed to create bounty:', error);
      
      // Provide user-friendly error messages
      if (error.message && error.message.includes('User Rejected Request')) {
        throw new Error('Transaction was cancelled. Please try again and approve the transaction in your wallet.');
      } else if (error.message && error.message.includes('SignTxnsError')) {
        throw new Error('Failed to sign transaction. Please check your wallet connection and try again.');
      } else {
        throw error;
      }
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
